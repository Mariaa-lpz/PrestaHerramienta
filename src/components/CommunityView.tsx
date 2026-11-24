import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Star, Users, X } from 'lucide-react';
import { AppDatabase, IncidenciaData } from '../domain/types';
import { getInitials, getToolRatingStats } from '../domain/repository';

interface CommunityViewProps {
  db: AppDatabase;
  onResolveIncident: (idIncidencia: number, resolucion: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ db, onResolveIncident }) => {
  const [resolvingTarget, setResolvingTarget] = useState<IncidenciaData | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const openIncidents = db.incidencias.filter((i) => i.estado === 'Abierta').length;
  const completedLoans = db.prestamos.filter((p) => p.estado === 'Finalizado').length;
  const avgCommunityRating =
    db.resenas.length > 0
      ? (db.resenas.reduce((acc, r) => acc + r.puntuacion, 0) / db.resenas.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <p className="text-xs font-medium text-[var(--text-muted)]">Residencial Los Olivos · Jaén</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Comunidad e incidencias
        </h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Directorio de vecinos participantes, seguimiento de incidencias y normas de convivencia para préstamos seguros.
        </p>
      </header>

      <div className="grid grid-cols-2 divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Vecinos verificados</p>
          <p className="mt-1 font-mono-tabular text-xl font-semibold text-[var(--text-primary)]">
            {db.vecinos.length}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Préstamos finalizados</p>
          <p className="mt-1 font-mono-tabular text-xl font-semibold text-[var(--text-primary)]">
            {completedLoans}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Valoración media</p>
          <p className="mt-1 font-mono-tabular text-xl font-semibold text-[var(--text-primary)]">
            {avgCommunityRating} / 5
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Incidencias abiertas</p>
          <p
            className={`mt-1 font-mono-tabular text-xl font-semibold ${
              openIncidents > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {openIncidents}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Registro de incidencias */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
            <AlertTriangle className="h-4 w-4 text-[var(--accent)]" />
            Partes de incidencia ({db.incidencias.length})
          </h2>

          {db.incidencias.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Sin incidencias abiertas</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Todos los préstamos se han cerrado sin daños ni retrasos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              {db.incidencias.map((inc) => {
                const reporter = db.vecinos.find((v) => v.idVecino === inc.idReportante);
                const tool = db.herramientas.find((h) => h.idHerramienta === inc.idHerramienta);
                const isOpen = inc.estado === 'Abierta';

                return (
                  <div key={inc.idIncidencia} className="space-y-2.5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <span
                          className={
                            isOpen
                              ? 'font-semibold text-red-600 dark:text-red-400'
                              : 'font-semibold text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {inc.estado}
                        </span>
                        <span>·</span>
                        <span>Gravedad {inc.gravedad}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">{inc.fecha}</span>
                      </div>

                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingTarget(inc);
                            setResolutionText('');
                          }}
                          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                          Marcar resuelta
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{tool?.titulo || 'Herramienta'}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{inc.descripcion}</p>
                    <p className="text-xs text-[var(--text-muted)]">Reportada por {reporter?.nombre || 'Vecino'}</p>

                    {inc.resolucion && (
                      <div className="border-t border-[var(--border-color)] pt-2 text-xs text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Resolución:</strong> {inc.resolucion}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Directorio de vecinos */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            Vecinos participantes ({db.vecinos.length})
          </h2>

          <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            {db.vecinos.map((neighbor) => {
              const ownedTools = db.herramientas.filter((h) => h.idPropietario === neighbor.idVecino);
              const toolIds = ownedTools.map((h) => h.idHerramienta);
              const completedLent = db.prestamos.filter(
                (p) => toolIds.includes(p.idHerramienta) && p.estado === 'Finalizado'
              ).length;

              const ratingSum = ownedTools.reduce((acc, tool) => {
                const stats = getToolRatingStats(db.resenas, tool.idHerramienta);
                return stats.count > 0 ? acc + stats.average : acc;
              }, 0);
              const ratedCount = ownedTools.filter(
                (t) => getToolRatingStats(db.resenas, t.idHerramienta).count > 0
              ).length;
              const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : null;

              return (
                <div key={neighbor.idVecino} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] font-bold text-[var(--accent)]">
                      {getInitials(neighbor.nombre)}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold text-[var(--text-primary)]">
                        {neighbor.nombre}
                        {neighbor.verificado && (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {neighbor.direccion} · Alta {neighbor.fechaRegistro}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs">
                    <p className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                      {ownedTools.length} {ownedTools.length === 1 ? 'equipo' : 'equipos'}
                    </p>
                    <p className="inline-flex items-center justify-end gap-1 text-[var(--text-muted)] tabular-nums">
                      {avgRating ? (
                        <>
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          {avgRating} · {completedLent} prést.
                        </>
                      ) : (
                        `${completedLent} préstamos`
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Normas básicas */}
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Normas de préstamo en la comunidad</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 border-t border-[var(--border-color)] pt-5 md:grid-cols-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Revisión en mano</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Al recoger la herramienta, ambas partes comprueban que funciona bien y lleva todos sus accesorios y
              baterías.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Limpieza y puntualidad</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Se devuelve limpia y en la fecha acordada. Si necesitas algún día extra, pide una ampliación antes de que
              venza el plazo.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Fianza directa</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Si la herramienta incluye fianza, se entrega en mano y se devuelve íntegra al comprobar el buen estado
              del equipo.
            </p>
          </div>
        </div>
      </section>

      {resolvingTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setResolvingTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Cerrar incidencia</h3>
              <button
                type="button"
                onClick={() => setResolvingTarget(null)}
                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onResolveIncident(resolvingTarget.idIncidencia, resolutionText);
                setResolvingTarget(null);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="res-note" className="mb-1 block text-xs font-semibold text-[var(--text-primary)]">
                  Nota de resolución *
                </label>
                <textarea
                  id="res-note"
                  rows={3}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Ej: Accesorio repuesto y herramienta comprobada."
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingTarget(null)}
                  className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  Guardar resolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
