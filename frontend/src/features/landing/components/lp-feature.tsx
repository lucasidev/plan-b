type Props = {
  /** Eyebrow mono, ej. "01 · Reseñas". */
  code: string;
  title: string;
  body: string;
  /** Demo embebido (`DemoReview` / `DemoGraph` / `DemoProf`). */
  demo: React.ReactNode;
};

/**
 * Tarjeta de feature reusable de la landing pública (US-054-f). Port de
 * `LpFeature` (docs/design/reference/canvas-mocks/landing.jsx, líneas 170-194).
 * Usada 3 veces en la sección "Tres herramientas, un mismo lugar" (`#features`).
 */
export function LpFeature({ code, title, body, demo }: Props) {
  return (
    <div
      className="bg-bg-card border border-line flex flex-col"
      style={{ borderRadius: 14, padding: '22px 22px 18px', gap: 14 }}
    >
      <div
        className="font-mono uppercase text-accent-ink"
        style={{ fontSize: 10.5, letterSpacing: '0.08em' }}
      >
        {code}
      </div>
      <div>
        <div
          className="text-ink"
          style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.012em', marginBottom: 6 }}
        >
          {title}
        </div>
        <div className="text-ink-2" style={{ fontSize: 13, lineHeight: 1.55 }}>
          {body}
        </div>
      </div>
      {demo}
    </div>
  );
}
