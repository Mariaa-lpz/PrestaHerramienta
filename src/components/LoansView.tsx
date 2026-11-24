import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  FileText,
  History,
  Inbox,
  Search,
  Send,
  Star,
  X,
} from 'lucide-react';
import {
  AppDatabase,
  IncidentSeverity,
  LoanStatus,
  PrestamoData,
  VecinoData,
} from '../domain/types';
import {
  ctrlAmpliacion,
  ctrlGestionar,
  ctrlHistorial,
} from '../domain/controllers';
import { calculateDaysInclusive, formatCurrency } from '../domain/repository';
import { ToolImage } from './ToolImage';

interface LoansViewProps {
  db: AppDatabase;
  currentUser: VecinoData;
  onAcceptRequest: (idSolicitud: number, datosEntrega?: string) => void;
  onRejectRequest: (idSolicitud: number, motivo: string) => void;
  onRequestExtension: (idPrestamo: number, nuevaFechaFin: string, motivo: string) => void;
  onRespondExtension: (idAmpliacion: number, aprobar: boolean) => void;
  onNotifyReturn: (idPrestamo: number) => void;
  onFinalizeInspection: (
    idPrestamo: number,
    opciones: {
      observaciones: string;
      hayIncidencia: boolean;
      incidenciaGravedad: IncidentSeverity;
      incidenciaDescripcion: string;
      dejarResena: boolean;
      puntuacion: number;
      comentarioResena: string;
    }
  ) => void;
  onReportIncident: (idPrestamo: number, gravedad: IncidentSeverity, descripcion: string) => void;
  onRebookTool: (idHerramienta: number) => void;
}

type LoanTab = 'recibidas' | 'activos' | 'enviadas' | 'historial';

const REJECT_CHIPS = [
  'La necesito yo mismo en esas fechas',
  'Está pendiente de revisión / mantenimiento',
  'No estaré en el edificio para la entrega',
];

/**
 * Boundaries agrupados para el ciclo operativo del préstamo:
 * - REQ005: InterfazGestionarSolicitudes
 * - REQ006: InterfazSolicitarAmpliacion
 * - REQ007: InterfazDevolucion / InterfazInspeccion
 * - REQ008: InterfazHistorial
 */
export const LoansView: React.FC<LoansViewProps> = ({
  db,
  currentUser,
  onAcceptRequest,
  onRejectRequest,
  onRequestExtension,
  onRespondExtension,
  onNotifyReturn,
  onFinalizeInspection,
  onReportIncident,
  onRebookTool,
}) => {
  const [activeTab, setActiveTab] = useState<LoanTab>('recibidas');

  // REQ005: Modales de aceptar (con datos de entrega) y rechazar
  const [acceptTargetId, setAcceptTargetId] = useState<number | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState('');
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // REQ006: Modal de ampliación de plazo
  const [extendTarget, setExtendTarget] = useState<PrestamoData | null>(null);
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  // REQ007: Modal InterfazInspeccion (Propietario)
  const [inspectTarget, setInspectTarget] = useState<PrestamoData | null>(null);
  const [inspectObservations, setInspectObservations] = useState('Devuelta limpia y en perfecto estado');
  const [hasIncident, setHasIncident] = useState(false);
  const [inspectIncSeverity, setInspectIncSeverity] = useState<IncidentSeverity>('Leve');
  const [inspectIncDesc, setInspectIncDesc] = useState('');
  const [wantsReview, setWantsReview] = useState(true);
  const [inspectRating, setInspectRating] = useState(5);
  const [inspectComment, setInspectComment] = useState('');

  // Incidencia rápida durante préstamo en curso
  const [incidentTarget, setIncidentTarget] = useState<PrestamoData | null>(null);
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>('Leve');
  const [incidentDesc, setIncidentDesc] = useState('');

  // REQ008: Criterios de búsqueda en Historial y detalle seleccionado
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyRole, setHistoryRole] = useState<'todos' | 'recibidos' | 'realizados'>('todos');
  const [historyStatus, setHistoryStatus] = useState<'' | LoanStatus>('');
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);

  const idUser = currentUser.idVecino;

  // REQ005: ControladorGestionarSolicitudes.consultarSolicitudesPendientes()
  const received = useMemo(
    () => ctrlGestionar.consultarSolicitudesPendientes(db, idUser),
    [db, idUser]
  );

  // REQ008: ControladorHistorial.obtenerHistorial() -> par (recibidos + realizados)
  const historialCompleto = useMemo(
    () => ctrlHistorial.obtenerHistorial(db, idUser),
    [db, idUser]
  );

  const sent = useMemo(
    () => db.solicitudes.filter((s) => s.idVecinoSolicitante === idUser),
    [db.solicitudes, idUser]
  );

  const active = useMemo(
    () => historialCompleto.listaPrestamos.filter((p) => p.estado !== 'Finalizado'),
    [historialCompleto.listaPrestamos]
  );

  // REQ008: opt filtrarPrestamos() -> Prestamo.buscarPrestamos()
  const filteredHistory = useMemo(
    () =>
      ctrlHistorial.filtrarPrestamos(db, idUser, {
        texto: historyQuery,
        rol: historyRole,
        estado: historyStatus,
      }),
    [db, idUser, historyQuery, historyRole, historyStatus]
  );

  // REQ008: opt obtenerDetallesPrestamo() -> Prestamo.consultarDetalle()
  const receiptTarget = useMemo(
    () => (detailTargetId ? ctrlHistorial.obtenerDetallesPrestamo(db, detailTargetId) : null),
    [db, detailTargetId]
  );

  // REQ006: Comprobación en vivo de disponibilidad para ampliación (Herramienta.comprobar)
  const extensionAvailability = useMemo(() => {
    if (!extendTarget || !extendDate) return null;
    return ctrlAmpliacion.comprobarDisponibilidad(db, extendTarget.idPrestamo, extendDate);
  }, [db, extendTarget, extendDate]);

  const tabs: { id: LoanTab; label: string; count: number }[] = [
    { id: 'recibidas', label: 'Solicitudes recibidas', count: received.length },
    { id: 'activos', label: 'Préstamos en curso', count: active.length },
    { id: 'enviadas', label: 'Mis solicitudes', count: sent.length },
    { id: 'historial', label: 'Historial de préstamos', count: historialCompleto.listaPrestamos.length },
  ];

  const getDaysRemainingLabel = (fechaFin: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(`${fechaFin}T00:00:00`);
    const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `Retraso de ${Math.abs(diff)} d`;
    if (diff === 0) return 'Entrega hoy';
    if (diff === 1) return 'Entrega mañana';
    return `Quedan ${diff} días`;
  };

  const pendingInspectionCount = active.filter((p) => p.estado === 'PendienteInspeccion').length;
  const completedCount = historialCompleto.listaPrestamos.filter((p) => p.estado === 'Finalizado').length;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <p className="text-xs font-medium text-[var(--text-muted)]">
          Operaciones de alquiler · {currentUser.nombre}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Préstamos, devoluciones e historial
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona solicitudes pendientes, solicita ampliaciones de plazo, inspecciona devoluciones y consulta el
          historial completo de préstamos realizados y recibidos.
        </p>
      </header>

      <div className="grid grid-cols-2 divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Solicitudes por revisar</p>
          <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--accent)]">{received.length}</p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">En curso ahora</p>
          <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">{active.length}</p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Pendiente inspección</p>
          <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">
            {pendingInspectionCount}
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Finalizados</p>
          <p className="mt-0.5 font-mono-tabular text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Selector segmentado de pestañas */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* REQ005 — InterfazGestionarSolicitudes */}
      {activeTab === 'recibidas' && (
        <div className="space-y-4">
          {received.length === 0 ? (
            <EmptyCard
              icon={<Inbox className="h-8 w-8 text-[var(--text-muted)]" />}
              title="Bandeja de entrada al día"
              description="No tienes peticiones pendientes de aprobación sobre tus herramientas."
            />
          ) : (
            <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              {received.map((sol) => {
                const tool = db.herramientas.find((h) => h.idHerramienta === sol.idHerramienta);
                const requester = db.vecinos.find((v) => v.idVecino === sol.idVecinoSolicitante);
                const days = calculateDaysInclusive(sol.fechaInicio, sol.fechaFin);
                const total = tool ? days * tool.precio : 0;

                return (
                  <div
                    key={sol.idSolicitud}
                    className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      {tool && (
                        <div className="hidden h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] sm:block">
                          <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--accent)]">Pendiente de aprobar</span>
                          <span>·</span>
                          <span className="font-mono-tabular">
                            {sol.fechaInicio} → {sol.fechaFin} ({days} {days === 1 ? 'día' : 'días'})
                          </span>
                          <span>·</span>
                          <span>{sol.franjaRecogida}</span>
                        </div>

                        <h3 className="text-base font-bold text-[var(--text-primary)]">{tool?.titulo}</h3>

                        <p className="text-sm text-[var(--text-secondary)]">
                          Solicitado por <strong className="text-[var(--text-primary)]">{requester?.nombre}</strong> (
                          {requester?.direccion}) · Importe:{' '}
                          <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                            {total === 0 ? 'Gratuito' : formatCurrency(total)}
                          </span>
                        </p>

                        <p className="rounded-lg bg-[var(--bg-subtle)] px-3.5 py-2 text-sm text-[var(--text-secondary)]">
                          &ldquo;{sol.mensaje}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAcceptTargetId(sol.idSolicitud);
                          setDeliveryDetails(`Entrega en ${currentUser.direccion} · ${sol.franjaRecogida}`);
                        }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                      >
                        <Check className="h-4 w-4" />
                        Aceptar solicitud
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectTarget(sol.idSolicitud);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                      >
                        <X className="h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REQ006 + REQ007 — Préstamos en curso (InterfazSolicitarAmpliacion + InterfazDevolucion + InterfazInspeccion) */}
      {activeTab === 'activos' && (
        <div className="space-y-4">
          {active.length === 0 ? (
            <EmptyCard
              icon={<CalendarClock className="h-8 w-8 text-[var(--text-muted)]" />}
              title="Sin préstamos en curso"
              description="Cuando aceptes una solicitud o recibas una herramienta aparecerá aquí con su comprobante."
            />
          ) : (
            <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              {active.map((loan) => {
                const tool = db.herramientas.find((h) => h.idHerramienta === loan.idHerramienta);
                const isBorrower = loan.idPrestatario === idUser;
                const counterpart = db.vecinos.find(
                  (v) => v.idVecino === (isBorrower ? tool?.idPropietario : loan.idPrestatario)
                );
                const pendingExt = db.ampliaciones.find(
                  (a) => a.idPrestamo === loan.idPrestamo && a.estado === 'Pendiente'
                );
                const isPendingInspection = loan.estado === 'PendienteInspeccion';

                return (
                  <div key={loan.idPrestamo} className="space-y-4 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        {tool && (
                          <div className="hidden h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] sm:block">
                            <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                              {loan.codigoEntrega}
                            </span>
                            <span>·</span>
                            <span
                              className={`font-semibold ${
                                isPendingInspection
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-[var(--accent)]'
                              }`}
                            >
                              {isPendingInspection
                                ? 'Devuelta · Pendiente inspección'
                                : isBorrower
                                ? 'En tu posesión'
                                : 'En préstamo'}
                            </span>
                            <span>·</span>
                            <span className="font-mono-tabular">{getDaysRemainingLabel(loan.fechaFin)}</span>
                            <span>·</span>
                            <span className="font-mono-tabular">Devolución {loan.fechaFin}</span>
                          </div>

                          <h3 className="text-base font-bold text-[var(--text-primary)]">{tool?.titulo}</h3>

                          <p className="text-sm text-[var(--text-secondary)]">
                            {isBorrower ? 'Propietario' : 'Prestatario'}:{' '}
                            <strong className="text-[var(--text-primary)]">{counterpart?.nombre}</strong> (
                            {counterpart?.direccion}) · Tarifa:{' '}
                            <span className="font-mono-tabular">{formatCurrency(loan.costeTotal)}</span> · Fianza:{' '}
                            <span className="font-mono-tabular">{formatCurrency(loan.fianzaRetenida)}</span>
                          </p>

                          {loan.datosEntrega && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Entrega acordada: {loan.datosEntrega}
                            </p>
                          )}

                          {/* Progreso operativo del préstamo */}
                          <div className="grid max-w-md grid-cols-3 gap-2 pt-1.5 text-[11px]">
                            <div className="space-y-1">
                              <div className="h-1 rounded-full bg-emerald-600" />
                              <span className="block font-medium text-[var(--text-secondary)]">1. Entregada</span>
                            </div>
                            <div className="space-y-1">
                              <div
                                className={`h-1 rounded-full ${
                                  isPendingInspection ? 'bg-emerald-600' : 'bg-[var(--accent)]'
                                }`}
                              />
                              <span className="block font-medium text-[var(--text-secondary)]">2. En uso</span>
                            </div>
                            <div className="space-y-1">
                              <div
                                className={`h-1 rounded-full ${
                                  isPendingInspection ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'
                                }`}
                              />
                              <span
                                className={`block ${
                                  isPendingInspection
                                    ? 'font-semibold text-[var(--accent)]'
                                    : 'text-[var(--text-muted)]'
                                }`}
                              >
                                3. Inspección
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDetailTargetId(loan.idPrestamo)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Comprobante
                        </button>

                        {/* REQ006 & REQ007 Paso 1: Acciones del Cliente (Prestatario) */}
                        {isBorrower && !isPendingInspection && (
                          <>
                            <button
                              type="button"
                              disabled={Boolean(pendingExt)}
                              onClick={() => {
                                ctrlAmpliacion.solicitarAmpliacionPlazo(db, loan.idPrestamo);
                                setExtendTarget(loan);
                                setExtendDate('');
                                setExtendReason('');
                              }}
                              className="whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                            >
                              Solicitar ampliación
                            </button>
                            <button
                              type="button"
                              onClick={() => onNotifyReturn(loan.idPrestamo)}
                              className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                            >
                              Devolver herramienta
                            </button>
                          </>
                        )}

                        {isBorrower && isPendingInspection && (
                          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            Esperando inspección de {counterpart?.nombre}
                          </span>
                        )}

                        {/* REQ007 Paso 2: Acción del Propietario (InterfazInspeccion) */}
                        {!isBorrower && (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectTarget(loan);
                              setInspectObservations('Devuelta limpia y en perfecto estado');
                              setHasIncident(false);
                              setInspectIncSeverity('Leve');
                              setInspectIncDesc('');
                              setWantsReview(true);
                              setInspectRating(5);
                              setInspectComment('');
                            }}
                            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white ${
                              isPendingInspection
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
                            }`}
                          >
                            {isPendingInspection ? 'Inspeccionar devolución' : 'Confirmar devolución'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIncidentTarget(loan);
                            setIncidentSeverity('Leve');
                            setIncidentDesc('');
                          }}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Incidencia
                        </button>
                      </div>
                    </div>

                    {/* REQ006: Solicitud de ampliación pendiente */}
                    {pendingExt && (
                      <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50/70 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-amber-700/50 dark:bg-amber-950/30">
                        <div className="space-y-0.5 text-[var(--text-primary)]">
                          <p className="font-semibold">
                            Solicitud de ampliación hasta el{' '}
                            <span className="font-mono-tabular">{pendingExt.nuevaFechaFin}</span>
                          </p>
                          {pendingExt.motivo ? (
                            <p className="text-[var(--text-secondary)]">&ldquo;{pendingExt.motivo}&rdquo;</p>
                          ) : (
                            <p className="text-[var(--text-muted)]">Sin motivo adicional adjunto.</p>
                          )}
                        </div>
                        {!isBorrower ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onRespondExtension(pendingExt.idAmpliacion, true)}
                              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 font-semibold text-white hover:bg-[var(--accent-hover)]"
                            >
                              Autorizar prórroga
                            </button>
                            <button
                              type="button"
                              onClick={() => onRespondExtension(pendingExt.idAmpliacion, false)}
                              className="rounded-lg border border-red-300 bg-[var(--bg-surface)] px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                            >
                              Denegar
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-[var(--text-muted)]">Pendiente de respuesta</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Solicitudes enviadas */}
      {activeTab === 'enviadas' && (
        <div className="space-y-4">
          {sent.length === 0 ? (
            <EmptyCard
              icon={<Send className="h-8 w-8 text-[var(--text-muted)]" />}
              title="No has enviado solicitudes"
              description="Explora el catálogo comunitario para reservar herramientas de tus vecinos."
            />
          ) : (
            <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              {sent.map((sol) => {
                const tool = db.herramientas.find((h) => h.idHerramienta === sol.idHerramienta);
                const owner = db.vecinos.find((v) => v.idVecino === tool?.idPropietario);
                const statusColor =
                  sol.estado === 'Aceptada'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : sol.estado === 'Rechazada'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[var(--accent)]';

                return (
                  <div key={sol.idSolicitud} className="flex items-start gap-4 p-5">
                    {tool && (
                      <div className="hidden h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] sm:block">
                        <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className={`font-semibold ${statusColor}`}>{sol.estado}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">
                          {sol.fechaInicio} → {sol.fechaFin}
                        </span>
                        <span>·</span>
                        <span>Propietario: {owner?.nombre}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{tool?.titulo}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Observaciones: &ldquo;{sol.mensaje}&rdquo;</p>
                      {sol.datosEntrega && (
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Entrega confirmada: {sol.datosEntrega}
                        </p>
                      )}
                      {sol.motivoRechazo && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                          Motivo del rechazo: {sol.motivoRechazo}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REQ008 — InterfazHistorial */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Resumen paralelo: prestamosRecibidos y prestamosRealizados */}
          <div className="grid grid-cols-1 divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-3.5">
              <p className="text-xs text-[var(--text-muted)]">Préstamos recibidos (como cliente)</p>
              <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">
                {historialCompleto.prestamosRecibidos.length}
              </p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-xs text-[var(--text-muted)]">Préstamos realizados (como propietario)</p>
              <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">
                {historialCompleto.prestamosRealizados.length}
              </p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-xs text-[var(--text-muted)]">Total en historial</p>
              <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--accent)]">
                {historialCompleto.listaPrestamos.length}
              </p>
            </div>
          </div>

          {/* opt: El usuario aplica criterios de búsqueda -> introducirCriterios() */}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Buscar por código PH, herramienta o vecino..."
                aria-label="Criterios de búsqueda en historial"
                className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] pr-3 pl-9 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={historyRole}
                onChange={(e) => setHistoryRole(e.target.value as 'todos' | 'recibidos' | 'realizados')}
                aria-label="Filtrar por tipo de préstamo"
                className="h-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="todos">Todos (recibidos y realizados)</option>
                <option value="recibidos">Solo recibidos (cliente)</option>
                <option value="realizados">Solo realizados (propietario)</option>
              </select>

              <select
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value as '' | LoanStatus)}
                aria-label="Filtrar por estado"
                className="h-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Cualquier estado</option>
                <option value="Activo">Activos</option>
                <option value="PendienteInspeccion">Pendiente inspección</option>
                <option value="Finalizado">Finalizados</option>
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <EmptyCard
              icon={<History className="h-8 w-8 text-[var(--text-muted)]" />}
              title="Sin préstamos que coincidan"
              description="Prueba a limpiar los criterios de búsqueda o realiza tu primer préstamo en el catálogo."
            />
          ) : (
            <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              {filteredHistory.map((loan) => {
                const tool = db.herramientas.find((h) => h.idHerramienta === loan.idHerramienta);
                const isBorrower = loan.idPrestatario === idUser;
                const counterpart = db.vecinos.find(
                  (v) => v.idVecino === (isBorrower ? tool?.idPropietario : loan.idPrestatario)
                );

                return (
                  <div
                    key={loan.idPrestamo}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      {tool && (
                        <div className="hidden h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] sm:block">
                          <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-mono-tabular">{loan.codigoEntrega}</span>
                          <span>·</span>
                          <span
                            className={`font-semibold ${
                              loan.estado === 'Finalizado'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : loan.estado === 'PendienteInspeccion'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-[var(--accent)]'
                            }`}
                          >
                            {loan.estado === 'PendienteInspeccion' ? 'Pendiente inspección' : loan.estado}
                          </span>
                          <span>·</span>
                          <span>{isBorrower ? 'Recibido' : 'Realizado'}</span>
                          <span>·</span>
                          <span className="font-mono-tabular">
                            {loan.fechaInicio} → {loan.fechaFin}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{tool?.titulo}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {isBorrower ? 'Propietario' : 'Prestatario'}: {counterpart?.nombre}
                          {loan.observaciones ? ` · ${loan.observaciones}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailTargetId(loan.idPrestamo)}
                        className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      >
                        Consultar detalle
                      </button>
                      {isBorrower && tool && tool.estado === 'disponible' && loan.estado === 'Finalizado' && (
                        <button
                          type="button"
                          onClick={() => onRebookTool(tool.idHerramienta)}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                        >
                          Volver a reservar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL REQ005 (opt): Aceptar solicitud y concretar datos de entrega */}
      {acceptTargetId !== null && (
        <ModalShell title="Aceptar solicitud y concretar entrega" onClose={() => setAcceptTargetId(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAcceptRequest(acceptTargetId, deliveryDetails);
              setAcceptTargetId(null);
            }}
            className="space-y-4"
          >
            <p className="text-xs text-[var(--text-secondary)]">
              Al aceptar la solicitud, la herramienta pasará automáticamente a estar{' '}
              <strong className="text-[var(--text-primary)]">en préstamo</strong> y se emitirá el comprobante de entrega.
            </p>
            <div>
              <label htmlFor="accept-delivery" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Datos de entrega (lugar y horario)
              </label>
              <textarea
                id="accept-delivery"
                rows={3}
                value={deliveryDetails}
                onChange={(e) => setDeliveryDetails(e.target.value)}
                placeholder="Ej: Recogida en Portal 1 · 2ºA a las 18:30"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcceptTargetId(null)}
                className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Confirmar entrega
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* MODAL REQ005 (alt): Rechazar solicitud */}
      {rejectTarget !== null && (
        <ModalShell title="Rechazar solicitud de préstamo" onClose={() => setRejectTarget(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRejectRequest(rejectTarget, rejectReason);
              setRejectTarget(null);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-primary)]">Motivos frecuentes</p>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_CHIPS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectReason(reason)}
                    className="rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="reject-text" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Motivo del rechazo *
              </label>
              <textarea
                id="reject-text"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indica el motivo brevemente..."
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirmar rechazo
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* MODAL REQ006: InterfazSolicitarAmpliacion */}
      {extendTarget && (
        <ModalShell title="Solicitar ampliación de plazo" onClose={() => setExtendTarget(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRequestExtension(extendTarget.idPrestamo, extendDate, extendReason);
              setExtendTarget(null);
            }}
            className="space-y-4"
          >
            <p className="text-xs text-[var(--text-secondary)]">
              Fecha actual de devolución:{' '}
              <strong className="font-mono-tabular text-[var(--text-primary)]">{extendTarget.fechaFin}</strong>
            </p>
            <div>
              <label htmlFor="ext-date" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Nueva fecha de devolución *
              </label>
              <input
                id="ext-date"
                type="date"
                required
                min={extendTarget.fechaFin}
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {extensionAvailability && (
              <div
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  extensionAvailability.disponible
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                {extensionAvailability.disponible
                  ? 'Herramienta disponible en la nueva fecha solicitada.'
                  : extensionAvailability.motivo}
              </div>
            )}

            {/* opt: El cliente desea justificar la solicitud de prórroga */}
            <div>
              <label htmlFor="ext-reason" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Motivo de la prórroga (opcional)
              </label>
              <textarea
                id="ext-reason"
                rows={3}
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="Explica brevemente por qué necesitas ampliar el plazo..."
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={Boolean(extensionAvailability && !extensionAvailability.disponible)}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                Enviar solicitud
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* MODAL REQ007: InterfazInspeccion (Propietario) */}
      {inspectTarget && (
        <ModalShell title="Inspección de devolución (Propietario)" onClose={() => setInspectTarget(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onFinalizeInspection(inspectTarget.idPrestamo, {
                observaciones: inspectObservations,
                hayIncidencia: hasIncident,
                incidenciaGravedad: inspectIncSeverity,
                incidenciaDescripcion: inspectIncDesc,
                dejarResena: wantsReview,
                puntuacion: inspectRating,
                comentarioResena: inspectComment,
              });
              setInspectTarget(null);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="ret-obs" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Estado comprobado en la entrega
              </label>
              <select
                id="ret-obs"
                value={inspectObservations}
                onChange={(e) => setInspectObservations(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="Devuelta limpia y en perfecto estado">Devuelta limpia y en perfecto estado</option>
                <option value="Devuelta con baterías cargadas y accesorios completos">
                  Devuelta con baterías cargadas y accesorios completos
                </option>
                <option value="Devuelta con desgaste normal de uso">Devuelta con desgaste normal de uso</option>
              </select>
            </div>

            {/* alt: Hay incidencia / sinIncidencia */}
            <div className="space-y-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)]/50 p-3">
              <p className="text-xs font-semibold text-[var(--text-primary)]">Resultado de inspección</p>
              <div className="flex gap-4 text-xs">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name="has-incident"
                    checked={!hasIncident}
                    onChange={() => setHasIncident(false)}
                    className="accent-[var(--accent)]"
                  />
                  Sin incidencia
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-red-700 dark:text-red-400">
                  <input
                    type="radio"
                    name="has-incident"
                    checked={hasIncident}
                    onChange={() => setHasIncident(true)}
                    className="accent-red-600"
                  />
                  Hay incidencia
                </label>
              </div>

              {hasIncident && (
                <div className="mt-2 space-y-2.5 border-t border-[var(--border-color)] pt-2.5">
                  <select
                    value={inspectIncSeverity}
                    onChange={(e) => setInspectIncSeverity(e.target.value as IncidentSeverity)}
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="Leve">Gravedad Leve</option>
                    <option value="Moderada">Gravedad Moderada</option>
                    <option value="Grave">Gravedad Grave</option>
                  </select>
                  <textarea
                    rows={2}
                    required
                    value={inspectIncDesc}
                    onChange={(e) => setInspectIncDesc(e.target.value)}
                    placeholder="Describe el daño, retraso o accesorio faltante..."
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
              )}
            </div>

            {/* opt: El propietario desea dejar reseña */}
            <div className="space-y-2.5 border-t border-[var(--border-color)] pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={wantsReview}
                  onChange={(e) => setWantsReview(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Dejar reseña y valoración de la devolución (opcional)
              </label>

              {wantsReview && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setInspectRating(star)}
                        aria-label={`${star} estrellas`}
                        className="p-1"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= inspectRating ? 'fill-amber-500 text-amber-500' : 'text-[var(--border-strong)]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={inspectComment}
                    onChange={(e) => setInspectComment(e.target.value)}
                    placeholder="Valoración sobre el cuidado del equipo y puntualidad..."
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectTarget(null)}
                className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Confirmar devolución
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* MODAL 4: Reportar incidencia durante préstamo */}
      {incidentTarget && (
        <ModalShell title="Registrar parte de incidencia" onClose={() => setIncidentTarget(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onReportIncident(incidentTarget.idPrestamo, incidentSeverity, incidentDesc);
              setIncidentTarget(null);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="inc-sev" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Gravedad *
              </label>
              <select
                id="inc-sev"
                value={incidentSeverity}
                onChange={(e) => setIncidentSeverity(e.target.value as IncidentSeverity)}
                className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="Leve">Leve (retraso menor o falta de limpieza)</option>
                <option value="Moderada">Moderada (accesorio extraviado o desgaste anómalo)</option>
                <option value="Grave">Grave (avería técnica o rotura del equipo)</option>
              </select>
            </div>
            <div>
              <label htmlFor="inc-desc" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                Descripción detallada *
              </label>
              <textarea
                id="inc-desc"
                rows={3}
                required
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                placeholder="Explica lo ocurrido para dejar constancia en el registro comunitario..."
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIncidentTarget(null)}
                className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Registrar incidencia
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* MODAL REQ008: Detalle / Comprobante del Préstamo (consultarDetalle) */}
      {receiptTarget && (
        <ModalShell
          title={`Detalle del préstamo · ${receiptTarget.codigoEntrega}`}
          onClose={() => setDetailTargetId(null)}
        >
          {(() => {
            const tool = db.herramientas.find((h) => h.idHerramienta === receiptTarget.idHerramienta);
            const owner = db.vecinos.find((v) => v.idVecino === tool?.idPropietario);
            const borrower = db.vecinos.find((v) => v.idVecino === receiptTarget.idPrestatario);

            return (
              <div className="space-y-4 text-sm">
                <div className="border-b border-[var(--border-color)] pb-3">
                  <p className="text-xs text-[var(--text-muted)]">Equipo reservado</p>
                  <p className="font-bold text-[var(--text-primary)]">{tool?.titulo}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {tool?.specs.marca} · {tool?.specs.modelo} · Valor reposición:{' '}
                    {formatCurrency(tool?.specs.valorReposicion || 0)}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-[var(--text-muted)]">Propietario</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">{owner?.nombre}</dd>
                    <dd className="text-[var(--text-secondary)]">{owner?.direccion}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Prestatario</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">{borrower?.nombre}</dd>
                    <dd className="text-[var(--text-secondary)]">{borrower?.direccion}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Periodo acordado</dt>
                    <dd className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                      {receiptTarget.fechaInicio} → {receiptTarget.fechaFin}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Estado</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {receiptTarget.estado === 'PendienteInspeccion'
                        ? 'Pendiente de inspección'
                        : receiptTarget.estado}
                    </dd>
                  </div>
                </dl>

                {receiptTarget.datosEntrega && (
                  <p className="rounded-lg bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Entrega:</strong> {receiptTarget.datosEntrega}
                  </p>
                )}

                {receiptTarget.observaciones && (
                  <p className="rounded-lg bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Observaciones devolución:</strong>{' '}
                    {receiptTarget.observaciones}
                  </p>
                )}

                <div className="space-y-1.5 border-t border-[var(--border-color)] pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Importe total de alquiler</span>
                    <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                      {formatCurrency(receiptTarget.costeTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Fianza reembolsable en mano</span>
                    <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                      {formatCurrency(receiptTarget.fianzaRetenida)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end border-t border-[var(--border-color)] pt-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="mr-2 rounded-lg border border-[var(--border-color)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    Imprimir justificante
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTargetId(null)}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          })()}
        </ModalShell>
      )}
    </div>
  );
};

export const InterfazGestionarSolicitudes = LoansView;
export const InterfazSolicitarAmpliacion = LoansView;
export const InterfazDevolucion = LoansView;
export const InterfazInspeccion = LoansView;
export const InterfazHistorial = LoansView;

const EmptyCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-14 text-center">
    <div className="mb-3">{icon}</div>
    <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
  </div>
);

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
