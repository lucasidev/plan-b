import Link from 'next/link';
import { DiffDots } from '@/components/ui';
import { homeCoursing } from '../data/mock-coursing';

/**
 * Sección "Cursando ahora" del home. Port del mockup `screens.jsx::HomeView`
 * (el `cursando.map` que renderiza una grid de 2 columnas con cards de
 * subject).
 *
 * Cada card es un Link a `/subjects/[code]` que, hoy, es un stub porque
 * la página de detalle de materia aterriza con US-002. El navegación queda
 * armada para que cuando aterrice no haya que tocar nada acá.
 */
export function CoursingNow() {
  return (
    <section style={{ marginTop: 32 }}>
      <h2
        className="text-ink-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 12,
          fontWeight: 500,
        }}
      >
        Cursando ahora
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {homeCoursing.map((s) => (
          <Link
            key={s.code}
            href={`/subjects/${s.code}`}
            prefetch
            className="bg-bg-card border border-line shadow-card flex justify-between items-center transition-colors hover:bg-bg-elev"
            style={{
              padding: 14,
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
            }}
          >
            <div>
              <div
                className="text-ink-3"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                }}
              >
                {s.code}
              </div>
              <div className="text-ink" style={{ fontWeight: 500, fontSize: 13.5 }}>
                {s.name}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
              }}
            >
              <DiffDots value={s.diff} />
              <span
                className="text-ink-3"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                }}
              >
                {s.reviews} reseñas
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
