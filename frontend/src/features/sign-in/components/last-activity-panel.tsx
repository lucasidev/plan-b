import { cn } from '@/lib/utils';

/**
 * Panel izquierdo del sign-in (`AuthShell` leftPanel). Port de `LastActivityPanel`
 * (docs/design/reference/canvas-mocks/auth.jsx): stats + timeline de "última
 * actividad" como recordatorio concreto de por qué volvés.
 *
 * Visual estático con datos de muestra (US-059-f): no fetchea. Cuando aterrice un
 * endpoint de actividad de la cuenta, se conecta seedeando esta misma forma. Copy
 * multi-universidad: sin marca de universidad hardcodeada (el mock traía el email
 * @unsta, acá se omite: el usuario todavía no inició sesión).
 */
const STATS = [
  { value: '12', label: 'reseñas tuyas', accent: false },
  { value: '2', label: 'borradores', accent: false },
  { value: '3', label: 'sin leer', accent: true },
] as const;

const ACTIVITY = [
  { when: 'hace 4 días', body: 'Reseñaste ISW302 con Brandt', meta: '4 ★ · publicada' },
  {
    when: 'hace 1 semana',
    body: 'Guardaste un borrador en Simulador',
    meta: '2026·1c · 5 materias',
  },
  { when: 'hace 2 semanas', body: 'Un docente respondió tu reseña', meta: 'INT302 · sin leer' },
] as const;

export function LastActivityPanel() {
  return (
    <div className="flex flex-col" style={{ gap: 18, maxWidth: 420 }}>
      <div>
        <h3
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.018em',
            margin: '0 0 6px',
          }}
        >
          Te dejaste cosas a medio.
        </h3>
        <p className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          Un repaso de lo último que hiciste, para que no arranques en frío.
        </p>
      </div>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-bg-card border border-line"
            style={{ borderRadius: 10, padding: '12px 14px' }}
          >
            <div
              className={cn('font-mono', s.accent ? 'text-accent-ink' : 'text-ink')}
              style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              {s.value}
            </div>
            <div className="text-ink-3" style={{ fontSize: 10.5, marginTop: 5 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div
        className="bg-bg-card border border-line"
        style={{ borderRadius: 14, padding: '16px 18px' }}
      >
        <div
          className="font-mono uppercase text-ink-3"
          style={{ fontSize: 10.5, letterSpacing: '0.08em', marginBottom: 12 }}
        >
          Última actividad
        </div>
        <div className="flex flex-col">
          {ACTIVITY.map((it, i) => (
            <div
              key={it.body}
              className="grid items-start"
              style={{
                gridTemplateColumns: '74px 1fr',
                gap: 14,
                padding: '10px 0',
                borderTop: i ? '1px solid var(--color-line)' : 'none',
              }}
            >
              <div
                className="font-mono text-ink-3"
                style={{ fontSize: 10.5, letterSpacing: '0.04em', paddingTop: 1 }}
              >
                {it.when}
              </div>
              <div>
                <div className="text-ink" style={{ fontSize: 13, lineHeight: 1.4 }}>
                  {it.body}
                </div>
                <div
                  className="font-mono text-ink-3"
                  style={{ fontSize: 10.5, marginTop: 3, letterSpacing: '0.02em' }}
                >
                  {it.meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-ink-3" style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
        Última sesión: 28 abr · Chrome · Tucumán
      </div>
    </div>
  );
}
