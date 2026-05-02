import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * 404 page. Next.js renders this whenever a route segment calls notFound()
 * or the URL doesn't match any route. Same centered single-card layout as
 * /auth/check-inbox so the design language stays consistent across
 * non-marketing transition surfaces.
 *
 * The "404" itself is the visual lead — display-sized in the accent color,
 * no extra icon. Keeps the page sober and saves the user from another
 * piece of decoration to parse.
 *
 * The "Volver al inicio" CTA points at /auth porque no hay landing pública
 * todavía. Cuando exista una ruta home pública (`/` o equivalente), este
 * link se actualiza.
 */
export default function NotFound() {
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
          404
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
          No encontramos eso
        </h1>

        <p
          className="text-ink-2"
          style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: '34ch' }}
        >
          El link que seguiste no lleva a ningún lado, o la página fue movida. Probá desde el
          inicio.
        </p>

        <Link
          href="/auth"
          prefetch
          className={cn(
            'inline-flex items-center justify-center w-full',
            'bg-ink text-white border border-ink rounded-pill shadow-card',
            'transition-colors hover:bg-[#1a110a]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 32 }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
