import type { PublishedItem } from './types';

/**
 * Una frase publicada: qué se preguntó, qué contestó la mayoría (badge con la etiqueta literal), la
 * distribución completa como barra segmentada, y los conteos crudos abajo con su "de N".
 *
 * Tres reglas del boceto que no son estética (ADR-0083):
 *   - El badge lleva la **etiqueta literal** elegida, nunca un número inventado: "Casi nunca · 80 %"
 *     y jamás "2,4 sobre 3".
 *   - El rojo pinta **solo** la opción negativa, y solo una por frase. Si la moda no es la negativa,
 *     el badge va neutro aunque el rojo aparezca en la barra.
 *   - La distribución se muestra **completa**, con los ceros incluidos: que nadie haya elegido
 *     "siempre" es información, no una fila para omitir.
 *
 * Y una cuarta, de US-198: si la pregunta cambió, debajo va el **tramo de antes**, con su propio
 * enunciado y su propio total, separado por una línea que dice que los dos no se comparan. Sin esa
 * línea, alguien leería los dos porcentajes uno al lado del otro como si midieran lo mismo.
 */
export function ItemRow({ item, last }: { item: PublishedItem; last: boolean }) {
  const previous = item.previousSeries;

  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: last ? 0 : '1px solid var(--color-line-2)',
      }}
    >
      <Stretch item={item} />

      {previous && (
        <>
          <div className="my-3.5 flex items-center gap-2.5">
            <span className="h-px flex-1 bg-line" />
            <span className="whitespace-nowrap text-[10.5px] text-ink-3">
              {previous.retiredAt
                ? `acá cambió la pregunta (${formatCut(previous.retiredAt)}), los tramos no se comparan`
                : 'acá cambió la pregunta, los tramos no se comparan'}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Atenuado, no escondido: sigue siendo dato de esta cátedra, pero es de otra pregunta. */}
          <div style={{ opacity: 0.72 }}>
            <Stretch item={previous} />
          </div>
        </>
      )}
    </div>
  );
}

/** Un tramo: su enunciado, su moda, su distribución y su total. */
function Stretch({ item }: { item: PublishedItem }) {
  // Total en cero solo llega en un caso: la pregunta se estrenó recién, al cortarse la serie, y
  // todavía no la contestó nadie. No hay moda que mostrar, y una barra vacía con un badge sin
  // etiqueta parecería un dato roto en vez de una pregunta nueva.
  if (item.total === 0) {
    return (
      <>
        <p className="mb-[3px] text-[13.5px] text-ink">{item.text}</p>
        <p className="text-[11.5px] text-ink-3">Todavía nadie respondió esta pregunta.</p>
      </>
    );
  }

  return (
    <>
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
    </>
  );
}

/**
 * Mes y año: el día exacto en que se cambió una redacción no le dice nada a quien lee la ficha.
 * En letra y no en número, porque "8/2026" suelto se lee como una fracción.
 */
function formatCut(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}
