import Link from 'next/link';
import { PageFrame, type PageFrameStat } from '@/components/layout/page-frame';
import type { Subject } from '@/features/browse-catalog';
import { formatRelativeDate } from '@/lib/format-date';
import { chairHeadlineSentence } from '../lib/chair-headlines';
import type { SubjectChair, SubjectFacts, TakenWith } from '../types';

/**
 * La ficha de una materia (SC-007, US-129, ADR-0085), markup literal de la maqueta aprobada
 * (planb-catalogo-adentro.html, `V.subject`, `frameApp`).
 *
 * La pregunta que esta pantalla contesta es **"¿es la materia, o es la cátedra que te tocó?"**.
 * Por eso el centro son sus cátedras, cada una por separado, no un promedio entre todas.
 *
 * Lo que no muestra nunca: ningún puntaje ni escala, ninguna cátedra remarcada como "la mejor",
 * ningún dato de una cátedra que todavía no llegó a las 10 reseñas, y ningún desenlace individual.
 */
type Props = {
  facts: SubjectFacts;
  /** Las materias del plan, sin filtrar: la ficha arma "Las otras materias de Nº año" a partir de esta lista. */
  planSubjects?: Subject[];
};

export function SubjectFactsSheet({ facts, planSubjects = [] }: Props) {
  const subjectsOfYear = subjectsInSameYear(facts, planSubjects);
  const hasSiblings = subjectsOfYear.length > 1;

  return (
    <PageFrame
      head={<Head facts={facts} />}
      stats={subjectStats(facts)}
      main={<Main facts={facts} />}
      aside={
        hasSiblings ? <OtherSubjectsOfYear facts={facts} subjects={subjectsOfYear} /> : undefined
      }
    />
  );
}

/** Reseñas y cátedras con al menos una, sobre TODAS sus cátedras: no solo las que publican. */
function reviewTotals(facts: SubjectFacts): { totalReviews: number; chairsWithReviews: number } {
  const totalReviews = facts.chairs.reduce((sum, chair) => sum + chair.reviewCount, 0);
  const chairsWithReviews = facts.chairs.filter((chair) => chair.reviewCount > 0).length;
  return { totalReviews, chairsWithReviews };
}

/** Las materias del mismo año del plan, la actual incluida: es la que la ficha resalta como "acá estás". */
function subjectsInSameYear(facts: SubjectFacts, planSubjects: Subject[]): Subject[] {
  return planSubjects
    .filter((subject) => subject.yearInPlan === facts.yearInPlan)
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** La tira `.pb-stats` de la cabecera (`V.subject().stats` en la maqueta). */
function subjectStats(facts: SubjectFacts): PageFrameStat[] {
  const { totalReviews, chairsWithReviews } = reviewTotals(facts);
  const stats: PageFrameStat[] = [
    [`${totalReviews}`, 'reseñas'],
    [`${chairsWithReviews}`, 'cátedras'],
  ];
  if (facts.completion) {
    stats.push([`${facts.completion.outOfTen} de 10`, 'llegan al final']);
  }
  stats.push([
    `${facts.enablesCount}`,
    `${facts.enablesCount === 1 ? 'materia' : 'materias'} habilita`,
  ]);
  return stats;
}

function Head({ facts }: { facts: SubjectFacts }) {
  const { totalReviews, chairsWithReviews } = reviewTotals(facts);
  // "Depende de cuál te toque" solo tiene sentido con dos o más cátedras que ya reseñaron: con
  // una sola no hay con qué contrastar, y la línea termina en el rango de años.
  const hasComparison = chairsWithReviews >= 2;

  return (
    <>
      <div className="pb-eyebrow">
        Materia · {facts.yearInPlan}º año ·{' '}
        <Link href={`/careers/${facts.careerId}`} prefetch={false}>
          {facts.careerName}
        </Link>
      </div>
      <h1 className="pb-serif">{facts.subjectName}</h1>
      <p className="pb-h-sub">
        {totalReviews === 0
          ? 'Todavía sin reseñas.'
          : `${totalReviews} ${totalReviews === 1 ? 'reseña' : 'reseñas'} en ${chairsWithReviews} ${chairsWithReviews === 1 ? 'cátedra' : 'cátedras'}${subjectSpanSuffix(facts)}.${hasComparison ? ' Depende de cuál te toque: acá está cada una por separado.' : ''}`}
      </p>
    </>
  );
}

function subjectSpanSuffix(facts: SubjectFacts): string {
  if (!facts.span) return '';
  return facts.span.fromYear === facts.span.toYear
    ? `, de ${facts.span.fromYear}`
    : `, de ${facts.span.fromYear} a ${facts.span.toYear}`;
}

function Main({ facts }: { facts: SubjectFacts }) {
  return (
    <div className="min-w-0">
      {!facts.isPublished && <Empty facts={facts} />}
      <ChairsSection facts={facts} />
      {facts.completion && (
        <CompletionCard outOfTen={facts.completion.outOfTen} total={facts.completion.total} />
      )}
      <TakenWithSection facts={facts} />
    </div>
  );
}

/**
 * La materia arranca vacía hasta que alguna de sus cátedras cruce el piso. No es un cero: es que
 * todavía no hay nada que mostrar, y se dice con esas palabras.
 */
function Empty({ facts }: { facts: SubjectFacts }) {
  return (
    <div className="pb-card" style={{ marginBottom: 20 }}>
      <p
        className="pb-serif"
        style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.25, marginBottom: 6 }}
      >
        Todavía no hay nada publicado de esta materia.
      </p>
      <p className="pb-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {facts.chairs.length === 0
          ? 'No tiene cátedras cargadas todavía.'
          : 'Una cátedra publica sus conteos recién a las 10 reseñas, para que no se pueda deducir quién dijo qué. Abajo está lo que junta cada una.'}
      </p>
    </div>
  );
}

/** De cada 10 que la cursan, cuántas llegan: la misma tarjeta que usa la ficha de cátedra. */
function CompletionCard({ outOfTen, total }: { outOfTen: number; total: number }) {
  return (
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
  );
}

/**
 * Sus cátedras: cada una con reseñas trae el nombre, la conclusión de su frase con la moda más
 * marcada (o que todavía no tiene una) y quién está a cargo. Las que todavía no tienen ni una
 * reseña se pliegan en una sola línea al final, para no repetir veinte veces "sin reseñas todavía".
 */
function ChairsSection({ facts }: { facts: SubjectFacts }) {
  if (facts.chairs.length === 0) return null;

  const withReviews = facts.chairs.filter((chair) => chair.reviewCount > 0);
  const withoutReviews = facts.chairs.filter((chair) => chair.reviewCount === 0);

  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Sus cátedras · cada una con lo suyo</div>
      <div className="pb-list">
        {withReviews.map((chair) => (
          <ChairRow key={chair.chairId} chair={chair} />
        ))}
        {withoutReviews.length > 0 && (
          <div className="pb-row pb-dim">
            <span>
              <span className="pb-name">
                {withoutReviews.length}{' '}
                {withoutReviews.length === 1 ? 'cátedra más' : 'cátedras más'}
              </span>
              <span className="pb-sub">sin reseñas todavía</span>
            </span>
            <span className="pb-right" />
          </div>
        )}
      </div>
    </section>
  );
}

function ChairRow({ chair }: { chair: SubjectChair }) {
  const footer = chairFooter(chair);

  return (
    <Link
      href={`/chairs/${chair.chairId}`}
      // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
      prefetch={false}
      className={chair.isPublished ? 'pb-row' : 'pb-row pb-dim'}
    >
      <span>
        <span className="pb-name">Cátedra {chair.chairName}</span>
        <span className="pb-sub" style={{ color: 'var(--color-ink-2)', fontSize: 13 }}>
          {chairConclusion(chair)}
        </span>
        {footer && <span className="pb-sub">{footer}</span>}
      </span>
      <span className="pb-right pb-muted" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

/** La frase de conclusión de una cátedra, o el estado honesto de que todavía no tiene una. */
function chairConclusion(chair: SubjectChair): string {
  const reviewsLabel = chair.reviewCount === 1 ? 'reseña' : 'reseñas';

  if (chair.headline) {
    const opening = chairHeadlineSentence(
      chair.headline.itemCode,
      chair.headline.optionValue,
      chair.chairName,
    );
    if (opening) {
      const respondentsLabel = chair.headline.respondents === 1 ? 'reseña' : 'reseñas';
      return `${opening}: lo dice el ${chair.headline.percent} % de sus ${chair.headline.respondents} ${respondentsLabel}.`;
    }
  }

  return `${chair.reviewCount} ${reviewsLabel}, todavía sin conclusiones.`;
}

/**
 * "a cargo de {docente} · última reseña {fecha}", con cualquiera de las dos partes ausente.
 *
 * La fecha solo se dice de una cátedra publicada: con una sola reseña, "última reseña hace 2
 * días" fija cuándo reseñó esa persona puntual, algo que el piso de 10 existe para no dejar pasar.
 */
function chairFooter(chair: SubjectChair): string {
  return [
    chair.leadTeacherName ? `a cargo de ${chair.leadTeacherName}` : null,
    chair.isPublished && chair.lastReviewedAt
      ? `última reseña ${formatRelativeDate(chair.lastReviewedAt)}`
      : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/**
 * Con qué otras materias se llevó esta (US-143). Es el dato que la lapicera no puede calcular:
 * armar el horario lo resuelve cualquiera en quince minutos, saber que 18 de 40 dejaron una de las
 * dos no lo resuelve nadie solo.
 *
 * Va fuera del gate de la materia porque tiene su propio piso, por par y período: un par puede no
 * publicar aunque la materia sí, y al revés. El que no llega se lista igual con cuánto le falta,
 * porque esconderlo mentiría sobre lo que hay.
 */
function TakenWithSection({ facts }: { facts: SubjectFacts }) {
  if (facts.takenWith.length === 0) return null;

  return (
    <section className="pb-section" style={{ marginTop: 22 }}>
      <div className="pb-eyebrow">Co-cursada · sale solo de las reseñas</div>
      <div className="pb-card">
        <div className="pb-kv">
          {facts.takenWith.map((pair) => (
            <TakenWithRow key={pair.subjectId} pair={pair} />
          ))}
        </div>
        <p className="pb-meta" style={{ marginTop: 8 }}>
          Sale de quienes reseñaron las dos en el mismo período. No dice que una cause la otra.
        </p>
      </div>
    </section>
  );
}

function TakenWithRow({ pair }: { pair: TakenWith }) {
  return (
    <div>
      <div className="pb-k">
        {pair.subjectCode} ·{' '}
        <Link
          href={`/subjects/${pair.subjectId}`}
          // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
          prefetch={false}
        >
          {pair.subjectName}
        </Link>
      </div>
      {pair.isPublished ? (
        <>
          <div className="pb-v">{pair.togetherCount} la llevaron junto con esta.</div>
          <div className="pb-src pb-meta">
            {pair.droppedCount === 0
              ? 'Ninguno dejó alguna de las dos.'
              : `${pair.droppedCount} dejaron alguna de las dos.`}
          </div>
        </>
      ) : (
        <div className="pb-v pb-small">
          {pair.togetherCount} la llevaron junto con esta: con {pair.missingToPublish} más se
          publica cómo les fue.
        </div>
      )}
    </div>
  );
}

/** Las otras materias del mismo año del plan, la actual resaltada como "acá estás". */
function OtherSubjectsOfYear({ facts, subjects }: { facts: SubjectFacts; subjects: Subject[] }) {
  return (
    <div className="pb-section min-w-0">
      <div className="pb-eyebrow">Las otras materias de {facts.yearInPlan}º año</div>
      <ul className="pb-list" style={{ gap: 2 }}>
        {subjects.map((subject) => {
          const isCurrent = subject.id === facts.subjectId;
          return (
            <li key={subject.id}>
              <Link
                href={`/subjects/${subject.id}`}
                // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
                prefetch={false}
                style={{ padding: '7px 10px' }}
                className={isCurrent ? 'pb-row' : 'pb-row pb-dim'}
              >
                <span className="pb-name" style={{ fontSize: 13 }}>
                  <span className="pb-meta" style={{ marginRight: 8 }}>
                    {subject.code}
                  </span>
                  {subject.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
