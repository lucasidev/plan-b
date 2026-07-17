import { DemoGraph } from '@/features/landing/components/demo-graph';
import { DemoProf } from '@/features/landing/components/demo-prof';
import { DemoReview } from '@/features/landing/components/demo-review';
import { LandingHero } from '@/features/landing/components/landing-hero';
import { LpCtaFinal } from '@/features/landing/components/lp-cta-final';
import { LpFaq } from '@/features/landing/components/lp-faq';
import { LpFeature } from '@/features/landing/components/lp-feature';
import { LpFooter } from '@/features/landing/components/lp-footer';
import { LpTopbar } from '@/features/landing/components/lp-topbar';
import { getSession } from '@/lib/session';

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const DEMO_REVIEW = <DemoReview />;
const DEMO_GRAPH = <DemoGraph />;
const DEMO_PROF = <DemoProf />;

// Pasos de verificación de la sección "Cómo verificamos" (#data).
const VERIFICATION_STEPS = [
  {
    n: '1',
    title: 'Te registrás con email institucional',
    example: 'lucia.mansilla@tu-universidad.edu.ar',
  },
  { n: '2', title: 'Cargás tu historial académico', example: '8 materias aprobadas, 1 cursando' },
  {
    n: '3',
    title: 'Reseñás solo materias que cursaste',
    example: 'Visible como "Anónimo · 4° año"',
  },
] as const;

/**
 * `/` root. Landing pública de plan-b (US-054-f). Reemplaza el `redirect('/home')`
 * anterior: la landing es la URL canónica del proyecto y se renderea igual para
 * visitantes anónimos y usuarios logueados (SEO + reentrada sin perder sesión).
 * El único elemento que cambia con la sesión es el topbar (`<LpTopbar/>`), que
 * muestra "Ir a mi inicio →" en vez de los CTAs anónimos.
 *
 * Server component, sin fetch de datos propios: solo lee `getSession()` para
 * derivar `isLoggedIn`. El resto de la página es 100% estático, port fiel de
 * `Landing` (docs/design/reference/canvas-mocks/landing.jsx). Las secciones sin
 * componente dedicado (quote, `#features`, `#data`) se arman acá mismo, igual
 * que en el mock (son JSX inline en `Landing()`, no funciones separadas).
 */
export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = session !== null;

  return (
    <>
      <LpTopbar isLoggedIn={isLoggedIn} />

      <main>
        <LandingHero />

        {/* prueba social: quote anónima */}
        <section
          style={{
            padding: '48px 48px 40px',
            maxWidth: 920,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p
            className="text-ink"
            style={{
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            "Iba a anotarme en INT302 con el primero que tenía horario libre. Acá vi que había una
            comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."
          </p>
          <div
            className="font-mono text-ink-3"
            style={{ marginTop: 14, fontSize: 11, letterSpacing: '0.04em' }}
          >
            Anónimo · 4° año Sistemas
          </div>
        </section>

        {/* Tres herramientas, un mismo lugar */}
        <section
          id="features"
          style={{ padding: '24px 48px 56px', maxWidth: 1280, margin: '0 auto' }}
        >
          <div className="flex justify-between items-baseline" style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.022em' }}>
              Tres herramientas, un mismo lugar.
            </h2>
            <span
              className="font-mono uppercase text-ink-3"
              style={{ fontSize: 11, letterSpacing: '0.06em' }}
            >
              02 · funciones
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 18 }}>
            <LpFeature
              code="01 · Reseñas"
              title="Lo que tus compañeros nunca te dijeron en voz alta."
              body="Reseñas anónimas de materia y docente, con dificultad, exigencia y carga real. Verificamos que quien escribe haya cursado, no que se llame X."
              demo={DEMO_REVIEW}
            />
            <LpFeature
              code="02 · Plan"
              title="Tu carrera como mapa, no como Excel."
              body="Mirá qué tenés aprobado, qué te falta y qué se te abre con cada materia. El grafo te muestra correlativas reales, no solo nombres."
              demo={DEMO_GRAPH}
            />
            <LpFeature
              code="03 · Simulador"
              title="Probá cuatrimestres antes de inscribirte."
              body="Combiná materias, comisiones y horarios. Ves la carga semanal, choques y la dificultad agregada antes de clavarte 6 meses."
              demo={DEMO_PROF}
            />
          </div>
        </section>

        {/* Cómo verificamos */}
        <section
          id="data"
          className="bg-bg-elev border-t border-b border-line"
          style={{ padding: '48px' }}
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2 items-center"
            style={{ maxWidth: 1280, margin: '0 auto', gap: 48 }}
          >
            <div>
              <div
                className="font-mono uppercase text-accent-ink"
                style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 12 }}
              >
                03 · cómo lo hacemos
              </div>
              <h2 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.022em' }}>
                Anonimato hacia afuera,
                <br />
                verificación hacia adentro.
              </h2>
              <p
                className="text-ink-2"
                style={{
                  marginTop: 14,
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  maxWidth: '56ch',
                  marginBottom: 0,
                }}
              >
                Te registrás con tu mail .edu.ar. Confirmamos que sos alumno y nunca más mostramos
                tu nombre asociado a una reseña. Las reseñas se publican después de que cargues que
                cursaste esa materia, no antes.
              </p>
            </div>

            <div
              className="bg-bg-card border border-line flex flex-col"
              style={{ borderRadius: 14, padding: 24, gap: 14 }}
            >
              {VERIFICATION_STEPS.map((step) => (
                <div
                  key={step.n}
                  className="grid items-start"
                  style={{ gridTemplateColumns: '28px 1fr', gap: 14 }}
                >
                  <div
                    className="font-mono font-semibold bg-accent-soft text-accent-ink grid place-items-center"
                    style={{ width: 28, height: 28, borderRadius: 8, fontSize: 12 }}
                  >
                    {step.n}
                  </div>
                  <div>
                    <div className="text-ink" style={{ fontSize: 13.5, fontWeight: 500 }}>
                      {step.title}
                    </div>
                    <div
                      className="font-mono text-ink-3"
                      style={{ fontSize: 11, marginTop: 2, letterSpacing: '0.02em' }}
                    >
                      {step.example}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LpFaq />
      </main>

      <LpCtaFinal />
      <LpFooter />
    </>
  );
}
