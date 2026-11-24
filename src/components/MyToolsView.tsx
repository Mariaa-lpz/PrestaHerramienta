import React from 'react';
import { Edit3, PauseCircle, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { AppDatabase, HerramientaData, VecinoData } from '../domain/types';
import { formatCurrency, getToolRatingStats } from '../domain/repository';
import { ToolImage } from './ToolImage';

interface MyToolsViewProps {
  db: AppDatabase;
  currentUser: VecinoData;
  onEditTool: (tool: HerramientaData) => void;
  onToggleStatus: (toolId: number) => void;
  onDeleteTool: (toolId: number) => void;
  onNavigatePublish: () => void;
}

export const MyToolsView: React.FC<MyToolsViewProps> = ({
  db,
  currentUser,
  onEditTool,
  onToggleStatus,
  onDeleteTool,
  onNavigatePublish,
}) => {
  const myTools = db.herramientas.filter((h) => h.idPropietario === currentUser.idVecino);

  const totalLoansEarned = myTools.reduce((acc, tool) => {
    const toolLoans = db.prestamos.filter((p) => p.idHerramienta === tool.idHerramienta);
    return acc + toolLoans.reduce((s, p) => s + p.costeTotal, 0);
  }, 0);

  const totalLoansCount = myTools.reduce(
    (acc, tool) => acc + db.prestamos.filter((p) => p.idHerramienta === tool.idHerramienta).length,
    0
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Panel de propietario · {currentUser.nombre}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Mis equipos publicados
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Administra tus equipos compartidos, pausa su visibilidad cuando los necesites o actualiza tarifas y fianza.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigatePublish}
          className="inline-flex items-center gap-2 self-start whitespace-nowrap rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          Publicar herramienta
        </button>
      </header>

      <div className="grid grid-cols-1 divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Equipos en tu inventario</p>
          <p className="mt-1 font-mono-tabular text-xl font-semibold text-[var(--text-primary)]">
            {myTools.length}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Préstamos realizados</p>
          <p className="mt-1 font-mono-tabular text-xl font-semibold text-[var(--text-primary)]">
            {totalLoansCount}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Ingresos por cesión</p>
          <p className="mt-1 font-mono-tabular text-xl font-semibold text-[var(--accent)]">
            {formatCurrency(totalLoansEarned)}
          </p>
        </div>
      </div>

      {myTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-16 text-center">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Todavía no has publicado herramientas</h3>
          <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">
            Comparte ese taladro, escalera o equipo de medición que solo usas un par de veces al año con tus vecinos.
          </p>
          <button
            type="button"
            onClick={onNavigatePublish}
            className="mt-5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Publicar mi primera herramienta
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
          {myTools.map((tool) => {
            const rating = getToolRatingStats(db.resenas, tool.idHerramienta);
            const loansCount = db.prestamos.filter((p) => p.idHerramienta === tool.idHerramienta).length;
            const pendingCount = db.solicitudes.filter(
              (s) => s.idHerramienta === tool.idHerramienta && s.estado === 'Pendiente'
            ).length;

            return (
              <div
                key={tool.idHerramienta}
                className="flex flex-col gap-5 p-5 transition-colors hover:bg-[var(--bg-hover)]/45 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)]">
                    <ToolImage src={tool.foto} alt={tool.titulo} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-mono-tabular">Ref. {tool.idHerramienta}</span>
                      <span>·</span>
                      <span>{tool.tipo}</span>
                      <span>·</span>
                      <span
                        className={
                          tool.estado === 'disponible'
                            ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                            : tool.estado === 'presentada'
                            ? 'font-semibold text-[var(--accent)]'
                            : 'font-semibold text-[var(--text-muted)]'
                        }
                      >
                        {tool.estado === 'pausada'
                          ? 'Pausada (oculta)'
                          : tool.estado === 'presentada'
                          ? 'En préstamo'
                          : 'Disponible'}
                      </span>
                    </div>
                    <h3 className="truncate text-base font-bold text-[var(--text-primary)]">{tool.titulo}</h3>
                    <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                      Tarifa: {tool.precio === 0 ? 'Gratis' : `${formatCurrency(tool.precio)}/día`} · Fianza:{' '}
                      {formatCurrency(tool.fianza)} · {loansCount} préstamos ·{' '}
                      {rating.count > 0 ? `★ ${rating.average.toFixed(1)}` : 'Sin reseñas'}
                      {pendingCount > 0 && ` · ${pendingCount} solicitud pendiente`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(tool.idHerramienta)}
                    disabled={tool.estado === 'presentada'}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {tool.estado === 'pausada' ? (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" />
                        Reactivar
                      </>
                    ) : (
                      <>
                        <PauseCircle className="h-3.5 w-3.5" />
                        Pausar
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditTool(tool)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTool(tool.idHerramienta)}
                    disabled={tool.estado === 'presentada'}
                    aria-label={`Eliminar ${tool.titulo}`}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
