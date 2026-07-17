import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Banda de CTA final de la landing pública (US-054-f). Port de la última
 * `<section>` de `Landing` (docs/design/reference/canvas-mocks/landing.jsx,
 * líneas 577-606): fondo oscuro (`bg-ink`), heading + CTA hacia `/sign-up`.
 */
export function LpCtaFinal() {
  return (
    <section className="bg-ink" style={{ padding: '48px 48px 40px' }}>
      <div
        className="flex flex-wrap items-center justify-between"
        style={{ maxWidth: 1280, margin: '0 auto', gap: 32 }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '-0.022em',
              color: 'var(--color-bg)',
            }}
          >
            Empezá a planificar el cuatrimestre que viene.
          </h2>
          <p className="text-ink-4" style={{ marginTop: 8, fontSize: 14, maxWidth: '56ch' }}>
            30 segundos para registrarte. 2 minutos para cargar historial. Después la app es tuya.
          </p>
        </div>
        <Link
          href="/sign-up"
          prefetch
          className={cn(
            'inline-flex items-center justify-center font-medium rounded-pill shadow-card transition-colors',
            'bg-accent text-white border border-accent hover:bg-accent-hover',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '12px 24px', fontSize: 14 }}
        >
          Crear cuenta con email institucional
        </Link>
      </div>
    </section>
  );
}
