import Link from 'next/link';
import { DemoCorpusNotice, ItemRow } from '@/components/facts';
import { PageFrame, type PageFrameStat } from '@/components/layout/page-frame';
import { formatRelativeDate } from '@/lib/format-date';
import type { ChairFacts } from '../types';

/**
 * La ficha de una cátedra (SC-002, US-147, ADR-0083), markup literal de la maqueta aprobada
 * (planb-catalogo-adentro.html, `V.chair`, `frameApp`).
 *
 * De arriba abajo: identidad con su línea de sustento, la fama por convergencia, cómo termina la
 * cursada, qué hizo la cátedra, qué les pasó a los que cursaron, la comparación contra las
 * hermanas, y el pie.
 *
 * Lo que esta pantalla no muestra nunca, y es la mitad del diseño: ningún puntaje ni promedio,
 * ninguna reseña individual, ningún desenlace de una persona, y ninguna comparación contra una
 * cátedra que no sea de la misma materia. Lo que no aparece es la regla funcionando, no un hueco.
 *
 * La maqueta también trae "Las hermanas · misma materia" como columna derecha (`V.chair().aside`):
 * se omite acá porque `ChairFacts` no trae esa lista (nombre y cantidad de reseñas de las otras
 * cátedras de la materia); haría falta sumarla a `GetChairFactsResponse`, que esta tarea no toca.
 */
type Props = {
  facts: ChairFacts;
  /**
   * A dónde manda "¿La cursaste? Reseñala" (US-229): sin sesión, directo al gate con el
   * motivo, en vez de a `/reviews/new` (que el guard de `(member)` redirigiría igual, pero sin
   * decir para qué). Lo decide la página (`reviewCtaHref`, que sabe si hay sesión); el default
   * acá es el camino directo, para no forzar a cada test a pasarlo.
   */
  reviewHref?: string;
};

export function ChairFactsSheet({ facts, reviewHref = '/reviews/new' }: Props) {
  return (
    <PageFrame
      head={<Head facts={facts} />}
      stats={chairStats(facts)}
      main={<Main facts={facts} reviewHref={reviewHref} />}
    />
  );
}

/** La tira `.pb-stats` de la cabecera (`V.chair().stats` en la maqueta): solo con la cátedra publicada. */
function chairStats(facts: ChairFacts): PageFrameStat[] {
  if (!facts.isPublished) return [];

  const stats: PageFrameStat[] = [];
  if (facts.completion) {
    stats.push([`${facts.completion.outOfTen} de 10`, 'llegan al final']);
  }
  stats.push([`${facts.reviewCount}`, 'reseñas']);
  stats.push([`${facts.fame ? facts.fame.itemsAgreeing : 0}`, 'frases convergen']);
  stats.push([`${facts.contrasts.length}`, 'contrastes con hermanas']);
  return stats;
}

/**
 * Identidad y sustento. La línea de abajo dice de cuándo son las voces: un conteo sin su ventana
 * temporal no distingue a la cátedra de hoy de la de hace cinco años.
 */
function Head({ facts }: { facts: ChairFacts }) {
  return (
    <>
      <div className="pb-eyebrow">
        Cátedra · {facts.subjectCode} ·{' '}
        <Link
          href={`/subjects/${facts.subjectId}`}
          // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
          prefetch={false}
        >
          {facts.subjectName}
        </Link>
        {facts.leadTeacherName &&
          (facts.leadTeacherId ? (
            <>
              {' · a cargo de '}
              <Link href={`/teachers/${facts.leadTeacherId}`} prefetch={false} className="pb-link">
                {facts.leadTeacherName}
              </Link>
            </>
          ) : (
            ` · a cargo de ${facts.leadTeacherName}`
          ))}
      </div>
      <h1 className="pb-serif">Cátedra {facts.chairName}</h1>
      {facts.isPublished && facts.span && (
        <p className="pb-h-meta pb-meta">
          {facts.reviewCount} {facts.reviewCount === 1 ? 'reseña' : 'reseñas'}
          {facts.span.fromYear === facts.span.toYear
            ? `, de ${facts.span.fromYear}`
            : `, de ${facts.span.fromYear} a ${facts.span.toYear}`}
          {facts.span.lastReviewedAt &&
            ` · lo último es de ${formatRelativeDate(facts.span.lastReviewedAt)}`}
        </p>
      )}
      {facts.hasDemoCorpusVoices && <DemoCorpusNotice />}
    </>
  );
}

function Main({ facts, reviewHref }: { facts: ChairFacts; reviewHref: string }) {
  return (
    <div className="min-w-0">
      {facts.isPublished ? (
        <>
          <Fame facts={facts} />
          {facts.completion && (
            <CompletionSection
              outOfTen={facts.completion.outOfTen}
              total={facts.completion.total}
            />
          )}
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
          <Contrasts facts={facts} />
        </>
      ) : (
        <BelowFloor facts={facts} />
      )}
      <Footer reviewHref={reviewHref} />
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
    <div className="pb-card" style={{ marginBottom: 20 }}>
      <p
        className="pb-serif"
        style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.25, marginBottom: 6 }}
      >
        {none
          ? 'Todavía nadie reseñó cómo es cursar acá.'
          : `Junta ${facts.reviewCount} ${facts.reviewCount === 1 ? 'reseña' : 'reseñas'}: con ${facts.reviewsMissingToPublish} más se publica.`}
      </p>
      <p className="pb-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {none
          ? 'Podés ser la primera persona en hacerlo.'
          : 'Hasta las 10 no se muestran los conteos, para que no se pueda deducir quién dijo qué.'}
      </p>
    </div>
  );
}

/**
 * La fama: lo primero que la ficha dice, porque varias frases distintas apuntando al mismo lado
 * valen más que muchas marcas en una sola. Se enuncia con su sustento a la vista: la afirmación
 * de arriba tiene que poder verificarse sin bajar al detalle.
 */
function Fame({ facts }: { facts: ChairFacts }) {
  const fame = facts.fame;
  if (!fame) return null;

  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Los hechos que la marcan</div>
      <div className="pb-card">
        <p
          className="pb-serif"
          style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.25, marginBottom: 8 }}
        >
          {fame.itemsAgreeing} respuestas distintas apuntan al mismo lado.
        </p>
        {/* La pregunta y la respuesta van como par, no fundidas en una oración: el boceto enuncia
            la fama como afirmación ("Acá no se aprende preguntando"), pero esa frase editorial no
            existe en ningún catálogo, y derivarla del texto de la pregunta produce castellano
            roto. Se muestra lo que se preguntó y lo que se contestó, que es verificable. */}
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {fame.items.map((item) => (
            <li key={item.code} style={{ fontSize: 12.5, color: 'var(--color-ink-3)' }}>
              {item.text} <span style={{ color: 'var(--color-ink-2)' }}>{item.negativeLabel}</span>,
              el {item.percent} % de {item.total}.
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
function CompletionSection({ outOfTen, total }: { outOfTen: number; total: number }) {
  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Cómo termina la cursada acá</div>
      <div className="pb-card">
        <p className="pb-serif" style={{ fontSize: 18, fontWeight: 500 }}>
          De cada 10 que la cursan, llegan {outOfTen}.
        </p>
        <div className="pb-fill">
          <span style={{ flex: outOfTen, background: 'var(--color-ink-3)' }} />
          <span style={{ flex: 10 - outOfTen, background: 'var(--color-alarm-soft)' }} />
        </div>
        <p className="pb-muted" style={{ fontSize: 12.5 }}>
          Aprobada o regular, sobre {total} cursadas reseñadas. Ninguna reseña muestra cómo terminó
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
    <section className="pb-section">
      <div className="pb-eyebrow">{label}</div>
      <div className="pb-card" style={{ padding: '4px 16px' }}>
        {items.length === 0 ? (
          <p style={{ padding: '10px 0', fontSize: 13, color: 'var(--color-ink-3)' }}>
            {emptyNote}
          </p>
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
 * la muestra, y publicarla igual sería inventar una distinción. Sin ninguna hermana que llegue al
 * piso, la sección se queda igual (la maqueta la muestra siempre) con el estado honesto de que
 * todavía no hay base para comparar.
 */
function Contrasts({ facts }: { facts: ChairFacts }) {
  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Comparada con las otras cátedras de la materia</div>
      {facts.contrasts.length > 0 ? (
        <div className="pb-card">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {facts.contrasts.map((c) => (
              <li key={c.itemCode} style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--color-ink)' }}>{c.itemText}</span>
                <br />
                {c.negativeLabel}: <b style={{ fontWeight: 500 }}>{c.herePercent} %</b> acá,{' '}
                {c.siblingsPercent} % en las otras.{' '}
                <span className="pb-meta" style={{ marginLeft: 4 }}>
                  de {c.hereTotal} y {c.siblingsTotal}
                </span>
              </li>
            ))}
          </ul>
          <p className="pb-meta" style={{ marginTop: 8 }}>
            Solo se publica lo que sobrevive a la regla de los intervalos; sin señal, silencio.
          </p>
        </div>
      ) : (
        <p className="pb-muted" style={{ fontSize: 12.5 }}>
          Sin base comparable todavía: ninguna hermana llega a las 10 reseñas.
        </p>
      )}
    </section>
  );
}

/**
 * El pie. Lleva a Método, que es lo que hace auditable todo lo de arriba: un conteo sin su regla
 * publicada es "confiá en mí". Falta "Bajar los datos" hacia el CSV, que es otra story de la misma
 * épica y todavía no existe; un link a una pantalla inexistente es peor que no ofrecerla.
 *
 * Se muestra tanto publicada como bajo el piso: bajo el piso es cuando más sentido tiene invitar
 * a sumar la reseña que falta.
 */
function Footer({ reviewHref }: { reviewHref: string }) {
  return (
    <div className="pb-foot">
      <Link
        href="/method"
        // Sin prefetch: /method es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
        prefetch={false}
        className="pb-link"
        style={{ fontSize: 12 }}
      >
        ¿Cómo calculamos esto?
      </Link>
      <Link href={reviewHref} className="pb-cta">
        ¿La cursaste? Reseñala
      </Link>
    </div>
  );
}
