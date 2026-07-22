import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DemoSim } from './demo-sim';

// Propuestas de valor del producto, no métricas de tracción (que no tenemos).
const HERO_VALUES = [
  { value: 'Verificado', label: 'por tu historial' },
  { value: 'Anónimo', label: 'hacia afuera' },
  { value: 'Independiente', label: 'del decanato' },
] as const;

/**
 * Hero de la landing pública (US-054-f). Port de la sección `<section>` de
 * `Landing` (docs/design/reference/canvas-mocks/landing.jsx, líneas 360-413):
 * copy + 2 CTAs + stats a la izquierda, `<DemoSim/>` a la derecha.
 *
 * Grid `1fr auto` colapsa a 1 columna (texto arriba, DemoSim abajo) debajo de
 * 1024px. El wrapper de `DemoSim` usa `maxWidth` en vez de `width` fijo para no
 * desbordar el viewport en pantallas angostas; a >=1024px se ve idéntico al mock.
 */
export function LandingHero() {
  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-end"
      style={{ padding: '56px 48px 24px', maxWidth: 1280, margin: '0 auto', gap: 40 }}
    >
      <div>
        <div
          className="font-mono uppercase text-accent-ink"
          style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 16 }}
        >
          Para alumnos universitarios
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            lineHeight: 1.02,
          }}
        >
          Antes de inscribirte,
          <br />
          mirá quiénes ya
          <br />
          <span className="text-accent-ink">pasaron por ahí.</span>
        </h1>
        <p
          className="text-ink-2"
          style={{ marginTop: 20, fontSize: 16, maxWidth: '52ch', lineHeight: 1.55 }}
        >
          plan-b es una herramienta para alumnos: simulá tu cuatrimestre, comparás comisiones y leés
          reseñas verificadas de quienes ya cursaron. Sin nombres, sin filtros del decanato.
        </p>
        <div className="flex" style={{ gap: 12, marginTop: 28 }}>
          <Link
            href="/sign-up"
            prefetch
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-pill shadow-card transition-colors',
              'bg-accent text-white border border-accent hover:bg-accent-hover',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
            )}
            style={{ padding: '10px 20px', fontSize: 13.5 }}
          >
            Crear cuenta gratis
          </Link>
          <a
            href="#features"
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-pill transition-colors',
              'bg-transparent text-ink-2 border border-transparent hover:bg-line-2 hover:text-ink',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
            )}
            style={{ padding: '10px 20px', fontSize: 13.5 }}
          >
            Ver cómo funciona →
          </a>
        </div>
        <div
          className="flex font-mono text-ink-3"
          style={{ gap: 32, marginTop: 36, fontSize: 11.5, letterSpacing: '0.04em' }}
        >
          {HERO_VALUES.map((item) => (
            <div key={item.label}>
              <b className="text-ink" style={{ fontSize: 14 }}>
                {item.value}
              </b>{' '}
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full" style={{ maxWidth: 560 }}>
        <DemoSim />
      </div>
    </section>
  );
}
