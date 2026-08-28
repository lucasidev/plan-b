import Link from 'next/link';
import { ItemRow } from '@/components/facts';
import type { ChairFacts } from '@/features/chair-facts';

/**
 * La muestra honesta de la entrada (US-221, bloque 3 de SC-004): una ficha **real** con sus voces,
 * no un ejemplo inventado para la ocasión.
 *
 * Existe porque explicar el instrumento no lo demuestra. Alguien que llega de un link no tiene por
 * qué creerle a otro sitio más: lo único que convence es ver un conteo de verdad, con cuántas
 * voces lo sostienen y de cuándo son.
 *
 * **Qué se muestra y qué no.** La cátedra sale sorteada entre las que ya publican, y la elige el
 * backend, no esta pantalla (US-171: nada destacado ni ordenado por conveniencia). De la ficha se
 * enseñan la finalización y los dos primeros ítems **en el orden de la ficha**, que es alfabético
 * por código de ítem: elegir "los peores" convertiría la muestra en una acusación y elegir "los
 * mejores" en una vidriera, y las dos cosas serían curar lo que el producto promete no curar. El
 * resto se ve entrando a la ficha, que es adonde esto lleva.
 */
export function LandingSample({ sample }: { sample: ChairFacts | null }) {
  return (
    <section
      id="sample"
      className="border-t border-line"
      style={{ padding: '56px 48px', maxWidth: 920, margin: '0 auto' }}
    >
      <div
        className="font-mono uppercase text-accent-ink"
        style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 12 }}
      >
        02 · una ficha de verdad
      </div>
      <h2 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 600, letterSpacing: '-0.022em' }}>
        Así se ve una cátedra acá.
      </h2>
      <p className="text-ink-2" style={{ margin: '0 0 24px', fontSize: 14.5, lineHeight: 1.6 }}>
        {sample === null
          ? 'Todavía ninguna cátedra juntó voces suficientes para publicar. Cuando junte, esta es la ficha que va a estar acá.'
          : 'No la elegimos nosotros: sale sorteada entre las que ya publican. No es la mejor ni la peor, es una.'}
      </p>

      {sample === null ? <NothingYet /> : <SampleSheet sample={sample} />}
    </section>
  );
}

function SampleSheet({ sample }: { sample: ChairFacts }) {
  // Los dos primeros del bloque, en el orden en que la ficha los publica.
  const items = sample.chairConduct.slice(0, 2);

  return (
    <div data-surface="bulletin" className="rounded-xl border-2 border-ink bg-bg-card p-5">
      <h3 className="mb-0.5 font-serif text-[21px] font-semibold leading-tight text-ink">
        Cátedra {sample.chairName}
      </h3>
      <p className="mb-0.5 text-[13px] text-ink-2">
        {sample.subjectCode} · {sample.subjectName}
      </p>
      <p className="mb-4 text-[11px] text-ink-3" style={{ fontFamily: 'var(--font-mono)' }}>
        {sample.reviewCount} {sample.reviewCount === 1 ? 'voz' : 'voces'}
        {sample.span && ` · de ${sample.span.fromYear} a ${sample.span.toYear}`}
      </p>

      {sample.completion && (
        <div className="mb-4 rounded-lg bg-bg-elev px-3.5 py-3">
          <p className="m-0 font-serif text-[17px] font-semibold text-ink">
            De cada 10 que la cursan, llegan {sample.completion.outOfTen}.
          </p>
          <p className="m-0 mt-1 text-[12px] leading-relaxed text-ink-3">
            Aprobada o regular, sobre {sample.completion.total} cursadas contadas. Ninguna reseña
            muestra cómo terminó nadie: esto es el conteo.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-4">
          {items.map((item, index) => (
            <ItemRow key={item.code} item={item} last={index === items.length - 1} />
          ))}
        </div>
      )}

      <Link
        href={`/chairs/${sample.chairId}`}
        className="text-[13px] text-ink underline underline-offset-2"
      >
        Ver la ficha entera →
      </Link>
    </div>
  );
}

/**
 * El estado real de un producto que recién empieza: todavía nadie cruzó el piso. Se dice, en vez de
 * mostrar una ficha de mentira, que es exactamente lo que la entrada existe para no hacer.
 */
function NothingYet() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-bg-card px-6 py-10 text-center">
      <p className="m-0 text-[13.5px] leading-relaxed text-ink-2">
        Una cátedra publica sus conteos recién cuando junta 10 reseñas. Antes de eso solo dice
        cuántas le faltan: con menos voces, un conteo diría más de quién se acordó de escribir que
        de cómo se cursa ahí.
      </p>
    </div>
  );
}
