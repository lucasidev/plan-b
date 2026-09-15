import './planb.css';

/**
 * Sin un loading boundary en ninguna de las dos puntas, la navegación suave entre dos rutas
 * force-dynamic de (planb) no termina en el build de producción.
 *
 * La forma de la cabecera de `PageFrame` (`.pb-content` + `.pb-head`, con la tira `.pb-stats`),
 * genérica para toda ficha: no intenta anticipar cuántas líneas o columnas trae el contenido real.
 */
export function PageFrameSkeleton() {
  return (
    <div className="pb-content" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="pb-head">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 animate-pulse rounded bg-line-2" />
          <div className="h-8 w-72 animate-pulse rounded bg-line-2" />
          <div className="h-4 w-96 animate-pulse rounded bg-line-2" />
        </div>
        <div className="pb-stats">
          {[0, 1, 2, 3].map((cell) => (
            <div key={cell}>
              <div className="h-4 w-12 animate-pulse rounded bg-line-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
