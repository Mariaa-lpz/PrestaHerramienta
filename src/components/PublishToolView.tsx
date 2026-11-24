import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Star, Upload } from 'lucide-react';
import { AppDatabase, HerramientaData, ToolCategory, VecinoData } from '../domain/types';
import { ctrlPublicar } from '../domain/controllers';
import { formatCurrency, getInitials, PRESET_GALLERY } from '../domain/repository';
import { ToolImage } from './ToolImage';

interface PublishToolViewProps {
  db: AppDatabase;
  currentUser: VecinoData;
  editingTool?: HerramientaData | null;
  onCancel: () => void;
  onUpdateUserData?: (datosUsuario: { nombre?: string; direccion?: string; telefono?: string }) => void;
  onSubmitTool: (
    payload: Omit<HerramientaData, 'idHerramienta' | 'idPropietario' | 'estado' | 'fechaPublicacion'>,
    editingId?: number,
    verifiedOwnerId?: number
  ) => void;
}

const CATEGORIES: ToolCategory[] = ['Eléctrica', 'Manual', 'Jardinería', 'Medición', 'Pintura'];

/**
 * REQ002 — <<boundary>> InterfazPublicarHerramienta
 */
export const InterfazPublicarHerramienta: React.FC<PublishToolViewProps> = ({
  db,
  currentUser,
  editingTool = null,
  onCancel,
  onUpdateUserData,
  onSubmitTool,
}) => {
  // REQ002: entrarSistema(usuario, contraseña) inicia sesión y crea el borrador
  const [verifiedOwner, setVerifiedOwner] = useState<VecinoData>(() => {
    const res = ctrlPublicar.entrarSistema(db, currentUser.email, currentUser.contrasena);
    return res.valido && res.usuario ? res.usuario : currentUser;
  });

  // Datos de usuario (par: añadirDatosUsuario)
  const [ownerDireccion, setOwnerDireccion] = useState(currentUser.direccion);
  const [ownerTelefono, setOwnerTelefono] = useState(currentUser.telefono);

  // Datos de herramienta y foto
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<ToolCategory>('Eléctrica');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('0');
  const [fianza, setFianza] = useState('20');
  const [disponibilidad, setDisponibilidad] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [foto, setFoto] = useState(PRESET_GALLERY[0].url);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [potencia, setPotencia] = useState('');
  const [peso, setPeso] = useState('');
  const [valorReposicion, setValorReposicion] = useState('150');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setOwnerDireccion(currentUser.direccion);
    setOwnerTelefono(currentUser.telefono);
    const res = ctrlPublicar.entrarSistema(db, currentUser.email, currentUser.contrasena);
    setVerifiedOwner(res.valido && res.usuario ? res.usuario : currentUser);
    setFormError(null);
  }, [currentUser, editingTool, db]);

  useEffect(() => {
    if (editingTool) {
      setTitulo(editingTool.titulo);
      setTipo(editingTool.tipo);
      setDescripcion(editingTool.descripcion);
      setPrecio(String(editingTool.precio));
      setFianza(String(editingTool.fianza));
      setDisponibilidad(editingTool.disponibilidad);
      setCondiciones(editingTool.condiciones);
      setFoto(editingTool.foto);
      setMarca(editingTool.specs.marca);
      setModelo(editingTool.specs.modelo);
      setPotencia(editingTool.specs.potenciaOCapacidad);
      setPeso(editingTool.specs.peso);
      setValorReposicion(String(editingTool.specs.valorReposicion));
    } else {
      setTitulo('');
      setTipo('Eléctrica');
      setDescripcion('');
      setPrecio('0');
      setFianza('20');
      setDisponibilidad('Lunes a viernes de 18:30 a 21:00');
      setCondiciones('Devolver limpia, revisada y con todos sus accesorios.');
      setFoto(PRESET_GALLERY[0].url);
      setMarca('');
      setModelo('');
      setPotencia('');
      setPeso('');
      setValorReposicion('150');
    }
  }, [editingTool]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedPrecio = parseFloat(precio);
    const parsedFianza = parseFloat(fianza) || 0;

    // Validación en bucle según REQ002 (datos, fecha y precio)
    const datosCheck = ctrlPublicar.validarDatos({ titulo, descripcion, condiciones }, foto);
    if (!datosCheck.datosValidos) {
      setFormError(datosCheck.error || 'Revisa los datos y la fotografía.');
      return;
    }

    const fechaCheck = ctrlPublicar.validarFecha(disponibilidad);
    if (!fechaCheck.fechaValida) {
      setFormError(fechaCheck.error || 'Indica una disponibilidad válida.');
      return;
    }

    const precioCheck = ctrlPublicar.validarPrecio(parsedPrecio, parsedFianza);
    if (!precioCheck.precioValido) {
      setFormError(precioCheck.error || 'Tarifa diaria inválida.');
      return;
    }

    if (
      onUpdateUserData &&
      verifiedOwner &&
      (ownerDireccion.trim() !== verifiedOwner.direccion || ownerTelefono.trim() !== verifiedOwner.telefono)
    ) {
      onUpdateUserData({ direccion: ownerDireccion, telefono: ownerTelefono });
    }

    onSubmitTool(
      {
        titulo,
        tipo,
        descripcion,
        precio: Number.isNaN(parsedPrecio) ? 0 : parsedPrecio,
        fianza: parsedFianza,
        disponibilidad,
        condiciones,
        foto,
        specs: {
          marca: marca.trim() || 'Genérica',
          modelo: modelo.trim() || 'Estándar',
          potenciaOCapacidad: potencia.trim() || 'Uso doméstico',
          peso: peso.trim() || '2,0 kg',
          valorReposicion: parseFloat(valorReposicion) || 100,
        },
      },
      editingTool?.idHerramienta,
      verifiedOwner?.idVecino
    );
  };

  const parsedPrice = parseFloat(precio) || 0;
  const parsedDeposit = parseFloat(fianza) || 0;
  const activeOwnerDisplay = verifiedOwner || currentUser;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <p className="text-xs font-medium text-[var(--text-muted)]">
          Inventario comunitario · {editingTool ? `Editando Ref. ${editingTool.idHerramienta}` : 'Nuevo anuncio'}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {editingTool ? 'Editar herramienta publicada' : 'Publicar herramienta en la comunidad'}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Completa la ficha técnica, fotografía, disponibilidad y tarifa para que tus vecinos puedan solicitarla.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[1.4fr_0.95fr]">
        {/* Formulario principal */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {formError}
            </div>
          )}

          {/* Sección de datos del propietario (añadirDatosUsuario con sesión activa) */}
          {!editingTool && (
            <div className="space-y-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)]/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
                    {getInitials(verifiedOwner.nombre)}
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">
                    Publica {verifiedOwner.nombre}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Sesión verificada
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="pub-owner-dir" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Portal / Vivienda de entrega
                  </label>
                  <input
                    id="pub-owner-dir"
                    type="text"
                    value={ownerDireccion}
                    onChange={(e) => setOwnerDireccion(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pub-owner-tel" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Teléfono de contacto
                  </label>
                  <input
                    id="pub-owner-tel"
                    type="tel"
                    value={ownerTelefono}
                    onChange={(e) => setOwnerTelefono(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">1. Información general</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.5fr_1fr]">
                <div>
                  <label htmlFor="pub-titulo" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Nombre de la herramienta *
                  </label>
                  <input
                    id="pub-titulo"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Lijadora excéntrica Makita 300W + discos"
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="pub-tipo" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Categoría *
                  </label>
                  <select
                    id="pub-tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as ToolCategory)}
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pub-desc" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                  Descripción y accesorios incluidos *
                </label>
                <textarea
                  id="pub-desc"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe aplicaciones recomendadas, si incluye maletín, baterías, cargador, brocas o consumibles..."
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">2. Especificaciones técnicas</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="pub-marca" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Marca
                  </label>
                  <input
                    id="pub-marca"
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Bosch / Makita"
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pub-modelo" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Modelo
                  </label>
                  <input
                    id="pub-modelo"
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="GSB 18V-55"
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pub-potencia" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Potencia / Capacidad
                  </label>
                  <input
                    id="pub-potencia"
                    type="text"
                    value={potencia}
                    onChange={(e) => setPotencia(e.target.value)}
                    placeholder="18V · 55 Nm"
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pub-peso" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Peso
                  </label>
                  <input
                    id="pub-peso"
                    type="text"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="1,8 kg"
                    className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">3. Tarifa, fianza y disponibilidad</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="pub-precio" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Tarifa diaria (€) *
                  </label>
                  <input
                    id="pub-precio"
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">0 € = cesión gratuita.</p>
                </div>
                <div>
                  <label htmlFor="pub-fianza" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Fianza reembolsable (€)
                  </label>
                  <input
                    id="pub-fianza"
                    type="number"
                    min="0"
                    max="500"
                    step="5"
                    value={fianza}
                    onChange={(e) => setFianza(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pub-valor" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Valor reposición (€)
                  </label>
                  <input
                    id="pub-valor"
                    type="number"
                    min="10"
                    max="5000"
                    step="5"
                    value={valorReposicion}
                    onChange={(e) => setValorReposicion(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono-tabular text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pub-disp" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Disponibilidad y franja de entrega *
                  </label>
                  <input
                    id="pub-disp"
                    type="text"
                    value={disponibilidad}
                    onChange={(e) => setDisponibilidad(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pub-cond" className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                    Condiciones de devolución *
                  </label>
                  <input
                    id="pub-cond"
                    type="text"
                    value={condiciones}
                    onChange={(e) => setCondiciones(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-[var(--border-color)] pt-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">4. Fotografía del equipo</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="Ruta o URL de imagen..."
                  aria-label="URL de fotografía"
                  className="h-10 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs font-mono-tabular text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                  <Upload className="h-3.5 w-3.5" />
                  Subir foto local
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_GALLERY.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFoto(preset.url)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      foto === preset.url
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-color)] pt-5">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                {editingTool ? 'Guardar cambios' : 'Publicar como disponible'}
              </button>
            </div>
          </form>

          {/* Vista previa en tiempo real */}
          <aside className="space-y-3 xl:sticky xl:top-24">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <Eye className="h-4 w-4" />
              Vista previa en tiempo real
            </div>

            <article className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <div className="aspect-[4/3] border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
                <ToolImage src={foto} alt={titulo || 'Vista previa'} className="h-full w-full object-cover" />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    {marca.trim() || 'Marca'} · {tipo}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--text-primary)]">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    Nueva
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-[var(--text-primary)]">
                  {titulo.trim() || 'Título de tu herramienta'}
                </h3>

                <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {descripcion.trim() ||
                    'Aquí aparecerá el resumen técnico, accesorios incluidos y estado del equipo.'}
                </p>

                <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border-color)] pt-3.5">
                  <span className="font-mono-tabular text-base font-bold text-[var(--text-primary)]">
                    {parsedPrice === 0 ? 'Gratis' : `${formatCurrency(parsedPrice)} /día`}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Disponible</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded bg-[var(--bg-subtle)] text-[10px] font-bold text-[var(--text-primary)]">
                      {getInitials(activeOwnerDisplay.nombre)}
                    </div>
                    <span className="text-[var(--text-muted)]">
                      {activeOwnerDisplay.nombre} · {ownerDireccion}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-[var(--text-muted)]">
                    {parsedDeposit > 0 ? `Fianza ${parsedDeposit} €` : 'Sin fianza'}
                  </span>
                </div>
              </div>
            </article>
          </aside>
        </div>
    </div>
  );
};

export const PublishToolView = InterfazPublicarHerramienta;
