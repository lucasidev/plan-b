import Link from 'next/link';
import { ItemRow } from '@/components/facts';
import { CatalogTopbar } from '@/features/browse-catalog';
import type { ChairFacts } from '../types';

/**
 * La ficha de una cátedra (SC-002, US-147, ADR-0083): lo que el producto publica.
 *
 * De arriba abajo: identidad con su línea de sustento, la fama por convergencia, cómo termina la
 * cursada, qué hizo la cátedra, qué les pasó a los que cursaron, y el pie.
 *
 * Lo que esta pantalla no muestra nunca, y es la mitad del diseño: ningún puntaje ni promedio,
 * ninguna reseña individual, ningún desenlace de una persona, y ninguna comparación contra una
 * cátedra que no sea de la misma materia. Lo que no aparece es la regla funcionando, no un hueco.
 */
export function ChairFactsSheet({ facts }: { facts: ChairFacts }) {
  return (
    // El data-surface va en el contenedor de ancho completo y no en la columna: si lo lleva solo
    // la columna, el crema del Boletín pinta 560px y el resto de la página queda con el fondo del
    // chasis anterior, que es de otra paleta.
    <div data-surface="bulletin" className="min-h-screen w-full">
      {/* Con el topbar, porque una ficha sin él es una calle sin salida: se llega desde la
          búsqueda y no hay cómo seguir buscando ni volver. */}
      <CatalogTopbar />
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <Identity facts={facts} />

        {facts.isPublished ? (
          <>
            {facts.fame && <Fame facts={facts} />}
            {facts.completion && <Completion facts={facts} />}
            <Block
              label="Qué hizo la cátedra"
              items={facts.chairConduct}
              emptyNote="Todavía nadie contestó estas preguntas."
            />
            <Block
              label="Qué les pasó a los que cursaron"
              items={facts.studentExperience}
              emptyNote="Todavía nadie contestó estas preguntas."
            />
            {facts.contrasts.length > 0 && <Contrasts facts={facts} />}
          </>
        ) : (
          <BelowFloor facts={facts} />
        )}

        <Footer facts={facts} />
      </div>
    </div>
  );
}

/**
 * Identidad y sustento. La línea de abajo dice de cuándo son las voces: un conteo sin su ventana
 * temporal no distingue a la cátedra de hoy de la de hace cinco años.
 */
function Identity({ facts }: { facts: ChairFacts }) {
  return (
    <div className="mb-[18px]">
      <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">
        Cátedra {facts.chairName}
      </h1>
      <p className="mb-1 text-[13px] text-ink-2">
        <Link href={`/subjects/${facts.subjectId}`} className="underline underline-offset-2">
          {facts.subjectName}
        </Link>
        {facts.leadTeacherName ? ` · a cargo de ${facts.leadTeacherName}` : ''}
      </p>
      {facts.isPublished && facts.span && (
        <p className="text-[11px] text-ink-3" style={{ fontFamily: 'var(--font-mono)' }}>
          {facts.reviewCount} {facts.reviewCount === 1 ? 'voz' : 'voces'}
          {facts.span.fromYear === facts.span.toYear
            ? ` de ${facts.span.fromYear}`
            : ` repartidas de ${facts.span.fromYear} a ${facts.span.toYear}`}
        </p>
      )}
    </div>
  );
}

/**
 * El estado bajo el piso. La cátedra existe y se dice cuánto le falta: esconderla sería mentir
 * sobre lo que hay, y adelantar sus conteos delataría a las tres personas que ya reseñaron
 * (ADR-0082).
 */
function BelowFloor({ facts }: { facts: ChairFacts }) {
  const none = facts.reviewCount === 0;

  return (
    <div className="rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1.5 font-serif text-[19px] font-semibold leading-tight text-ink">
        {none
          ? 'Todavía nadie contó cómo es cursar acá.'
          : `Junta ${facts.reviewCount} ${facts.reviewCount === 1 ? 'reseña' : 'reseñas'}: con ${facts.reviewsMissingToPublish} más se publica.`}
      </p>
      <p className="text-[12.5px] leading-relaxed text-ink-3">
        {none
          ? 'Podés ser la primera persona en hacerlo.'
          : 'Hasta las 10 no se muestran los conteos, para que no se pueda deducir quién dijo qué.'}
      </p>
    </div>
  );
}

/**
 * La fama: lo primero que la ficha dice, porque varios ítems distintos apuntando al mismo lado
 * valen más que muchas marcas en uno solo. Se enuncia con su sustento a la vista: la afirmación
 * de arriba tiene que poder verificarse sin bajar al detalle.
 */
function Fame({ facts }: { facts: ChairFacts }) {
  const fame = facts.fame;
  if (!fame) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Los hechos que la marcan</p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        <p className="mb-1.5 font-serif text-[19px] font-semibold leading-tight text-ink">
          {fame.itemsAgreeing} respuestas distintas apuntan al mismo lado.
        </p>
        {/* La pregunta y la respuesta van como par, no fundidas en una oración: el boceto enuncia
            la fama como afirmación ("Acá no se aprende preguntando"), pero esa frase editorial no
            existe en ningún catálogo, y derivarla del texto de la pregunta produce castellano
            roto. Se muestra lo que se preguntó y lo que se contestó, que es verificable. */}
        <ul className="m-0 list-none space-y-1.5 p-0">
          {fame.items.map((item) => (
            <li key={item.code} className="text-[12.5px] leading-relaxed text-ink-3">
              {item.text} <span className="text-ink-2">{item.negativeLabel}</span>, el{' '}
              {item.percent} %.
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * La tasa de finalización, agregada y nada más. La pregunta que abre es para la universidad, no
 * para el que no terminó: por eso el dato se publica sin señalar a nadie (US-148).
 */
function Completion({ facts }: { facts: ChairFacts }) {
  const c = facts.completion;
  if (!c) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Cómo termina la cursada acá</p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        <p className="mb-2 font-serif text-[18px] font-medium text-ink">
          De cada 10 que la cursan, llegan {c.outOfTen}.
        </p>
        <div className="mb-2 flex gap-[3px]">
          <span
            className="h-2 rounded-[4px]"
            style={{ flex: c.outOfTen, background: 'var(--color-ink-3)' }}
          />
          {c.outOfTen < 10 && (
            <span
              className="h-2 rounded-[4px]"
              style={{ flex: 10 - c.outOfTen, background: 'var(--color-alarm-soft)' }}
            />
          )}
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          Aprobada o regular, sobre {c.total} cursadas contadas. Ninguna reseña muestra cómo terminó
          nadie: esto es el conteo.
        </p>
      </div>
    </section>
  );
}

function Block({
  label,
  items,
  emptyNote,
}: {
  label: string;
  items: ChairFacts['chairConduct'];
  emptyNote: string;
}) {
  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">{label}</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {items.length === 0 ? (
          <p className="py-2.5 text-[13px] text-ink-3">{emptyNote}</p>
        ) : (
          items.map((item, index) => (
            <ItemRow key={item.code} item={item} last={index === items.length - 1} />
          ))
        )}
      </div>
    </section>
  );
}

/**
 * Los contrastes contra las cátedras hermanas. Solo aparecen los que sobrevivieron la regla de los
 * intervalos separados: si una diferencia no está acá, es porque puede explicarse por el tamaño de
 * la muestra, y publicarla igual sería inventar una distinción.
 */
function Contrasts({ facts }: { facts: ChairFacts }) {
  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">
        Comparada con las otras cátedras de {facts.subjectName}
      </p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        <ul className="m-0 list-none space-y-2.5 p-0">
          {facts.contrasts.map((c) => (
            <li key={c.itemCode} className="text-[13px] leading-relaxed text-ink-2">
              <span className="text-ink">{c.itemText}</span>
              <br />
              {c.negativeLabel}: <b className="font-medium">{c.herePercent} %</b> acá,{' '}
              {c.siblingsPercent} % en las otras.
              <span
                className="ml-1 text-[10.5px] text-ink-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                de {c.hereTotal} y {c.siblingsTotal}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * El pie. El boceto lleva además "¿Cómo calculamos esto?" hacia Método y "Bajar los datos" hacia
 * el CSV: las dos pantallas son de otra épica (Llevarse los datos) y todavía no existen, así que
 * acá no van. Un link a una pantalla inexistente es peor que no ofrecerla.
 */
function Footer({ facts }: { facts: ChairFacts }) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <span className="text-[12px] text-ink-3">
        {facts.subjectCode} · {facts.subjectName}
      </span>
      <Link
        href="/reviews/new"
        className="whitespace-nowrap rounded-lg px-3.5 py-[9px] text-[13px] font-medium"
        style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
      >
        ¿La cursaste? Reseñala
      </Link>
    </div>
  );
}
