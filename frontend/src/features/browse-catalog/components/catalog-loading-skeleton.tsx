/**
 * Skeleton compartido por los 4 `loading.tsx` del catálogo público (US-001). `variant="list"`
 * para universidades/carreras/planes (filas), `variant="grid"` para materias (secciones por
 * año con tarjetas). Server component: es markup estático, no necesita `'use client'`.
 */
export function CatalogLoadingSkeleton({ variant = 'list' }: { variant?: 'list' | 'grid' }) {
  if (variant === 'grid') {
    return (
      <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando materias…</span>
        {[0, 1].map((section) => (
          <div key={section} className="flex flex-col gap-3">
            <div className="h-4 w-20 animate-pulse rounded bg-line-2" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <div
                  key={card}
                  className="h-[72px] animate-pulse rounded-lg border border-line bg-bg-card"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando catálogo…</span>
      <ul className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((row) => (
          <li
            key={row}
            className="h-[52px] animate-pulse rounded-lg border border-line bg-bg-card"
          />
        ))}
      </ul>
    </div>
  );
}
