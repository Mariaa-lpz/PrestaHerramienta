import React, { useEffect, useState } from 'react';
import { Database, Palette, RotateCcw, UserCheck } from 'lucide-react';
import { AppAccent, AppTheme, CorreoConfirmacion, VecinoData } from '../domain/types';
import { InterfazRegistro } from './InterfazRegistro';

interface SettingsViewProps {
  currentUser: VecinoData;
  theme: AppTheme;
  accent: AppAccent;
  onChangeTheme: (theme: AppTheme) => void;
  onChangeAccent: (accent: AppAccent) => void;
  onUpdateProfile: (updates: { nombre: string; direccion: string; email: string; telefono: string }) => void;
  onRegisterNeighbor: (
    data: { nombre: string; direccion: string; email: string; telefono: string; contrasena: string },
    accepted: boolean
  ) => { ok: true; nuevoVecino: VecinoData; correo: CorreoConfirmacion } | { ok: false; mensajeError: string };
  onResetDemo: () => void;
}

const ACCENTS: { id: AppAccent; label: string; color: string }[] = [
  { id: 'amber', label: 'Ámbar Industrial', color: '#d97706' },
  { id: 'emerald', label: 'Verde Bosque', color: '#059669' },
  { id: 'blue', label: 'Azul Técnico', color: '#2563eb' },
  { id: 'rose', label: 'Carmesí', color: '#e11d48' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  theme,
  accent,
  onChangeTheme,
  onChangeAccent,
  onUpdateProfile,
  onRegisterNeighbor,
  onResetDemo,
}) => {
  const [nombre, setNombre] = useState(currentUser.nombre);
  const [direccion, setDireccion] = useState(currentUser.direccion);
  const [email, setEmail] = useState(currentUser.email);
  const [telefono, setTelefono] = useState(currentUser.telefono);

  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setNombre(currentUser.nombre);
    setDireccion(currentUser.direccion);
    setEmail(currentUser.email);
    setTelefono(currentUser.telefono);
  }, [currentUser]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ nombre, direccion, email, telefono });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <p className="text-xs font-medium text-[var(--text-muted)]">Preferencias y cuentas</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Configuración y registro vecinal
        </h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Personaliza la apariencia visual, actualiza tus datos de contacto o registra un nuevo vecino en la comunidad.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Apariencia */}
        <section className="space-y-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
              <Palette className="h-4 w-4 text-[var(--accent)]" />
              Apariencia de la plataforma
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Alterna entre tema claro, oscuro o automático según el sistema operativo.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { id: 'light', label: 'Modo Claro', bg: 'bg-[#f4f4f0] border-[#dcdcd5]', card: 'bg-white' },
                { id: 'dark', label: 'Modo Oscuro', bg: 'bg-[#0f0f12] border-[#27272e]', card: 'bg-[#1c1c21]' },
                {
                  id: 'system',
                  label: 'Sistema',
                  bg: 'bg-gradient-to-br from-[#f4f4f0] via-[#f4f4f0] to-[#0f0f12] border-[#888]',
                  card: 'bg-white/70',
                },
              ] as const
            ).map((opt) => {
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeTheme(opt.id)}
                  className={`rounded-xl border-2 p-2.5 text-center transition-colors ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className={`mb-2 flex h-12 flex-col gap-1.5 rounded-md border p-1.5 ${opt.bg}`}>
                    <div className="h-2 w-1/2 rounded-xs bg-[var(--accent)]" />
                    <div className={`flex-1 rounded-xs ${opt.card}`} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-[var(--border-color)] pt-4">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Color de acento</p>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENTS.map((item) => {
                const active = accent === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeAccent(item.id)}
                    title={item.label}
                    aria-label={item.label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Perfil del vecino activo */}
        <section className="space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
              <UserCheck className="h-4 w-4 text-[var(--accent)]" />
              Datos del vecino activo
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Información visible para coordinar entregas y devoluciones en tu portal.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="cfg-nombre" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Nombre completo
                </label>
                <input
                  id="cfg-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-dir" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Portal / Vivienda
                </label>
                <input
                  id="cfg-dir"
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="cfg-email" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Correo electrónico
                </label>
                <input
                  id="cfg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-tel" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Teléfono de contacto
                </label>
                <input
                  id="cfg-tel"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Guardar cambios de perfil
            </button>
          </form>
        </section>

        {/* REQ001: Alta de nuevo vecino */}
        <InterfazRegistro onRegisterNeighbor={onRegisterNeighbor} />

        {/* Gestión de datos locales */}
        <section className="flex flex-col justify-between space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
              <Database className="h-4 w-4 text-[var(--accent)]" />
              Almacenamiento local y restablecimiento
            </h2>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Tu catálogo, reservas, ampliaciones, incidencias y valoraciones se conservan en este navegador. Si lo
              necesitas, puedes restaurar el inventario inicial de la comunidad.
            </p>
          </div>

          <div className="border-t border-[var(--border-color)] pt-4">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar catálogo y préstamos iniciales
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  ¿Confirmas restaurar los datos iniciales?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDemo();
                    setConfirmReset(false);
                  }}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Sí, restaurar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
