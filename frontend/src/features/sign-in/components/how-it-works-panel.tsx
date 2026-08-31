/**
 * Panel izquierdo del sign-in (`AuthShell` leftPanel). Le muestra el producto a quien llega a
 * ingresar, con las formas reales de la ficha: la moda con su etiqueta literal, la distribución
 * completa como barra segmentada y el rojo solo en la opción negativa (ADR-0083, mismas reglas
 * que `components/facts/item-row.tsx`).
 *
 * Datos de EJEMPLO, no del corpus: los códigos, materias y porcentajes son ilustrativos y no salen
 * del backend. Ver `docs/product/language.md` > "datos demo".
 */
export function HowItWorksPanel() {
  return (
    <div className="flex flex-col" style={{ gap: 20, maxWidth: 420 }}>
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
          Así funciona plan-b.
        </h3>
        <p className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          Leer no pide cuenta. La cuenta es para reseñar.
        </p>
      </div>

      <Step n="01" title="Leé lo que ya respondieron los que cursaron">
        <ItemDemo />
      </Step>
      <Step n="02" title="Reseñá una cursada que hiciste">
        <AnswerDemo />
      </Step>
      <Step n="03" title="Nada se publica con menos de diez voces">
        <FloorDemo />
      </Step>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '22px 1fr', gap: 12 }}>
      <div
        className="font-mono text-accent-ink"
        style={{ fontSize: 11.5, fontWeight: 600, paddingTop: 1 }}
      >
        {n}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="text-ink" style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Los tramos de la distribución del ítem demo. El primero es el negativo y es el único con color. */
const SLICES = [
  { label: 'Casi nunca', percent: 59, isNegative: true },
  { label: 'A veces', percent: 24, isNegative: false },
  { label: 'Casi siempre', percent: 17, isNegative: false },
] as const;

/**
 * Un ítem publicado, con la anatomía de `ItemRow`: pregunta, moda como badge con su etiqueta
 * literal, distribución completa y los conteos crudos con su "de N". Ningún puntaje.
 */
function ItemDemo() {
  return (
    <div
      className="bg-bg-card border border-line"
      style={{ borderRadius: 10, padding: '12px 14px' }}
    >
      <div className="mb-[7px] flex items-baseline justify-between" style={{ gap: 10 }}>
        <span className="text-ink" style={{ fontSize: 12.5 }}>
          ¿Se dieron todas las clases?
        </span>
        <span
          className="whitespace-nowrap"
          style={{
            fontSize: 11,
            borderRadius: 6,
            padding: '3px 8px',
            background: 'var(--color-alarm-soft)',
            color: 'var(--color-alarm-ink)',
          }}
        >
          Casi nunca · 59 %
        </span>
      </div>

      <div className="flex overflow-hidden" style={{ height: 8, gap: 1, borderRadius: 4 }}>
        {SLICES.map((slice, index) => (
          <span
            key={slice.label}
            style={{
              width: `${slice.percent}%`,
              background: slice.isNegative
                ? 'var(--color-alarm)'
                : index % 2 === 0
                  ? 'var(--color-line)'
                  : 'var(--color-ink-4)',
            }}
          />
        ))}
      </div>

      <p className="font-mono text-ink-4" style={{ fontSize: 10, margin: '5px 0 0' }}>
        {SLICES.map((s) => `${s.label.toLowerCase()} ${s.percent}`).join(' · ')} · de 34
      </p>
    </div>
  );
}

const OPTIONS = ['Nunca', 'Alguna vez', 'Varias veces', 'Casi todas'] as const;

/**
 * El acto de reseñar: se marca una opción, no se escribe. La marcada va con el fondo de tinta
 * porque es la elección, no porque sea buena ni mala: mientras se responde ninguna opción se
 * pinta de alarma.
 */
function AnswerDemo() {
  return (
    <div
      className="bg-bg-card border border-line"
      style={{ borderRadius: 10, padding: '12px 14px' }}
    >
      <div className="font-mono uppercase text-ink-3" style={{ fontSize: 9.5, marginBottom: 3 }}>
        ISW302 · 2025-C2
      </div>
      <div className="text-ink" style={{ fontSize: 12.5, marginBottom: 9 }}>
        ¿Se cayeron clases sin reprogramar?
      </div>
      <div className="flex flex-wrap" style={{ gap: 5 }}>
        {OPTIONS.map((option) => (
          <span
            key={option}
            className={option === 'Varias veces' ? 'bg-ink text-bg-card' : 'bg-bg-elev text-ink-2'}
            style={{ fontSize: 11, borderRadius: 6, padding: '4px 9px' }}
          >
            {option}
          </span>
        ))}
      </div>
      <p className="text-ink-3" style={{ fontSize: 11, lineHeight: 1.5, margin: '9px 0 0' }}>
        Catorce preguntas así. Un minuto y medio, y saltear cualquiera vale.
      </p>
    </div>
  );
}

/**
 * El piso, con las palabras de la ficha real (`BelowFloor`). Es la garantía que hace que reseñar
 * no exponga a nadie, y por eso cierra el panel: es lo último que alguien necesita saber antes de
 * decidir si crea la cuenta.
 */
function FloorDemo() {
  return (
    <div
      className="bg-bg-card border border-line"
      style={{ borderRadius: 10, padding: '12px 14px' }}
    >
      <p
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.25,
          margin: '0 0 5px',
        }}
      >
        Junta 3 reseñas: con 7 más se publica.
      </p>
      <p className="text-ink-3" style={{ fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>
        Hasta las 10 no se muestran los conteos, para que no se pueda deducir quién dijo qué. Tu
        nombre no aparece nunca, y ninguna reseña se muestra sola.
      </p>
    </div>
  );
}
