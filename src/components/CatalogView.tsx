import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Bookmark,
  LayoutGrid,
  List,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import heroWorkshopImg from '../assets/images/hero_workshop_showcase_1795536828448.jpg';
import { AppDatabase, HerramientaData, ToolCategory, VecinoData } from '../domain/types';
import { ctrlBuscar } from '../domain/controllers';
import { formatCurrency, getInitials } from '../domain/repository';
import { ToolImage } from './ToolImage';

interface CatalogViewProps {
  db: AppDatabase;
  currentUser: VecinoData;
  onSelectTool: (tool: HerramientaData, openBookingTab?: boolean) => void;
  onToggleFavorite: (toolId: number) => void;
  onNavigatePublish: () => void;
}

const CATEGORIES: { label: string; value: '' | ToolCategory }[] = [
  { label: 'Todas', value: '' },
  { label: 'Eléctricas', value: 'Eléctrica' },
  { label: 'Manuales', value: 'Manual' },
  { label: 'Jardinería', value: 'Jardinería' },
  { label: 'Medición', value: 'Medición' },
  { label: 'Pintura', value: 'Pintura' },
];

function formatRelativeDate(isoDate: string): string {
  const target = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 7) return `Hace ${diffDays} días`;
  return target.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * REQ003 — <<boundary>> InterfazBuscarHerramientas
 */
export const InterfazBuscarHerramientas: React.FC<CatalogViewProps> = ({
  db,
  currentUser,
  onSelectTool,
  onToggleFavorite,
  onNavigatePublish,
}) => {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState<'' | ToolCategory>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'disponible' | 'presentada'>('');
  const [priceBand, setPriceBand] = useState<'' | 'gratis' | 'hasta3' | 'mas3'>('');
  const [noDepositOnly, setNoDepositOnly] = useState(false);
  const [portalFilter, setPortalFilter] = useState<'' | 'Portal 1' | 'Portal 2' | 'Portal 3'>('');
  const [sortBy, setSortBy] = useState<'recientes' | 'valoradas' | 'precio-asc' | 'precio-desc'>('recientes');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const catalogSectionRef = useRef<HTMLDivElement | null>(null);

  const favIds = db.favoritos[currentUser.idVecino] || [];

  // 1.1: cargarCatalogo() -> Herramienta.obtenerDatos()
  const activeCatalog = useMemo(() => ctrlBuscar.cargarCatalogo(db), [db]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '': activeCatalog.length };
    for (const h of activeCatalog) {
      counts[h.tipo] = (counts[h.tipo] || 0) + 1;
    }
    return counts;
  }, [activeCatalog]);

  // 2.1: filtrarHerramientas(criterio, tipo, ...) -> Herramienta.cumpleCriterio(...)
  const filteredTools = useMemo(
    () =>
      ctrlBuscar.filtrarHerramientas(db, {
        criterio: searchText,
        tipo: category,
        estado: statusFilter,
        precio: priceBand,
        sinFianza: noDepositOnly,
        portal: portalFilter,
        soloFavoritos: onlyFavorites,
        idUsuario: currentUser.idVecino,
        orden: sortBy,
      }),
    [
      db,
      searchText,
      category,
      statusFilter,
      priceBand,
      noDepositOnly,
      portalFilter,
      onlyFavorites,
      currentUser.idVecino,
      sortBy,
    ]
  );

  // 3.1 / 4: obtenerDetalle()
  const handleOpenTool = (idHerramienta: number, openBooking = false) => {
    const detail = ctrlBuscar.obtenerDetalle(db, idHerramienta);
    if (detail) {
      onSelectTool(detail, openBooking);
    }
  };

  const availableCount = activeCatalog.filter((h) => h.estado === 'disponible').length;
  const completedLoansCount = db.prestamos.filter((p) => p.estado === 'Finalizado').length;

  const spotlightTools = useMemo(() => {
    return [...activeCatalog]
      .filter((h) => h.estado === 'disponible')
      .map((h) => ({
        tool: h,
        rating: ctrlBuscar.obtenerMediaValoracion(db, h.idHerramienta),
      }))
      .sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count)
      .slice(0, 3);
  }, [activeCatalog, db]);

  const recentSharedReviews = useMemo(() => {
    return [...db.resenas]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.idResena - a.idResena)
      .map((res) => {
        const tool = db.herramientas.find((h) => h.idHerramienta === res.idHerramienta);
        if (!tool) return null;
        const owner = db.vecinos.find((v) => v.idVecino === tool.idPropietario);
        const reviewer = db.vecinos.find((v) => v.idVecino === res.idAutor);
        return { res, tool, owner, reviewer };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 6);
  }, [db.resenas, db.herramientas, db.vecinos]);

  const communityRatingAverage = useMemo(() => {
    if (!db.resenas.length) return '5,0';
    const sum = db.resenas.reduce((acc, r) => acc + r.puntuacion, 0);
    return (sum / db.resenas.length).toFixed(1).replace('.', ',');
  }, [db.resenas]);

  const scrollToCatalog = () => {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => searchInputRef.current?.focus(), 250);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setCategory('');
    setStatusFilter('');
    setPriceBand('');
    setNoDepositOnly(false);
    setPortalFilter('');
    setOnlyFavorites(false);
    setSortBy('recientes');
  };

  const hasActiveFilters = Boolean(
    searchText || category || statusFilter || priceBand || noDepositOnly || portalFilter || onlyFavorites
  );

  const filterSidebarContent = (
    <div className="space-y-6 text-sm">
      {/* Categorías */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">Categorías</h2>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            const count = categoryCounts[cat.value] || 0;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="font-mono-tabular text-xs opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="space-y-2 border-t border-[var(--border-color)] pt-5">
        <h2 className="text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">Estado</h2>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Todas', value: '' as const },
            { label: 'Disponibles ahora', value: 'disponible' as const },
            { label: 'En préstamo', value: 'presentada' as const },
          ].map((opt) => (
            <label key={opt.label} className="flex cursor-pointer items-center gap-2 text-[var(--text-secondary)]">
              <input
                type="radio"
                name="status-filter"
                checked={statusFilter === opt.value}
                onChange={() => setStatusFilter(opt.value)}
                className="accent-[var(--accent)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tarifa diaria */}
      <div className="space-y-2 border-t border-[var(--border-color)] pt-5">
        <h2 className="text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">Tarifa diaria</h2>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Cualquier tarifa', value: '' as const },
            { label: 'Gratis (0 €)', value: 'gratis' as const },
            { label: 'Hasta 3,00 €/día', value: 'hasta3' as const },
            { label: 'Más de 3,00 €/día', value: 'mas3' as const },
          ].map((opt) => (
            <label key={opt.label} className="flex cursor-pointer items-center gap-2 text-[var(--text-secondary)]">
              <input
                type="radio"
                name="price-filter"
                checked={priceBand === opt.value}
                onChange={() => setPriceBand(opt.value)}
                className="accent-[var(--accent)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fianza y Portal */}
      <div className="space-y-3 border-t border-[var(--border-color)] pt-5">
        <h2 className="text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">Condiciones y portal</h2>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={noDepositOnly}
            onChange={(e) => setNoDepositOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
          />
          <span>Sin fianza previa</span>
        </label>

        <div>
          <label htmlFor="portal-select" className="mb-1 block text-xs text-[var(--text-muted)]">
            Portal de recogida
          </label>
          <select
            id="portal-select"
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value as '' | 'Portal 1' | 'Portal 2' | 'Portal 3')}
            className="h-9 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Todos los portales</option>
            <option value="Portal 1">Portal 1</option>
            <option value="Portal 2">Portal 2</option>
            <option value="Portal 3">Portal 3</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        >
          Limpiar todos los filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* HERO EDITORIAL OSCURO DE ALTO CONTRASTE */}
      <section className="space-y-5">
        <div className="grid grid-cols-1 items-stretch overflow-hidden rounded-2xl border border-neutral-800 bg-[#131418] text-white shadow-xl lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-amber-400">
                Residencial Los Olivos · Jaén
              </p>
              <h1 className="max-w-xl text-balance text-[clamp(1.9rem,3.4vw,2.85rem)] leading-[1.06] font-extrabold tracking-[-0.03em] text-white">
                Herramientas profesionales a un portal de distancia.
              </h1>
              <p className="max-w-lg text-[15px] leading-relaxed text-neutral-300">
                Alquila o comparte equipos Bosch, DeWalt, STIHL, Rubi y Fluke entre vecinos verificados. Reserva por
                días, recoge en mano y ahorra en cada reforma.
              </p>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') scrollToCatalog();
                    }}
                    placeholder="¿Qué necesitas? Taladro, amoladora, láser..."
                    aria-label="Búsqueda rápida en portada"
                    className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900/90 pr-3 pl-10 text-sm text-white placeholder:text-neutral-400 focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Ver {activeCatalog.length} equipos
                  <ArrowDownRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-400">
                <span>Recogida directa en Portal 1, 2 y 3 · Fianza reembolsable en mano</span>
                <button
                  type="button"
                  onClick={onNavigatePublish}
                  className="inline-flex items-center gap-1 font-semibold text-white hover:text-amber-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Publicar una herramienta
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[240px] bg-neutral-900 lg:h-full">
            <ToolImage
              src={heroWorkshopImg}
              alt="Banco de trabajo con taladro inalámbrico, nivel láser y juego de llaves dinamométricas"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#131418] via-[#131418]/15 to-transparent lg:block" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-5 sm:p-6">
              <p className="text-xs font-medium text-neutral-300">Taller compartido vecinal</p>
              <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                {availableCount} de {activeCatalog.length} herramientas listas para entrega hoy
              </p>
            </div>
          </div>
        </div>

        {/* FRANJA DE MÉTRICAS REALES EN ANCHO COMPLETO */}
        <div className="grid grid-cols-2 divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-3.5">
            <p className="text-xs text-[var(--text-muted)]">Catálogo comunitario</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">
              {activeCatalog.length} equipos <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">({availableCount} disp.)</span>
            </p>
          </div>
          <div className="px-5 py-3.5">
            <p className="text-xs text-[var(--text-muted)]">Préstamos completados</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">
              {completedLoansCount}
            </p>
          </div>
          <div className="px-5 py-3.5">
            <p className="text-xs text-[var(--text-muted)]">Vecinos verificados</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--text-primary)]">
              {db.vecinos.length} <span className="text-xs font-normal text-[var(--text-muted)]">en 3 portales</span>
            </p>
          </div>
          <div className="px-5 py-3.5">
            <p className="text-xs text-[var(--text-muted)]">Comisión vecinal</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-emerald-600 dark:text-emerald-400">
              0,00 €
            </p>
          </div>
        </div>
      </section>

      {/* DESTACADOS MEJOR VALORADOS (solo visible sin filtros activos) */}
      {!hasActiveFilters && !category && spotlightTools.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] sm:text-base">
              Equipos mejor valorados por tus vecinos
            </h2>
            <span className="text-xs text-[var(--text-muted)]">Disponibles hoy</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {spotlightTools.map(({ tool, rating }) => (
              <div
                key={tool.idHerramienta}
                onClick={() => handleOpenTool(tool.idHerramienta)}
                className="card-elevated group flex cursor-pointer items-center gap-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
              >
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)]">
                  <ToolImage
                    src={tool.foto}
                    alt={tool.titulo}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                    <span className="truncate font-medium">{tool.specs.marca}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--text-primary)] tabular-nums">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {rating.average > 0 ? rating.average.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-snug font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                    {tool.titulo}
                  </p>
                  <div className="flex items-center justify-between pt-0.5 text-xs">
                    <span className="font-mono-tabular font-bold text-[var(--text-primary)]">
                      {tool.precio === 0 ? 'Gratis' : `${formatCurrency(tool.precio)}/día`}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent)]">
                      Ver
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CATÁLOGO INTERACTIVO */}
      <div id="catalogo-buscador" ref={catalogSectionRef} className="scroll-mt-24 grid grid-cols-1 gap-8 lg:grid-cols-[248px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5">
            {filterSidebarContent}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {/* Selector rápido por categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              const count = categoryCounts[cat.value] || 0;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`font-mono-tabular text-[11px] ${active ? 'text-white/85' : 'text-[var(--text-muted)]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar taladro, sierra, láser, Bosch, vecino..."
                aria-label="Buscar herramientas"
                className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] pr-9 pl-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--text-primary)] lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
              </button>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'recientes' | 'valoradas' | 'precio-asc' | 'precio-desc')
                }
                aria-label="Ordenar resultados"
                className="h-10 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none sm:text-sm"
              >
                <option value="recientes">Orden: Novedades</option>
                <option value="valoradas">Mejor valoradas</option>
                <option value="precio-asc">Tarifa: menor a mayor</option>
                <option value="precio-desc">Tarifa: mayor a menor</option>
              </select>

              <button
                type="button"
                onClick={() => setOnlyFavorites((prev) => !prev)}
                className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  onlyFavorites
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" fill={onlyFavorites ? 'currentColor' : 'none'} />
                Guardadas ({favIds.length})
              </button>

              <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Vista cuadrícula"
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="Vista lista"
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {mobileFiltersOpen && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 lg:hidden">
              {filterSidebarContent}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="tabular-nums">
              Mostrando <strong className="text-[var(--text-primary)]">{filteredTools.length}</strong>{' '}
              {filteredTools.length === 1 ? 'herramienta' : 'herramientas'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Restablecer búsqueda
              </button>
            )}
          </div>

          {filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-16 text-center">
              <SlidersHorizontal className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                No hay herramientas que coincidan
              </h3>
              <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">
                Ajusta los filtros laterales o publica una herramienta nueva en el inventario comunitario.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  Ver todo el catálogo
                </button>
                <button
                  type="button"
                  onClick={onNavigatePublish}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  Publicar herramienta
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool) => {
                const owner = db.vecinos.find((v) => v.idVecino === tool.idPropietario);
                const rating = ctrlBuscar.obtenerMediaValoracion(db, tool.idHerramienta);
                const isOwner = owner?.idVecino === currentUser.idVecino;
                const isFav = favIds.includes(tool.idHerramienta);
                const isAvailable = tool.estado === 'disponible';

                return (
                  <article
                    key={tool.idHerramienta}
                    className="card-elevated group flex flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                  >
                    <div
                      onClick={() => handleOpenTool(tool.idHerramienta)}
                      className="relative aspect-[4/3] cursor-pointer overflow-hidden border-b border-[var(--border-color)] bg-[var(--bg-subtle)]"
                    >
                      <ToolImage
                        src={tool.foto}
                        alt={tool.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3.5 py-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="text-[11px] font-semibold text-white">Ver ficha técnica y calendario</span>
                        <ArrowRight className="h-3.5 w-3.5 text-white" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(tool.idHerramienta);
                        }}
                        aria-label={isFav ? 'Quitar de guardadas' : 'Guardar herramienta'}
                        className={`absolute top-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-lg border backdrop-blur-xs transition-colors ${
                          isFav
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                            : 'border-black/10 bg-white/90 text-neutral-700 hover:bg-white dark:border-white/10 dark:bg-neutral-900/80 dark:text-neutral-200'
                        }`}
                      >
                        <Bookmark className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                        <span className="truncate font-medium">
                          {tool.specs.marca} · {tool.tipo}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-[var(--text-primary)] tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {rating.count > 0 ? `${rating.average.toFixed(1)} (${rating.count})` : 'Nueva'}
                        </span>
                      </div>

                      <h3
                        onClick={() => handleOpenTool(tool.idHerramienta)}
                        className="mt-1.5 line-clamp-2 cursor-pointer text-[15px] leading-snug font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]"
                      >
                        {tool.titulo}
                      </h3>

                      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                        {tool.specs.potenciaOCapacidad}
                      </p>

                      <div className="mt-auto pt-3.5">
                        <div className="flex items-baseline justify-between gap-2 border-t border-[var(--border-color)] pt-3">
                          <div>
                            <span className="font-mono-tabular text-[17px] font-extrabold text-[var(--text-primary)]">
                              {tool.precio === 0 ? 'Gratis' : formatCurrency(tool.precio)}
                            </span>
                            {tool.precio > 0 && (
                              <span className="ml-0.5 text-xs text-[var(--text-muted)]">/día</span>
                            )}
                            {tool.fianza > 0 && (
                              <span className="ml-2 font-mono-tabular text-[11px] text-[var(--text-muted)]">
                                · Fianza {tool.fianza} €
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-xs font-semibold ${
                              isAvailable
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-[var(--accent)]'
                            }`}
                          >
                            {isAvailable ? 'Disponible' : 'En préstamo'}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="grid h-5 w-5 shrink-0 place-items-center rounded bg-[var(--bg-subtle)] text-[10px] font-bold text-[var(--text-primary)]">
                              {owner ? getInitials(owner.nombre) : 'VE'}
                            </div>
                            <span className="truncate">
                              {owner?.nombre} · {owner?.direccion}
                            </span>
                          </div>
                          {owner?.verificado && (
                            <ShieldCheck
                              className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                              aria-label="Vecino verificado"
                            />
                          )}
                        </div>

                        <div className="mt-3.5 grid grid-cols-[auto_1fr] gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenTool(tool.idHerramienta)}
                            className="whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                          >
                            Ficha
                          </button>
                          {isOwner ? (
                            <button
                              type="button"
                              onClick={() => handleOpenTool(tool.idHerramienta)}
                              className="whitespace-nowrap rounded-lg bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              Tu equipo
                            </button>
                          ) : isAvailable ? (
                            <button
                              type="button"
                              onClick={() => handleOpenTool(tool.idHerramienta, true)}
                              className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                            >
                              Reservar ahora
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenTool(tool.idHerramienta)}
                              className="whitespace-nowrap rounded-lg bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
                            >
                              Ver fechas
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              {filteredTools.map((tool) => {
                const owner = db.vecinos.find((v) => v.idVecino === tool.idPropietario);
                const rating = ctrlBuscar.obtenerMediaValoracion(db, tool.idHerramienta);
                const isOwner = owner?.idVecino === currentUser.idVecino;
                const isAvailable = tool.estado === 'disponible';

                return (
                  <div
                    key={tool.idHerramienta}
                    className="flex flex-col gap-4 p-4 transition-colors hover:bg-[var(--bg-hover)] sm:flex-row sm:items-center"
                  >
                    <div
                      onClick={() => handleOpenTool(tool.idHerramienta)}
                      className="h-24 w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] sm:w-32"
                    >
                      <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>{tool.specs.marca}</span>
                        <span>·</span>
                        <span>{tool.tipo}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-[var(--text-primary)] tabular-nums">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          {rating.count > 0 ? `${rating.average.toFixed(1)} (${rating.count})` : 'Nueva'}
                        </span>
                        <span>·</span>
                        <span className={isAvailable ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}>
                          {isAvailable ? 'Disponible' : 'En préstamo'}
                        </span>
                      </div>
                      <h3
                        onClick={() => handleOpenTool(tool.idHerramienta)}
                        className="cursor-pointer truncate text-base font-bold text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        {tool.titulo}
                      </h3>
                      <p className="line-clamp-1 text-sm text-[var(--text-secondary)]">
                        {tool.specs.potenciaOCapacidad} — {tool.descripcion}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {owner?.nombre} ({owner?.direccion})
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="text-left sm:text-right">
                        <p className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                          {tool.precio === 0 ? 'Gratis' : `${formatCurrency(tool.precio)} / día`}
                        </p>
                        <p className="font-mono-tabular text-xs text-[var(--text-muted)]">
                          {tool.fianza > 0 ? `Fianza ${tool.fianza} €` : 'Sin fianza'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenTool(tool.idHerramienta)}
                          className="whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                          Ficha
                        </button>
                        {!isOwner && isAvailable && (
                          <button
                            type="button"
                            onClick={() => handleOpenTool(tool.idHerramienta, true)}
                            className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                          >
                            Solicitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* HERRAMIENTAS RECIENTEMENTE COMPARTIDAS Y VALORACIONES DE VECINOS */}
      {recentSharedReviews.length > 0 && (
        <section className="space-y-5 border-t border-[var(--border-color)] pt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
                Actividad reciente en la comunidad
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                Herramientas recientemente compartidas
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Últimas entregas completadas y comentarios reales de vecinos tras finalizar su préstamo.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2.5">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                {communityRatingAverage} / 5
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                · {db.resenas.length} valoraciones
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSharedReviews.map(({ res, tool, owner, reviewer }) => (
              <article
                key={res.idResena}
                onClick={() => handleOpenTool(tool.idHerramienta)}
                className="card-elevated group flex cursor-pointer flex-col justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                    <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)]">
                      <ToolImage
                        src={tool.foto}
                        alt={tool.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-[var(--text-muted)]">
                        {tool.specs.marca} · Cedida por {owner?.nombre || 'Vecino'}
                      </p>
                      <h3 className="line-clamp-1 text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                        {tool.titulo}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {owner?.direccion || 'Residencial Los Olivos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5" aria-label={`Valoración de ${res.puntuacion} sobre 5`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= res.puntuacion
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-[var(--border-strong)]'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 font-mono-tabular text-xs font-bold text-[var(--text-primary)]">
                        {res.puntuacion.toFixed(1).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {formatRelativeDate(res.fecha)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    “{res.comentario}”
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border-color)] pt-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-[var(--bg-subtle)] text-[10px] font-bold text-[var(--text-primary)]">
                      {getInitials(res.autor)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">{res.autor}</p>
                      <p className="truncate text-[10px] text-[var(--text-muted)]">
                        {reviewer?.direccion || 'Vecino verificado'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
                    Ver equipo
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export const CatalogView = InterfazBuscarHerramientas;
