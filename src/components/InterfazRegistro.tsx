import React, { useMemo, useState } from 'react';
import { CheckCircle2, Mail, UserPlus } from 'lucide-react';
import { ctrlRegistro } from '../domain/controllers';
import { CorreoConfirmacion, VecinoData } from '../domain/types';

interface InterfazRegistroProps {
  onRegisterNeighbor: (
    datos: { nombre: string; direccion: string; email: string; telefono: string; contrasena: string },
    aceptoTerminos: boolean
  ) => { ok: true; nuevoVecino: VecinoData; correo: CorreoConfirmacion } | { ok: false; mensajeError: string };
  compact?: boolean;
  onCompleted?: () => void;
}

/**
 * REQ001 — <<boundary>> InterfazRegistro
 */
export const InterfazRegistro: React.FC<InterfazRegistroProps> = ({
  onRegisterNeighbor,
  compact = false,
  onCompleted,
}) => {
  // 1.1: obtenerFormulario() -> 1.3: mostrarFormulario
  const formulario = useMemo(() => ctrlRegistro.obtenerFormulario(), []);

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    vecino: VecinoData;
    correo: CorreoConfirmacion;
  } | null>(null);

  // 2: introducirDatos(datos, aceptoTerminos) -> loop mientras datos no válidos o términos no aceptados
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);

    const resultado = onRegisterNeighbor(
      { nombre, direccion, email, telefono, contrasena },
      aceptoTerminos
    );

    if (resultado.ok) {
      // 2.3: mostrarConfirmacion
      setConfirmacion({
        vecino: resultado.nuevoVecino,
        correo: resultado.correo,
      });
      setNombre('');
      setDireccion('');
      setEmail('');
      setTelefono('');
      setContrasena('');
      setAceptoTerminos(false);
    } else {
      // 2.3.1: mostrarMensajeError (permanece en el bucle de entrada)
      setErrorMensaje(resultado.mensajeError);
      setConfirmacion(null);
    }
  };

  return (
    <section
      className={
        compact
          ? 'space-y-4'
          : 'space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6'
      }
    >
      {!compact && (
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
            <UserPlus className="h-4 w-4 text-[var(--accent)]" />
            Registrar nuevo vecino
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Alta en la comunidad con validación de datos, aceptación de normas y envío de correo de confirmación.
          </p>
        </div>
      )}

      {errorMensaje && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          {errorMensaje}
        </div>
      )}

      {confirmacion && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Vecino {confirmacion.vecino.nombre} registrado y sesión iniciada
          </p>
          <p className="flex items-center gap-1.5 text-[11px] opacity-90">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Correo de confirmación enviado a <strong>{confirmacion.correo.destinatario}</strong>
          </p>
          {onCompleted && (
            <button
              type="button"
              onClick={onCompleted}
              className="mt-1 inline-flex items-center rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
            >
              Continuar con mi cuenta
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-nombre" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
              Nombre completo *
            </label>
            <input
              id="reg-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Elena Morales"
              className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="reg-dir" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
              Portal / Piso *
            </label>
            <input
              id="reg-dir"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Portal 2 · 4ºA"
              className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div>
            <label htmlFor="reg-email" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
              Correo *
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@comunidad.es"
              className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="reg-tel" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
              Teléfono
            </label>
            <input
              id="reg-tel"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="600 123 456"
              className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="reg-pass" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
              Contraseña *
            </label>
            <input
              id="reg-pass"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Mín. 4 caracteres"
              className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={aceptoTerminos}
            onChange={(e) => setAceptoTerminos(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {formulario.textoNormas}
        </label>

        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Registrar cuenta vecinal
        </button>
      </form>
    </section>
  );
};
