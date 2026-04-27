import { notFound } from 'next/navigation';
import { AuthSplit } from '@/components/layout/auth-split';
import {
  Button,
  Card,
  DiffDots,
  DisplayHeading,
  Eyebrow,
  Lede,
  Logo,
  Meter,
  Pill,
  Stat,
  VerifiedBadge,
} from '@/components/ui';

/**
 * Internal Storybook-lite for the design system primitives. Hidden behind
 * NEXT_PUBLIC_DESIGN_CHECK=1 so it never ships to a real environment.
 *
 * Use this to eyeball every primitive on its own and inside the AuthSplit
 * shell after every token tweak. Removed (or kept gated) in later PRs.
 */
export default function DesignCheckPage() {
  if (process.env.NEXT_PUBLIC_DESIGN_CHECK !== '1') notFound();

  return (
    <div className="min-h-screen p-12 space-y-16">
      <header className="space-y-4">
        <Eyebrow>Design system check</Eyebrow>
        <DisplayHeading>
          Primitivas <em>en uso</em>
        </DisplayHeading>
        <Lede>
          Render de cada primitiva de <code className="font-mono">@/components/ui</code> + el shell{' '}
          <code className="font-mono">AuthSplit</code>. Si algo se ve raro acá, se va a ver raro en
          producto.
        </Lede>
      </header>

      <Section title="Typography">
        <div className="space-y-4">
          <Logo size={28} />
          <DisplayHeading>
            Cinco decisiones <em>esta semana</em>
          </DisplayHeading>
          <DisplayHeading as="h2" size={26}>
            h-display tamaño chico
          </DisplayHeading>
          <h2 className="font-ui font-semibold text-[18px]">h2 (font-ui semibold 18)</h2>
          <Eyebrow>Eyebrow muted (default)</Eyebrow>
          <Eyebrow tone="accent">Eyebrow accent (success)</Eyebrow>
          <Eyebrow tone="danger">Eyebrow danger (error)</Eyebrow>
          <Lede>
            Lede max 60ch, color ink-3. Acompaña a una h-display y baja la temperatura visual sin
            perder presencia.
          </Lede>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent (CTA marketing)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" size="sm">
            Primary sm
          </Button>
          <Button variant="accent" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Pills">
        <div className="flex flex-wrap gap-3 items-center">
          <Pill>neutral</Pill>
          <Pill tone="warm">recomendado</Pill>
          <Pill tone="good">aprueba 78%</Pill>
          <Pill tone="danger">62% recursa</Pill>
          <VerifiedBadge />
          <VerifiedBadge kind="teacher" />
        </div>
      </Section>

      <Section title="Stats">
        <Card className="grid grid-cols-3 max-w-2xl">
          <Stat label="Avance" value="42" suffix="%" sub="14/33 materias" />
          <div className="border-l border-line">
            <Stat label="Aprobadas" value="11" sub="784h cursadas" />
          </div>
          <div className="border-l border-line">
            <Stat label="Recursando" value="1" sub="MAT201" />
          </div>
        </Card>
      </Section>

      <Section title="Meters & dots">
        <div className="grid gap-3 max-w-md">
          <Meter value={62} label="Aprobación esperada" sub="62%" />
          <Meter value={4.1} max={5} label="Carga real" sub="4.1/5" tone="warm" />
          <Meter value={88} label="Recursarán" sub="alta" tone="danger" />
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-ink-3 text-xs uppercase tracking-wide">dificultad</span>
            <DiffDots value={2} />
            <DiffDots value={3.4} />
            <DiffDots value={5} />
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          <Card className="p-5">
            <Eyebrow>default</Eyebrow>
            <p className="mt-2 text-sm text-ink-2">Sombra leve, borde fino.</p>
          </Card>
          <Card variant="elevated" className="p-5">
            <Eyebrow>elevated</Eyebrow>
            <p className="mt-2 text-sm text-ink-2">Hover crece la sombra.</p>
          </Card>
          <Card variant="subtle" className="p-5">
            <Eyebrow>subtle</Eyebrow>
            <p className="mt-2 text-sm text-ink-2">Sin sombra, solo borde.</p>
          </Card>
        </div>
      </Section>

      <Section title="AuthSplit">
        <div className="border border-line rounded overflow-hidden h-[600px]">
          <AuthSplit
            heading={
              <DisplayHeading size={48}>
                Antes de inscribirte,
                <br />
                mirá <em>quiénes ya pasaron</em>
                <br />
                por esa materia.
              </DisplayHeading>
            }
            description="plan-b es la app donde alumnos de UNSTA simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros."
            quote={{
              text: '"Iba a anotarme con el primero que tenía horario libre. Acá vi que había una comisión con 4.1★ vs 3.4★. Esperé un cuatri."',
              attribution: 'Anónimo · 4° año Sistemas',
            }}
            stats={[
              { value: '340', label: 'alumnos verificados' },
              { value: '1.2k', label: 'reseñas' },
              { value: '3', label: 'carreras' },
            ]}
          >
            <div className="space-y-4">
              <Eyebrow>Form column</Eyebrow>
              <p className="text-ink-2 text-sm">
                Acá viven los formularios y los estados de auth. En este check rendereamos un
                placeholder porque las pantallas reales se aterrizan en PRs siguientes.
              </p>
              <Button variant="accent">CTA principal</Button>
            </div>
          </AuthSplit>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[10.5px] tracking-widest uppercase text-ink-4">{title}</h2>
      {children}
    </section>
  );
}
