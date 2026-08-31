/**
 * Cómo funciona, en tres pasos (US-221, bloque 1 de SC-004: "dicho también en tres pasos cortos").
 *
 * Va después de la muestra y no antes: primero se ve el dato y recién después se explica de dónde
 * salió. Al revés sería otra vez una promesa antes de la prueba, que es lo que la entrada anterior
 * hacía.
 *
 * El tercer paso es el único que pide cuenta, y lo dice ahí mismo. Es la asimetría del producto:
 * leer es de cualquiera, producir un hecho exige haber cursado.
 */
const STEPS = [
  {
    n: '1',
    title: 'Explorá o buscá',
    body: 'Por universidad, carrera o materia, hasta la cátedra que te toca. Sin cuenta.',
  },
  {
    n: '2',
    title: 'Leé la ficha',
    body: 'Qué contestó la mayoría con sus palabras, la distribución entera, cuántas voces la sostienen y de qué años son.',
  },
  {
    n: '3',
    title: 'Reseñá tu cursada',
    body: 'Un minuto y medio, marcando opciones. Acá sí hace falta cuenta, y nada sale con tu nombre.',
  },
] as const;

export function LandingSteps() {
  return (
    <section
      id="how"
      className="bg-bg-elev border-t border-b border-line"
      style={{ padding: '48px' }}
    >
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div
          className="font-mono uppercase text-accent-ink"
          style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 12 }}
        >
          03 · cómo funciona
        </div>
        <h2
          style={{ margin: '0 0 24px', fontSize: 30, fontWeight: 600, letterSpacing: '-0.022em' }}
        >
          Tres pasos, y el tercero es opcional.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 18 }}>
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="bg-bg-card border border-line"
              style={{ borderRadius: 14, padding: 20 }}
            >
              <div
                className="font-mono font-semibold bg-accent-soft text-accent-ink grid place-items-center"
                style={{ width: 28, height: 28, borderRadius: 8, fontSize: 12, marginBottom: 12 }}
              >
                {step.n}
              </div>
              <div className="text-ink" style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
                {step.title}
              </div>
              <div className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
