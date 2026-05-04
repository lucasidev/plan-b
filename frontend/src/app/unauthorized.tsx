import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * 401 page. Next.js (with experimental.authInterrupts) renders this when
 * a route segment calls `unauthorized()`. Use it when a request needs a
 * session and there isn't one — typically because it expired mid-action
 * and the layout guard's redirect would lose the user's place.
 *
 * Today the (member)/(staff)/(teacher) layouts redirect to /sign-in on a
 * missing session, so this surface mostly covers the in-flight case
 * (e.g. a server action firing on a stale cookie). The CTA goes a /sign-in
 * because that's where the user has to start over from.
 */
export default function Unauthorized() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)',
        padding: '48px 24px',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgb(224 122 77 / 18%) 0, transparent 40%), radial-gradient(circle at 20% 90%, rgb(224 122 77 / 12%) 0, transparent 35%)',
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center text-center bg-bg-card border border-line shadow-card"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '48px 40px',
          borderRadius: 18,
        }}
      >
        <p
          className="text-accent-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 96,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontWeight: 600,
            margin: 0,
          }}
        >
          401
        </p>

        <h1
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 600,
            margin: '20px 0 0',
          }}
        >
          Tu sesión expiró
        </h1>

        <p
          className="text-ink-2"
          style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: '34ch' }}
        >
          Tenés que iniciar sesión de nuevo para seguir. Tus cambios no se perdieron mientras no
          recargues la pestaña.
        </p>

        <Link
          href="/sign-in"
          prefetch
          className={cn(
            'inline-flex items-center justify-center w-full',
            'bg-accent text-white border border-accent rounded-pill shadow-card',
            'transition-colors hover:bg-accent-hover',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 32 }}
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
