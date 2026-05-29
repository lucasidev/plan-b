import type { CursadaContext } from '../types';

/**
 * Card de contexto del editor (US-049): muestra de qué cursada es esta reseña.
 * Espejo de la primera card del mockup (`V2EditorResena`). El botón "Cambiar" lleva al
 * tab Pendientes (`/reseñas?tab=pendientes`); por ahora `(member)/reseñas` no existe, así
 * que mando a `/inicio` con un TODO comentado.
 */
export function CursadaContextCard({ ctx }: { ctx: CursadaContext }) {
  return (
    <div className="flex items-center gap-3.5 rounded border border-line bg-bg-elev px-4 py-3.5">
      <div
        className="grid h-[42px] w-[42px] place-items-center rounded font-mono text-[11px] font-semibold tracking-[0.04em]"
        style={{
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent-ink)',
        }}
      >
        {ctx.matCode}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-ink">{ctx.matName}</div>
        <div className="mt-0.5 text-[11.5px] text-ink-3">
          con <b className="font-medium text-ink-2">{ctx.prof}</b> · Com {ctx.com} · {ctx.period} ·
          nota final {ctx.finalNote}
        </div>
      </div>
      {/* TODO: cuando US-048 aterrice, este botón vuelve a /reseñas?tab=pendientes. */}
      <button
        type="button"
        className="text-[11.5px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
      >
        Cambiar
      </button>
    </div>
  );
}
