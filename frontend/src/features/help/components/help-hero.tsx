/**
 * Header of the Help page (US-073). Eyebrow + h1 + lede. No image, no actions; the
 * main content (FAQ + sidebar with contact/resources) goes below.
 */

export function HelpHero() {
  return (
    <header style={{ maxWidth: 720, marginBottom: 28 }}>
      <div
        className="text-accent"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Ayuda
      </div>
      <h1
        className="text-ink-1"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        ¿Cómo te ayudamos?
      </h1>
      <p className="text-ink-3" style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 8 }}>
        Tutoriales rápidos, atajos y un canal directo si te trabaste.
      </p>
    </header>
  );
}
