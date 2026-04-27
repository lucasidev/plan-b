import { Logo } from '@/components/ui';
import { cn } from '@/lib/utils';

type Props = {
  /** Right column. The actual interactive content (form, status card, etc.). */
  children: React.ReactNode;
  /**
   * Left column hero. Heading + lede typically shared across sign-in / sign-up
   * / verify-email so users don't get visual whiplash navigating between
   * states. Use a `<DisplayHeading>` here.
   */
  heading: React.ReactNode;
  /** Hero paragraph below the heading. ~38ch reads best in this column. */
  description?: React.ReactNode;
  /**
   * Optional testimonial card. Renders inside a frosted-glass panel so it
   * sits on top of the apricot gradient without competing with the heading.
   */
  quote?: { text: string; attribution: string };
  /** Optional metric strip at the very bottom of the hero. */
  stats?: Array<{ label: string; value: string }>;
};

/**
 * Split layout shared by `(auth)` routes. Apricot gradient with two radial
 * glows on the left, plain bg on the right. Mirrors `.auth` from the
 * mockup. The heading + lede + quote + stats live on the left, the
 * interactive surface on the right.
 *
 * Why the gradient + radial glows: the auth flow is the first impression
 * and the reference comp leans into a warm marketing mood here that the
 * rest of the app does not have. Keeping that mood specific to (auth)
 * avoids the rest of the product reading as "marketing".
 */
export function AuthSplit({ children, heading, description, quote, stats }: Props) {
  return (
    <main className={cn('min-h-screen grid bg-bg', 'grid-cols-1 lg:grid-cols-[1.1fr_1fr]')}>
      <aside
        className={cn(
          'relative overflow-hidden',
          'flex flex-col justify-between gap-8',
          'p-12 lg:p-14',
          'bg-[linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)]',
        )}
      >
        {/* Two radial glows to add depth without a hard border on the seam. */}
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
          <div className="mt-16">{heading}</div>
          {description && (
            <p
              className="text-ink-2 mt-4"
              style={{ fontSize: '16px', lineHeight: 1.55, maxWidth: '38ch' }}
            >
              {description}
            </p>
          )}
        </div>

        {quote && (
          <div
            className={cn(
              'relative z-10',
              'rounded backdrop-blur-sm',
              'border border-white/60 bg-white/60',
              'p-5 text-sm text-ink-2 leading-relaxed',
            )}
            style={{ maxWidth: '38ch' }}
          >
            {quote.text}
            <div className="mt-2.5 font-mono text-[11px] text-ink-3 tracking-wide uppercase">
              — {quote.attribution}
            </div>
          </div>
        )}

        {stats && stats.length > 0 && (
          <div className="relative z-10 flex gap-6 font-mono text-[11px] text-ink-3 tracking-wide">
            {stats.map((s) => (
              <div key={s.label}>
                <b className="text-ink">{s.value}</b> {s.label}
              </div>
            ))}
          </div>
        )}
      </aside>

      <section className={cn('flex flex-col justify-center', 'p-12 lg:p-16', 'max-w-xl w-full')}>
        {children}
      </section>
    </main>
  );
}
