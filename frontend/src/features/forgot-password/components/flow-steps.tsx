type Props = { active: 1 | 2 | 3 };

const STEPS = [
  { n: 1, title: 'Pedís el link', sub: 'Ingresás tu email institucional', mono: 'POST /reset' },
  {
    n: 2,
    title: 'Te llega el mail',
    sub: 'Click en el link dentro de los 30 min',
    mono: 'noreply@plan-b',
  },
  { n: 3, title: 'Cambiás la contraseña', sub: 'En una sola pantalla', mono: 'PATCH /password' },
] as const;

/**
 * Panel izquierdo del forgot-password (`AuthShell` leftPanel). Port de `FlowSteps`
 * (docs/design/reference/canvas-mocks/auth.jsx): diagrama de 3 pasos del flujo de
 * recuperación, con el paso `active` resaltado (1 = pedir el link, 2 = mail
 * enviado). Visual estático (US-059-f). Sin copy de universidad hardcodeado.
 */
export function FlowSteps({ active }: Props) {
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
          Tres pasos. Cinco minutos.
        </h3>
        <p className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          {active === 2
            ? 'Vas por el segundo. Revisá tu mail y volvé acá.'
            : 'Te mandamos un link al mail con el que te registraste.'}
        </p>
      </div>

      <div
        className="relative bg-bg-card border border-line"
        style={{ borderRadius: 14, padding: 22 }}
      >
        {STEPS.map((s, i) => {
          const state = s.n < active ? 'done' : s.n === active ? 'now' : 'next';
          const dotBg =
            state === 'done'
              ? 'var(--color-accent-ink)'
              : state === 'now'
                ? 'var(--color-accent)'
                : 'var(--color-line-2)';
          const dotFg =
            state === 'done'
              ? 'var(--color-bg-card)'
              : state === 'now'
                ? 'var(--color-accent-ink)'
                : 'var(--color-ink-3)';
          const titleColor = state === 'next' ? 'var(--color-ink-3)' : 'var(--color-ink)';
          const hasNext = i < STEPS.length - 1;
          return (
            <div
              key={s.n}
              className="relative grid"
              style={{ gridTemplateColumns: '34px 1fr', gap: 14, paddingBottom: hasNext ? 18 : 0 }}
            >
              {hasNext && (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    left: 16,
                    top: 32,
                    bottom: -4,
                    width: 2,
                    background: state === 'done' ? 'var(--color-accent-ink)' : 'var(--color-line)',
                  }}
                />
              )}
              <div
                className="relative grid place-items-center font-mono"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: dotBg,
                  color: dotFg,
                  fontSize: 13,
                  fontWeight: 600,
                  zIndex: 1,
                  outline: state === 'now' ? '4px solid var(--color-accent-soft)' : 'none',
                }}
              >
                {state === 'done' ? '✓' : s.n}
              </div>
              <div style={{ paddingTop: 5 }}>
                <div
                  className="flex items-baseline justify-between"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: titleColor,
                    lineHeight: 1.3,
                    marginBottom: 3,
                  }}
                >
                  <span>{s.title}</span>
                  {state === 'now' && (
                    <span
                      className="font-mono uppercase text-accent-ink"
                      style={{ fontSize: 9.5, letterSpacing: '0.1em' }}
                    >
                      ahora
                    </span>
                  )}
                </div>
                <div
                  className="text-ink-3"
                  style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: 5 }}
                >
                  {s.sub}
                </div>
                <div
                  className="font-mono text-ink-4"
                  style={{ fontSize: 10.5, letterSpacing: '0.04em' }}
                >
                  {s.mono}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="text-ink-3"
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-line)',
          borderRadius: 10,
          padding: '10px 14px',
        }}
      >
        <span className="text-ink-2">Nota:</span> si te registraste con Google, no tenés contraseña
        que recuperar, entrá con el botón de Google.
      </div>
    </div>
  );
}
