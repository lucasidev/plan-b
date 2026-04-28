'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Global error boundary. Next.js renders this when an error happens inside
 * the root layout itself (so the regular `error.tsx` boundary can't render
 * because the layout is broken). Must include `<html>` and `<body>` because
 * it replaces the root entirely.
 *
 * Uses inline styles only — no Tailwind classes, no design tokens — because
 * those depend on the root layout/CSS that just failed. Visual lead is the
 * "500" in accent ink, matching the tone of error.tsx and not-found.tsx
 * for consistency. If something fundamental is wrong, this surface still
 * has to render.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#fbf3ec',
          color: '#2a1d12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '40px 32px',
            borderRadius: 18,
            background: '#ffffff',
            border: '1px solid #f0e2d2',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 96,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              fontWeight: 600,
              color: '#b04a1c',
              margin: 0,
            }}
          >
            500
          </p>
          <h1
            style={{
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontWeight: 600,
              margin: '20px 0 0',
            }}
          >
            La aplicación no pudo arrancar
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: '#5c4631', margin: '14px 0 28px' }}>
            Algo se rompió antes de que pudiéramos mostrarte la pantalla. Probá recargar.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                color: '#9c7e62',
                marginBottom: 24,
                wordBreak: 'break-all',
              }}
            >
              Ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              display: 'inline-block',
              padding: '12px 18px',
              fontSize: 13.5,
              fontWeight: 500,
              color: '#fff',
              background: '#e07a4d',
              border: '1px solid #e07a4d',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
