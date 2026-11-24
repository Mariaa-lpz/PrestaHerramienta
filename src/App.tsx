import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ChevronDown,
  ClipboardList,
  LogIn,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  Wrench,
  X,
} from 'lucide-react';
import {
  ActiveView,
  AppAccent,
  AppDatabase,
  AppTheme,
  CorreoConfirmacion,
  HerramientaData,
  IncidentSeverity,
  VecinoData,
} from './domain/types';
import { Usuario } from './domain/entities';
import {
  ctrlAmpliacion,
  ctrlDevolucion,
  ctrlGestionar,
  ctrlPublicar,
  ctrlRegistro,
  ctrlSolicitar,
  getInitials,
  loadDatabase,
  saveDatabase,
  toggleToolAvailabilityStatus,
} from './domain/controllers';
import {
  createSeedDatabase,
  deleteTool,
  resolveIncident,
  updateNeighborProfile,
  updateTool,
} from './domain/repository';
import { InterfazBuscarHerramientas } from './components/CatalogView';
import { InterfazSolicitarPrestamo } from './components/ToolDetailModal';
import { InterfazPublicarHerramienta } from './components/PublishToolView';
import { MyToolsView } from './components/MyToolsView';
import { LoansView } from './components/LoansView';
import { CommunityView } from './components/CommunityView';
import { SettingsView } from './components/SettingsView';
import { InterfazRegistro } from './components/InterfazRegistro';
import { BrandMark } from './components/BrandMark';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'error';
}

const NAV_LINKS: { id: ActiveView; label: string }[] = [
  { id: 'buscar', label: 'Catálogo' },
  { id: 'mis-herramientas', label: 'Mis equipos' },
  { id: 'solicitudes', label: 'Préstamos' },
  { id: 'incidencias', label: 'Comunidad' },
  { id: 'configuracion', label: 'Ajustes' },
];

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeUserId, setActiveUserId] = useState<number>(() => {
    const saved = Number(sessionStorage.getItem('ph_active_user_id'));
    const initialDb = loadDatabase();
    return initialDb.vecinos.some((v) => v.idVecino === saved)
      ? saved
      : initialDb.vecinos[0].idVecino;
  });

  const [activeView, setActiveView] = useState<ActiveView>('buscar');
  const [selectedTool, setSelectedTool] = useState<HerramientaData | null>(null);
  const [focusBooking, setFocusBooking] = useState(false);
  const [editingTool, setEditingTool] = useState<HerramientaData | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const [theme, setTheme] = useState<AppTheme>(
    () => (localStorage.getItem('ph_theme_v2') as AppTheme) || 'dark'
  );
  const [accent, setAccent] = useState<AppAccent>(
    () => (localStorage.getItem('ph_accent') as AppAccent) || 'amber'
  );

  const themeTransitionTimerRef = useRef<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [accountMenuOpen]);

  const pushToast = (text: string, tone: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const resolveIsDark = (targetTheme: AppTheme) =>
    targetTheme === 'dark' ||
    (targetTheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const applyThemeToDom = (targetTheme: AppTheme) => {
    localStorage.setItem('ph_theme_v2', targetTheme);
    document.documentElement.classList.toggle('dark', resolveIsDark(targetTheme));
  };

  useEffect(() => {
    applyThemeToDom(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => applyThemeToDom('system');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ph_accent', accent);
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  const handleThemeChange = (
    nextTheme: AppTheme,
    originEvent?: React.MouseEvent<HTMLElement>
  ) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    if (!docWithTransition.startViewTransition || prefersReducedMotion) {
      const root = document.documentElement;
      if (themeTransitionTimerRef.current) {
        window.clearTimeout(themeTransitionTimerRef.current);
      }
      root.classList.add('theme-fallback-fade');
      applyThemeToDom(nextTheme);
      setTheme(nextTheme);
      themeTransitionTimerRef.current = window.setTimeout(() => {
        root.classList.remove('theme-fallback-fade');
        themeTransitionTimerRef.current = null;
      }, 280);
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (originEvent?.currentTarget) {
      const rect = originEvent.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = docWithTransition.startViewTransition(() => {
      flushSync(() => {
        applyThemeToDom(nextTheme);
        setTheme(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        const keyframes = originEvent
          ? {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            }
          : {
              opacity: [0, 1],
            };

        document.documentElement.animate(keyframes, {
          duration: originEvent ? 460 : 280,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        });
      })
      .catch(() => {});
  };

  const currentUser =
    db.vecinos.find((v) => v.idVecino === activeUserId) || db.vecinos[0];

  const myToolIds = db.herramientas
    .filter((h) => h.idPropietario === currentUser.idVecino)
    .map((h) => h.idHerramienta);
  const pendingIn = db.solicitudes.filter(
    (s) => myToolIds.includes(s.idHerramienta) && s.estado === 'Pendiente'
  ).length;
  const activeCount = db.prestamos.filter((p) => {
    const h = db.herramientas.find((t) => t.idHerramienta === p.idHerramienta);
    return (
      p.estado !== 'Finalizado' &&
      (p.idPrestatario === currentUser.idVecino || h?.idPropietario === currentUser.idVecino)
    );
  }).length;
  const pendingLoansCount = pendingIn + activeCount;
  const openIncidentsCount = db.incidencias.filter((i) => i.estado === 'Abierta').length;

  const navigateTo = (view: ActiveView) => {
    if (view !== 'publicar') setEditingTool(null);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = Usuario.validarCredenciales(db.vecinos, loginEmail, loginPassword);
    if (!res.valido || !res.usuario) {
      setLoginError('Correo o contraseña incorrectos. Solo puedes acceder con tus propias credenciales.');
      return;
    }
    setActiveUserId(res.usuario.idVecino);
    sessionStorage.setItem('ph_active_user_id', String(res.usuario.idVecino));
    setLoginEmail('');
    setLoginPassword('');
    setLoginModalOpen(false);
    pushToast(`Sesión iniciada como ${res.usuario.nombre}.`);
  };

  const handleToggleFavorite = (toolId: number) => {
    const currentFavs = db.favoritos[currentUser.idVecino] || [];
    const exists = currentFavs.includes(toolId);
    const updatedFavs = exists
      ? currentFavs.filter((id) => id !== toolId)
      : [...currentFavs, toolId];
    const nextDb: AppDatabase = {
      ...db,
      favoritos: {
        ...db.favoritos,
        [currentUser.idVecino]: updatedFavs,
      },
    };
    saveDatabase(nextDb);
    setDb(nextDb);
    pushToast(exists ? 'Quitada de guardadas.' : 'Guardada en favoritos.');
  };

  // REQ004: ControladorSolicitarPrestamo
  const handleCreateRequest = (payload: {
    idHerramienta: number;
    fechaInicio: string;
    fechaFin: string;
    franjaRecogida: string;
    mensaje: string;
  }) => {
    try {
      const { db: nextDb } = ctrlSolicitar.confirmarSolicitud(db, {
        ...payload,
        idVecino: currentUser.idVecino,
      });
      setDb(nextDb);
      setSelectedTool(null);
      pushToast('Solicitud enviada al propietario.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.', 'error');
    }
  };

  // REQ002: ControladorPublicarHerramienta
  const handleUpdateUserDataOnPublish = (datosUsuario: {
    nombre?: string;
    direccion?: string;
    telefono?: string;
  }) => {
    const res = ctrlPublicar.añadirDatosUsuario(db, currentUser.idVecino, datosUsuario);
    if (res.registrado) {
      setDb(res.db);
    }
  };

  const handleSubmitTool = (
    payload: Omit<HerramientaData, 'idHerramienta' | 'idPropietario' | 'estado' | 'fechaPublicacion'>,
    editingId?: number,
    verifiedOwnerId?: number
  ) => {
    try {
      if (editingId) {
        const nextDb = updateTool(db, editingId, payload);
        setDb(nextDb);
        setEditingTool(null);
        pushToast('Herramienta actualizada.');
        navigateTo('mis-herramientas');
      } else {
        const ownerId = verifiedOwnerId || currentUser.idVecino;
        const { db: nextDb } = ctrlPublicar.publicarHerramienta(db, ownerId, payload);
        setDb(nextDb);
        if (ownerId !== currentUser.idVecino) {
          setActiveUserId(ownerId);
          sessionStorage.setItem('ph_active_user_id', String(ownerId));
        }
        pushToast('Herramienta publicada como disponible.');
        navigateTo('buscar');
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al guardar herramienta.', 'error');
    }
  };

  const handleToggleToolStatus = (toolId: number) => {
    try {
      const { db: nextDb, newStatus } = toggleToolAvailabilityStatus(db, toolId);
      setDb(nextDb);
      pushToast(
        newStatus === 'pausada'
          ? 'Herramienta pausada temporalmente.'
          : 'Herramienta visible como disponible.'
      );
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'No se pudo cambiar el estado.', 'error');
    }
  };

  const handleDeleteTool = (toolId: number) => {
    try {
      const nextDb = deleteTool(db, toolId);
      setDb(nextDb);
      pushToast('Herramienta eliminada.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    }
  };

  // REQ005: ControladorGestionarSolicitudes
  const handleAcceptRequest = (idSolicitud: number, datosEntrega?: string) => {
    try {
      const { db: nextDb, prestamo } = ctrlGestionar.aceptarSolicitud(db, idSolicitud, datosEntrega);
      setDb(nextDb);
      pushToast(`Préstamo ${prestamo.codigoEntrega} confirmado y herramienta en préstamo.`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al aceptar.', 'error');
    }
  };

  const handleRejectRequest = (idSolicitud: number, motivo: string) => {
    try {
      const nextDb = ctrlGestionar.rechazarSolicitud(db, idSolicitud, motivo);
      setDb(nextDb);
      pushToast('Solicitud rechazada.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al rechazar.', 'error');
    }
  };

  // REQ006: ControladorSolicitarAmpliacion
  const handleRequestExtension = (idPrestamo: number, nuevaFechaFin: string, motivo: string) => {
    try {
      const nextDb = ctrlAmpliacion.solicitarProrroga(db, idPrestamo, nuevaFechaFin, motivo);
      setDb(nextDb);
      pushToast('Ampliación solicitada al propietario.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al solicitar ampliación.', 'error');
    }
  };

  const handleRespondExtension = (idAmpliacion: number, aprobar: boolean) => {
    try {
      const nextDb = ctrlAmpliacion.autorizarProrroga(db, idAmpliacion, aprobar);
      setDb(nextDb);
      pushToast(aprobar ? 'Ampliación autorizada.' : 'Ampliación denegada.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al responder.', 'error');
    }
  };

  // REQ007: ControladorDevolucion (Notificar + FinalizarDevolucion)
  const handleNotifyReturn = (idPrestamo: number) => {
    try {
      const { db: nextDb } = ctrlDevolucion.Notificar(db, idPrestamo);
      setDb(nextDb);
      pushToast('Devolución notificada al propietario para inspección.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al notificar devolución.', 'error');
    }
  };

  const handleFinalizeInspection = (
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
  ) => {
    try {
      const { db: nextDb, notificacionCliente } = ctrlDevolucion.FinalizarDevolucion(db, idPrestamo, {
        ...opciones,
        idPropietario: currentUser.idVecino,
      });
      setDb(nextDb);
      pushToast(notificacionCliente);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al finalizar inspección.', 'error');
    }
  };

  const handleReportIncident = (
    idPrestamo: number,
    gravedad: IncidentSeverity,
    descripcion: string
  ) => {
    try {
      const nextDb = ctrlDevolucion.GuardarIncidencia(db, {
        idPrestamo,
        idReportante: currentUser.idVecino,
        gravedad,
        descripcion,
      });
      setDb(nextDb);
      pushToast('Incidencia registrada.', 'error');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al reportar.', 'error');
    }
  };

  const handleResolveIncident = (idIncidencia: number, resolucion: string) => {
    try {
      const nextDb = resolveIncident(db, idIncidencia, resolucion);
      setDb(nextDb);
      pushToast('Incidencia marcada como resuelta.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al resolver.', 'error');
    }
  };

  const handleUpdateProfile = (updates: {
    nombre: string;
    direccion: string;
    email: string;
    telefono: string;
  }) => {
    try {
      const nextDb = updateNeighborProfile(db, currentUser.idVecino, updates);
      setDb(nextDb);
      pushToast('Perfil actualizado.');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al guardar perfil.', 'error');
    }
  };

  // REQ001: ControladorRegistro.registrarVecino()
  const handleRegisterNeighbor = (
    data: { nombre: string; direccion: string; email: string; telefono: string; contrasena: string },
    accepted: boolean
  ): { ok: true; nuevoVecino: VecinoData; correo: CorreoConfirmacion } | { ok: false; mensajeError: string } => {
    const res = ctrlRegistro.registrarVecino(db, data, accepted);
    if (res.ok) {
      setDb(res.db);
      setActiveUserId(res.nuevoVecino.idVecino);
      sessionStorage.setItem('ph_active_user_id', String(res.nuevoVecino.idVecino));
      pushToast(`Vecino ${res.nuevoVecino.nombre} registrado. Confirmación enviada a ${res.correo.destinatario}`);
      return { ok: true, nuevoVecino: res.nuevoVecino, correo: res.correo };
    }
    pushToast(res.mensajeError, 'error');
    return { ok: false, mensajeError: res.mensajeError };
  };

  const handleResetDemo = () => {
    const seed = createSeedDatabase();
    saveDatabase(seed);
    setDb(seed);
    setActiveUserId(seed.vecinos[0].idVecino);
    sessionStorage.setItem('ph_active_user_id', String(seed.vecinos[0].idVecino));
    pushToast('Datos iniciales restaurados.');
  };

  const isDarkActive =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* HEADER PRINCIPAL UNIFICADO */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
          <button
            type="button"
            onClick={() => navigateTo('buscar')}
            className="whitespace-nowrap shrink-0 text-left"
          >
            <BrandMark />
          </button>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación principal">
            {NAV_LINKS.map((item) => {
              const isActive = activeView === item.id;
              const badgeCount =
                item.id === 'solicitudes'
                  ? pendingLoansCount
                  : item.id === 'incidencias'
                  ? openIncidentsCount
                  : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative whitespace-nowrap shrink-0 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'font-semibold text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-1.5 font-mono-tabular text-xs font-semibold text-[var(--accent)]">
                      ({badgeCount})
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute right-0 -bottom-[21px] left-0 h-0.5 bg-[var(--accent)]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0 sm:gap-2.5">
            <button
              type="button"
              onClick={(e) => handleThemeChange(isDarkActive ? 'light' : 'dark', e)}
              aria-label="Cambiar tema claro u oscuro"
              className="group grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <span className="transition-transform duration-300 group-active:scale-90">
                {isDarkActive ? (
                  <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                ) : (
                  <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
                )}
              </span>
            </button>

            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-9 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
              >
                <span className="grid h-6 w-6 place-items-center rounded bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
                  {getInitials(currentUser.nombre)}
                </span>
                <span className="hidden max-w-[120px] truncate lg:inline">{currentUser.nombre}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-xl"
                >
                  <div className="border-b border-[var(--border-color)] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-[var(--text-primary)]">{currentUser.nombre}</p>
                      {currentUser.verificado && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          Verificada
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">{currentUser.email}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {currentUser.direccion} · Residencial Los Olivos
                    </p>
                  </div>

                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigateTo('mis-herramientas');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    >
                      <Wrench className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      Mis herramientas ({myToolIds.length})
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigateTo('solicitudes');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    >
                      <ClipboardList className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      Mis préstamos y solicitudes
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigateTo('configuracion');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    >
                      <Settings className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      Mi perfil y preferencias
                    </button>
                  </div>

                  <div className="space-y-0.5 border-t border-[var(--border-color)] p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setLoginError(null);
                        setLoginModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    >
                      <LogIn className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      Iniciar sesión con otra cuenta
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setRegisterModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[var(--accent)] hover:bg-[var(--bg-hover)]"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Registrarse como nuevo vecino
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigateTo('publicar')}
              className="whitespace-nowrap shrink-0 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Publicar</span>
              <span className="hidden sm:inline">Publicar herramienta</span>
            </button>
          </div>
        </div>

        {/* Navegación móvil compacta */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-[var(--border-color)] px-4 py-2 md:hidden">
          {NAV_LINKS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeView === 'buscar' && (
          <InterfazBuscarHerramientas
            db={db}
            currentUser={currentUser}
            onSelectTool={(tool, openBooking) => {
              setSelectedTool(tool);
              setFocusBooking(Boolean(openBooking));
            }}
            onToggleFavorite={handleToggleFavorite}
            onNavigatePublish={() => navigateTo('publicar')}
          />
        )}

        {activeView === 'mis-herramientas' && (
          <MyToolsView
            db={db}
            currentUser={currentUser}
            onEditTool={(tool) => {
              setEditingTool(tool);
              setActiveView('publicar');
            }}
            onToggleStatus={handleToggleToolStatus}
            onDeleteTool={handleDeleteTool}
            onNavigatePublish={() => navigateTo('publicar')}
          />
        )}

        {activeView === 'publicar' && (
          <InterfazPublicarHerramienta
            db={db}
            currentUser={currentUser}
            editingTool={editingTool}
            onCancel={() => navigateTo(editingTool ? 'mis-herramientas' : 'buscar')}
            onUpdateUserData={handleUpdateUserDataOnPublish}
            onSubmitTool={handleSubmitTool}
          />
        )}

        {activeView === 'solicitudes' && (
          <LoansView
            db={db}
            currentUser={currentUser}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRequestExtension={handleRequestExtension}
            onRespondExtension={handleRespondExtension}
            onNotifyReturn={handleNotifyReturn}
            onFinalizeInspection={handleFinalizeInspection}
            onReportIncident={handleReportIncident}
            onRebookTool={(idHerramienta) => {
              const found = db.herramientas.find((h) => h.idHerramienta === idHerramienta);
              if (found) {
                setSelectedTool(found);
                setFocusBooking(true);
              }
            }}
          />
        )}

        {activeView === 'incidencias' && (
          <CommunityView db={db} onResolveIncident={handleResolveIncident} />
        )}

        {activeView === 'configuracion' && (
          <SettingsView
            currentUser={currentUser}
            theme={theme}
            accent={accent}
            onChangeTheme={handleThemeChange}
            onChangeAccent={setAccent}
            onUpdateProfile={handleUpdateProfile}
            onRegisterNeighbor={handleRegisterNeighbor}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            <strong className="font-semibold text-[var(--text-primary)]">PrestaHerramienta</strong> · Comunidad
            Residencial Los Olivos, Jaén
          </span>

          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => navigateTo('buscar')} className="hover:text-[var(--text-primary)]">
              Catálogo
            </button>
            <button type="button" onClick={() => navigateTo('solicitudes')} className="hover:text-[var(--text-primary)]">
              Préstamos
            </button>
            <button type="button" onClick={() => navigateTo('incidencias')} className="hover:text-[var(--text-primary)]">
              Normas e incidencias
            </button>
            <button type="button" onClick={() => navigateTo('configuracion')} className="hover:text-[var(--text-primary)]">
              Ajustes
            </button>
          </div>
        </div>
      </footer>

      <InterfazSolicitarPrestamo
        tool={selectedTool}
        db={db}
        currentUser={currentUser}
        focusBooking={focusBooking}
        onClose={() => {
          setSelectedTool(null);
          setFocusBooking(false);
        }}
        onSubmitRequest={handleCreateRequest}
      />

      {/* Modal rápido REQ001: InterfazRegistro */}
      {registerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setRegisterModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Registrarse como nuevo vecino</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Crea tu propia cuenta en Residencial Los Olivos para reservar o publicar herramientas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                aria-label="Cerrar registro"
                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <InterfazRegistro
              compact
              onRegisterNeighbor={handleRegisterNeighbor}
              onCompleted={() => setRegisterModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de acceso seguro con correo y contraseña */}
      {loginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setLoginModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Iniciar sesión</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Accede a tu cuenta vecinal introduciendo tu correo y contraseña.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                aria-label="Cerrar inicio de sesión"
                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                >
                  {loginError}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="tucorreo@comunidad.es"
                  className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="login-pass" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Contraseña
                </label>
                <input
                  id="login-pass"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalOpen(false);
                    setRegisterModalOpen(true);
                  }}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.tone === 'error'
                ? 'bg-red-600'
                : 'bg-[#141413] dark:border dark:border-[var(--border-strong)] dark:bg-[#1f1f24]'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
