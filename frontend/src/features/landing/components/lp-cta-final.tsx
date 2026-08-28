import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * La banda final de la entrada. Cierra con la única acción que pide cuenta: contar una cursada.
 *
 * Antes cerraba con "empezá a planificar el cuatrimestre que viene", que era el producto retirado
 * (ADR-0063). Y sigue sin ser un muro: quien no quiere cuenta ya leyó todo lo de arriba, que es la
 * mayor parte del producto (US-168).
 */
export function LpCtaFinal() {
  return (
    <section className="bg-ink" style={{ padding: '48px 48px 40px' }}>
      <div
        className="flex flex-wrap items-center justify-between"
        style={{ maxWidth: 920, margin: '0 auto', gap: 32 }}
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
            ¿Cursaste alguna? Contala.
          </h2>
          <p className="text-ink-4" style={{ marginTop: 8, fontSize: 14, maxWidth: '56ch' }}>
            Un minuto y medio, marcando opciones. Lo tuyo se suma a los conteos de tu cátedra y no
            se publica solo: nadie ve una reseña sola, ni con tu nombre ni sin él.
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
          Crear cuenta
        </Link>
      </div>
    </section>
  );
}
