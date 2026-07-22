type Props = {
  /** Eyebrow mono, ej. "Reseñas". */
  eyebrow: string;
  title: string;
  body: string;
  /** Demo embebido (`DemoReview` / `DemoGraph` / `DemoPlanner`). */
  demo: React.ReactNode;
};

/**
 * Tarjeta de feature reusable de la landing pública (US-054-f). Port de
 * `LpFeature` (docs/design/reference/canvas-mocks/landing.jsx). Usada 3 veces
 * en la sección "Tres herramientas, un mismo lugar" (`#features`).
 *
 * El eyebrow va sin numeración: las secciones de la landing ya se numeran
 * ("02 · funciones", "03 · cómo lo hacemos") y una segunda lista numerada
 * adentro se confunde con esa.
 */
export function LpFeature({ eyebrow, title, body, demo }: Props) {
  return (
    <div
      className="bg-bg-card border border-line flex flex-col"
      style={{ borderRadius: 14, padding: '22px 22px 18px', gap: 14 }}
    >
      <div
        className="font-mono uppercase text-accent-ink"
        style={{ fontSize: 10.5, letterSpacing: '0.08em' }}
      >
        {eyebrow}
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
