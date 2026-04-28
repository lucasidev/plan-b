import { Wrench } from 'lucide-react';

/**
 * Maintenance page. Not a Next.js boundary — just a plain route at
 * /maintenance. Wired into ops by setting an env flag (or routing rule
 * at the reverse proxy) that redirects all traffic here during planned
 * downtime. See docs/decisions/0026 for the deploy workflow context.
 *
 * The visual lead is a wrench (not a status code) because there's no HTTP
 * code that captures "we're working on it" — 503 is technically right
 * but the user doesn't care.
 */
export default function MaintenancePage() {
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
        <div
          className="inline-flex items-center justify-center bg-accent-soft text-accent-ink"
          style={{ width: 64, height: 64, borderRadius: 999, marginBottom: 28 }}
          aria-hidden
        >
          <Wrench size={28} />
        </div>

        <p
          className="text-ink-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          En mantenimiento
        </p>

        <h1
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 600,
            margin: '8px 0 0',
          }}
        >
          Volvemos en un rato
        </h1>

        <p
          className="text-ink-2"
          style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: '34ch' }}
        >
          Estamos haciendo unos arreglos. Lo que escribiste se mantiene; cuando volvamos podés
          seguir donde dejaste.
        </p>
      </div>
    </main>
  );
}
