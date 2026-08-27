import type { PublishedItem } from '../types';

/**
 * Un ítem publicado: qué se preguntó, qué contestó la mayoría (badge con la etiqueta literal), la
 * distribución completa como barra segmentada, y los conteos crudos abajo con su "de N".
 *
 * Tres reglas del boceto que no son estética (ADR-0083):
 *   - El badge lleva la **etiqueta literal** elegida, nunca un número inventado: "Casi nunca · 80 %"
 *     y jamás "2,4 sobre 3".
 *   - El rojo pinta **solo** la opción negativa, y solo una por ítem. Si la moda no es la negativa,
 *     el badge va neutro aunque el rojo aparezca en la barra.
 *   - La distribución se muestra **completa**, con los ceros incluidos: que nadie haya elegido
 *     "siempre" es información, no una fila para omitir.
 */
export function ItemRow({ item, last }: { item: PublishedItem; last: boolean }) {
  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: last ? 0 : '1px solid var(--color-line-2)',
      }}
    >
      <div className="mb-[7px] flex items-baseline justify-between gap-2.5">
        <span className="text-[13.5px] text-ink">{item.text}</span>
        <span
          className="whitespace-nowrap rounded-[6px] px-[9px] py-[3px] text-[11.5px]"
          style={
            item.modeIsNegative
              ? { background: 'var(--color-alarm-soft)', color: 'var(--color-alarm-ink)' }
              : { background: 'var(--color-bg-elev)', color: 'var(--color-ink-2)' }
          }
        >
          {item.modeLabel} · {item.modePercent} %
        </span>
      </div>

      {/* Los tramos no negativos alternan dos grises para que dos opciones contiguas se distingan
          sin darle color a ninguna: el color acá significaría algo, y solo la negativa significa. */}
      <div className="flex h-2 gap-px overflow-hidden rounded-[4px]">
        {item.distribution.map((slice, index) => (
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

      <p className="mt-[5px] text-[10px] text-ink-4" style={{ fontFamily: 'var(--font-mono)' }}>
        {item.distribution.map((s) => `${s.label.toLowerCase()} ${s.percent}`).join(' · ')} · de{' '}
        {item.total}
      </p>
    </div>
  );
}
