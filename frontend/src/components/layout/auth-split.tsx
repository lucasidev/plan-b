import { InlineStars, Logo } from '@/components/ui';
import { cn } from '@/lib/utils';

type Props = {
  /** Right column. The interactive content (form, status card, etc.). */
  children: React.ReactNode;
  /** Hero headline JSX (renderable). Sized at 56px / line-height 1.02 by AuthSplit. */
  heading: React.ReactNode;
  /** Hero description paragraph. ~38ch. */
  description?: React.ReactNode;
  /** Optional testimonial card on a frosted-glass panel. */
  quote?: { text: string; attribution: string };
  /** Optional metric strip at the bottom of the hero column. */
  stats?: Array<{ label: string; value: string }>;
};

/**
 * Split layout for the `(auth)` route group. Direct port of `.auth` /
 * `.auth-side` from docs/design/reference/styles.css.
 *
 * Left column: apricot gradient with two radial glows, padding 48 56,
 * three rows top→bottom (logo+hero, quote, stats) via flex justify-between.
 * Right column: plain bg, content centered vertically, padding 48 64,
 * max-width 520.
 */
export function AuthSplit({ children, heading, description, quote, stats }: Props) {
  return (
    <main className="min-h-screen grid bg-bg grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/*
        Hero column anchors top-down with fixed gaps between blocks instead
        of justify-between. justify-between stretches the gaps with the
        viewport height, which was making the quote and stats float to
        unpredictable positions on tall screens. Fixed gaps keep the
        block heights stable across viewports, matching the right-column
        anchor.
      */}
      <aside
        className={cn(
          'relative overflow-hidden',
          'flex flex-col',
          'bg-[linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)]',
        )}
        style={{ padding: '48px 56px' }}
      >
        {/* Two radial glows to add depth without a hard seam. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgb(224 122 77 / 18%) 0, transparent 40%), radial-gradient(circle at 20% 90%, rgb(224 122 77 / 12%) 0, transparent 35%)',
          }}
        />

        <div className="relative z-10">
          <Logo size={28} />
          <div style={{ marginTop: 64 }}>{heading}</div>
          {description && (
            <p
              className="text-ink-2"
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                maxWidth: '38ch',
                marginTop: 18,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {quote && (
          <div
            className="relative z-10 backdrop-blur-[6px]"
            style={{
              marginTop: 64,
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 12,
              padding: '18px 20px',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--color-ink-2)',
              maxWidth: '38ch',
            }}
          >
            <InlineStars>{quote.text}</InlineStars>
            <div
              style={{
                marginTop: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-ink-3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              — {quote.attribution}
            </div>
          </div>
        )}

        {stats && stats.length > 0 && (
          <div
            className="relative z-10 flex"
            style={{
              marginTop: 48,
              gap: 24,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-ink-3)',
              letterSpacing: '0.04em',
            }}
          >
            {stats.map((s) => (
              <div key={s.label}>
                <b className="text-ink">{s.value}</b> {s.label}
              </div>
            ))}
          </div>
        )}
      </aside>

      {/*
        Right column anchors the content at the top instead of vertically
        centering. Centering causes the switcher to bounce when AuthView
        swaps between sign-in (shorter) and sign-up (taller) — the whole
        block re-centers and the switcher's vertical position drifts.
        Fixed top padding keeps the switcher pinned where it aligns with
        the hero heading on the left column; sign-up grows down and
        sign-in leaves bottom whitespace, both intentionally.
      */}
      <section
        className="flex flex-col w-full"
        style={{ padding: '140px 64px 48px', maxWidth: 520 }}
      >
        {children}
      </section>
    </main>
  );
}
