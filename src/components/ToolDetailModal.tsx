import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, ShieldCheck, Star, Wrench, X } from 'lucide-react';
import { AppDatabase, HerramientaData, VecinoData } from '../domain/types';
import { ctrlSolicitar } from '../domain/controllers';
import {
  calculateDaysInclusive,
  formatCurrency,
  getInitials,
  getToolBookedDates,
  getToolRatingStats,
} from '../domain/repository';
import { ToolImage } from './ToolImage';

interface ToolDetailModalProps {
  tool: HerramientaData | null;
  db: AppDatabase;
  currentUser: VecinoData;
  focusBooking?: boolean;
  onClose: () => void;
  onSubmitRequest: (payload: {
    idHerramienta: number;
    fechaInicio: string;
    fechaFin: string;
    franjaRecogida: string;
    mensaje: string;
  }) => void;
}

const PICKUP_SLOTS = [
  'Mañana (10:00–13:00)',
  'Tarde (18:00–21:00)',
  'Finde flexible (a convenir)',
];

/**
 * REQ004 — <<boundary>> InterfazSolicitarPrestamo
 */
export const InterfazSolicitarPrestamo: React.FC<ToolDetailModalProps> = ({
  tool,
  db,
  currentUser,
  focusBooking = false,
  onClose,
  onSubmitRequest,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [franjaRecogida, setFranjaRecogida] = useState(PICKUP_SLOTS[1]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (tool) {
      // 1.1: solicitarPrestamo()
      ctrlSolicitar.solicitarPrestamo();
      setFechaInicio(today);
      setFechaFin(today);
      setFranjaRecogida(PICKUP_SLOTS[1]);
      setMensaje('');
    }
  }, [tool, today]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (tool) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [tool, onClose]);

  const owner = useMemo(
    () => (tool ? db.vecinos.find((v) => v.idVecino === tool.idPropietario) : undefined),
    [db.vecinos, tool]
  );

  const reviews = useMemo(
    () => (tool ? db.resenas.filter((r) => r.idHerramienta === tool.idHerramienta) : []),
    [db.resenas, tool]
  );

  const bookedRanges = useMemo(
    () => (tool ? getToolBookedDates(db, tool.idHerramienta) : []),
    [db, tool]
  );

  // 2.1: comprobarDisponibilidad(fecha) -> Prestamo.comprobar(fecha)
  const disponibilidadCheck = useMemo(() => {
    if (!tool) return { disponible: false };
    return ctrlSolicitar.comprobarDisponibilidad(db, tool.idHerramienta, fechaInicio, fechaFin);
  }, [db, tool, fechaInicio, fechaFin]);

  if (!tool) return null;

  const rating = getToolRatingStats(db.resenas, tool.idHerramienta);
  const isOwner = owner?.idVecino === currentUser.idVecino;
  const days = calculateDaysInclusive(fechaInicio, fechaFin);
  const rentalSubtotal = days * tool.precio;
  const totalWithDeposit = rentalSubtotal + tool.fianza;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRequest({
      idHerramienta: tool.idHerramienta,
      fechaInicio,
      fechaFin,
      franjaRecogida,
      mensaje,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-6 py-4">
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
            <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
              Ref. {tool.idHerramienta}
            </span>
            <span>·</span>
            <span>{tool.tipo}</span>
            <span>·</span>
            <span
              className={
                tool.estado === 'disponible'
                  ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                  : 'font-semibold text-[var(--accent)]'
              }
            >
              {tool.estado === 'disponible' ? 'Disponible' : 'En préstamo'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{tool.specs.marca}</span>
                <span>·</span>
                <span>{tool.specs.modelo}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {rating.count > 0 ? `${rating.average.toFixed(1)} (${rating.count} reseñas)` : 'Sin reseñas todavía'}
                </span>
              </div>
              <h2 id="detail-modal-title" className="mt-1.5 text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
                {tool.titulo}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{tool.descripcion}</p>
            </div>

            <div className="border-t border-[var(--border-color)] pt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Wrench className="h-4 w-4 text-[var(--accent)]" />
                Ficha técnica del fabricante
              </h3>
              <dl className="mt-3 grid grid-cols-2 divide-x divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)]/35 text-sm">
                <div className="p-3">
                  <dt className="text-[11px] font-medium text-[var(--text-muted)]">Marca y modelo</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--text-primary)]">
                    {tool.specs.marca} · {tool.specs.modelo}
                  </dd>
                </div>
                <div className="p-3">
                  <dt className="text-[11px] font-medium text-[var(--text-muted)]">Potencia / Capacidad</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--text-primary)]">{tool.specs.potenciaOCapacidad}</dd>
                </div>
                <div className="p-3">
                  <dt className="text-[11px] font-medium text-[var(--text-muted)]">Peso</dt>
                  <dd className="mt-0.5 font-mono-tabular font-semibold text-[var(--text-primary)]">{tool.specs.peso}</dd>
                </div>
                <div className="p-3">
                  <dt className="text-[11px] font-medium text-[var(--text-muted)]">Valor estimado</dt>
                  <dd className="mt-0.5 font-mono-tabular font-semibold text-[var(--text-primary)]">
                    {formatCurrency(tool.specs.valorReposicion)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2 border-t border-[var(--border-color)] pt-5 text-sm">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Condiciones de entrega y uso</h3>
              <p className="text-[var(--text-secondary)]">
                <strong className="font-semibold text-[var(--text-primary)]">Horario de recogida:</strong>{' '}
                {tool.disponibilidad}
              </p>
              <p className="text-[var(--text-secondary)]">
                <strong className="font-semibold text-[var(--text-primary)]">Cuidado y devolución:</strong>{' '}
                {tool.condiciones}
              </p>
            </div>

            <div className="border-t border-[var(--border-color)] pt-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Opiniones de vecinos ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Todavía no hay opiniones registradas sobre esta herramienta.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-[var(--border-color)]">
                  {reviews.map((rev) => (
                    <div key={rev.idResena} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {rev.autor} · <span className="font-normal text-[var(--text-muted)]">{rev.fecha}</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: rev.puntuacion }).map((_, idx) => (
                            <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{rev.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="space-y-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)]/50 p-5">
              <div className="flex items-baseline justify-between border-b border-[var(--border-color)] pb-4">
                <div>
                  <span className="font-mono-tabular text-2xl font-bold text-[var(--text-primary)]">
                    {tool.precio === 0 ? 'Gratis' : formatCurrency(tool.precio)}
                  </span>
                  {tool.precio > 0 && (
                    <span className="ml-1 text-xs text-[var(--text-muted)]">/ día</span>
                  )}
                </div>
                <span className="font-mono-tabular text-xs font-medium text-[var(--text-secondary)]">
                  {tool.fianza > 0 ? `Fianza ${formatCurrency(tool.fianza)}` : 'Sin fianza'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] font-bold text-[var(--accent)]">
                    {owner ? getInitials(owner.nombre) : 'VE'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{owner?.nombre}</p>
                    <p className="text-xs text-[var(--text-muted)]">{owner?.direccion}</p>
                  </div>
                </div>
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              {bookedRanges.length > 0 && (
                <div className="border-t border-[var(--border-color)] pt-4 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Actualmente en préstamo
                  </p>
                  <p className="mt-1 font-mono-tabular text-[var(--text-secondary)]">
                    Ocupada del {bookedRanges[0].start} al {bookedRanges[0].end}
                  </p>
                </div>
              )}

              {isOwner ? (
                <div className="border-t border-[var(--border-color)] pt-4 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">Esta herramienta es tuya</p>
                  <p className="mt-1 text-xs">
                    Puedes modificar su tarifa, pausarla o ver sus préstamos desde el apartado «Mis equipos».
                  </p>
                </div>
              ) : tool.estado !== 'disponible' ? (
                <div className="border-t border-[var(--border-color)] pt-4 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">Ahora mismo está en préstamo</p>
                  <p className="mt-1 text-xs">
                    Estará disponible de nuevo cuando el propietario confirme la devolución en la plataforma.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 border-t border-[var(--border-color)] pt-4">
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold text-[var(--text-muted)]">
                      Duración rápida
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: '1 día', extraDays: 0 },
                        { label: '2 días', extraDays: 1 },
                        { label: '3 días', extraDays: 2 },
                      ].map((preset) => {
                        const base = new Date(`${(fechaInicio || today)}T00:00:00`);
                        base.setDate(base.getDate() + preset.extraDays);
                        const targetEnd = base.toISOString().split('T')[0];
                        const activePreset = days === preset.extraDays + 1;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setFechaFin(targetEnd)}
                            className={`rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                              activePreset
                                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                                : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="det-start" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                        Recogida
                      </label>
                      <input
                        id="det-start"
                        type="date"
                        min={today}
                        value={fechaInicio}
                        onChange={(e) => {
                          setFechaInicio(e.target.value);
                          if (fechaFin < e.target.value) setFechaFin(e.target.value);
                        }}
                        required
                        className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 font-mono-tabular text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="det-end" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                        Devolución
                      </label>
                      <input
                        id="det-end"
                        type="date"
                        min={fechaInicio || today}
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        required
                        className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 font-mono-tabular text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Resultado comprobarDisponibilidad(fecha) */}
                  <div
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      disponibilidadCheck.disponible
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                  >
                    {disponibilidadCheck.disponible
                      ? 'Fechas disponibles para préstamo.'
                      : disponibilidadCheck.motivo || 'Fechas no disponibles.'}
                  </div>

                  <div>
                    <label htmlFor="det-slot" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                      Franja de recogida
                    </label>
                    <select
                      id="det-slot"
                      value={franjaRecogida}
                      onChange={(e) => setFranjaRecogida(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                    >
                      {PICKUP_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* opt: El cliente desea incluir observaciones extra */}
                  <div>
                    <label htmlFor="det-msg" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                      Observaciones para {owner?.nombre} (opcional)
                    </label>
                    <textarea
                      id="det-msg"
                      rows={3}
                      autoFocus={focusBooking}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      placeholder="Indica si deseas añadir observaciones para la recogida..."
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 border-t border-[var(--border-color)] pt-3 text-xs">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>
                        Alquiler ({days} {days === 1 ? 'día' : 'días'})
                      </span>
                      <span className="font-mono-tabular font-medium text-[var(--text-primary)]">
                        {formatCurrency(rentalSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Fianza reembolsable</span>
                      <span className="font-mono-tabular font-medium text-[var(--text-primary)]">
                        {formatCurrency(tool.fianza)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border-color)] pt-2 text-sm font-bold text-[var(--text-primary)]">
                      <span>Total en entrega</span>
                      <span className="font-mono-tabular">{formatCurrency(totalWithDeposit)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!disponibilidadCheck.disponible}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Enviar solicitud
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToolDetailModal = InterfazSolicitarPrestamo;
