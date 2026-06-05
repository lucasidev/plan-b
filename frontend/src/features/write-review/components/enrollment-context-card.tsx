import type { EnrollmentContext } from '../types';

/**
 * Editor context card (US-049): shows which enrollment this review is for. Mirrors the
 * first card of the mockup (`V2EditorResena`). The "Cambiar" button is supposed to lead
 * to the Pending tab (`/reviews?tab=pending`); since `(member)/reviews` does not exist
 * yet, the link is a no-op with a TODO comment.
 */
export function EnrollmentContextCard({ ctx }: { ctx: EnrollmentContext }) {
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
      {/* TODO: once US-048 lands, this button will navigate to /reviews?tab=pending. */}
      <button
        type="button"
        className="text-[11.5px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
      >
        Cambiar
      </button>
    </div>
  );
}
