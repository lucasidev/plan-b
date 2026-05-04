'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Runtime error boundary for the app. Next.js renders this when a route
 * segment throws during rendering or when a server component errors. The
 * `reset` prop re-renders the segment without a full page reload — useful
 * for transient failures.
 *
 * The "500" itself is the visual lead — display-sized in the accent color,
 * matching the tone set by not-found.tsx so the error surfaces share a
 * design language. We don't actually know the HTTP status of the
 * underlying error here, but 500 is the right semantic for "something
 * blew up while rendering".
 *
 * `error.digest` (when present) is a hash of the server-side error that
 * the user can quote when reporting; we don't show the raw message
 * because it may contain stack traces or PII.
 */
export default function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    // Log to the browser console so devs see the actual error during dev;
    // wire to an external collector when one exists.
    console.error(error);
  }, [error]);

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
          500
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
          Tuvimos un problema
        </h1>

        <p
          className="text-ink-2"
          style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: '34ch' }}
        >
          Algo falló de nuestro lado al cargar esta pantalla. Probá de nuevo en un rato; si sigue
          pasando, contactanos.
        </p>

        {error.digest && (
          <p
            className="text-ink-3"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              marginTop: 14,
              wordBreak: 'break-all',
            }}
          >
            Ref: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className={cn(
            'inline-flex items-center justify-center w-full',
            'bg-accent text-white border border-accent rounded-pill shadow-card',
            'transition-colors hover:bg-accent-hover',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 32 }}
        >
          Reintentar
        </button>

        <Link
          href="/sign-in"
          prefetch
          className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
          style={{ fontSize: 13, fontWeight: 500, marginTop: 18 }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
