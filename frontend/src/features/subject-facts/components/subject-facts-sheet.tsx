import Link from 'next/link';
import { PageFrame, type PageFrameStat } from '@/components/layout/page-frame';
import type { Subject } from '@/features/browse-catalog';
import { formatRelativeDate } from '@/lib/format-date';
import { chairHeadlineSentence } from '../lib/chair-headlines';
import type { Shared, Spread, SubjectChair, SubjectFacts, TakenWith } from '../types';

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
  /** El año del plan vigente (US-129), para el eyebrow "del plan {año}". Ausente si ese pedido falla. */
  planYear?: number;
};

export function SubjectFactsSheet({ facts, planSubjects = [], planYear }: Props) {
  const subjectsOfYear = subjectsInSameYear(facts, planSubjects);
  const hasSiblings = subjectsOfYear.length > 1;

  return (
    <PageFrame
      head={<Head facts={facts} planYear={planYear} />}
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

function Head({ facts, planYear }: { facts: SubjectFacts; planYear?: number }) {
  const { totalReviews, chairsWithReviews } = reviewTotals(facts);
  // "Depende de cuál te toque" tiene sentido con dos o más cátedras que ya reseñaron, o con una
  // diferencia real ya publicada entre ellas (facts.spread): con una sola cátedra y sin spread no
  // hay con qué contrastar, y la línea termina en el rango de años.
  const hasComparison = chairsWithReviews >= 2 || facts.spread.length > 0;

  return (
    <>
      <div className="pb-eyebrow">
        Materia · {facts.yearInPlan}º año{planYearSuffix(planYear)} ·{' '}
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

/** " del plan {año}", o vacío si el pedido del plan falló: el eyebrow no promete un dato que no llegó. */
function planYearSuffix(planYear?: number): string {
  return planYear === undefined ? '' : ` del plan ${planYear}`;
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
      <SubjectOrChair facts={facts} />
      {facts.completion && (
        <CompletionCard
          outOfTen={facts.completion.outOfTen}
          reaching={facts.completion.reaching}
          total={facts.completion.total}
        />
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

/** De cada 10 que la cursan, cuántas llegan, con el conteo completo (US-154): cuántas de cuántas. */
function CompletionCard({
  outOfTen,
  reaching,
  total,
}: {
  outOfTen: number;
  reaching: number;
  total: number;
}) {
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
        Aprobada o regular, {reaching} de {total} cursadas reseñadas. Ninguna reseña muestra cómo
        terminó nadie: esto es el conteo.
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
 * La sección que da sentido a toda la pantalla: si algo que pasó es de la materia, o de la cátedra
 * que tocó. Con una sola cátedra publicando no hay con qué contrastar, y afirmar que algo "es de la
 * materia" sería una afirmación sin base: por eso no aparece hasta que el backend publica spread o
 * shared.
 */
function SubjectOrChair({ facts }: { facts: SubjectFacts }) {
  if (facts.spread.length === 0 && facts.shared.length === 0) return null;

  return (
    <section className="pb-section">
      <div className="pb-eyebrow">¿Es la materia o es una cátedra?</div>
      <div className="pb-card" style={{ padding: '4px 16px' }}>
        {facts.spread.map((item) => (
          <SpreadItem key={item.itemCode} item={item} />
        ))}
        {facts.shared.length > 0 && <SharedItem shared={facts.shared} />}
      </div>
    </section>
  );
}

/** Una frase donde las cátedras difieren: la moda negativa y cuánto la marca cada una. */
function SpreadItem({ item }: { item: Spread }) {
  return (
    <div className="pb-item">
      <div className="pb-q">
        <span className="pb-t">{item.itemText}</span>
        <span className="pb-mode pb-neg">
          Depende de la cátedra: «{item.negativeLabel.toLowerCase()}»
        </span>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {item.byChair.map((chair) => (
          <li key={chair.chairId} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ width: 88, flexShrink: 0, fontSize: 12.5, color: 'var(--color-ink-2)' }}>
              {chair.chairName}
            </span>
            <span className="pb-bar" style={{ flex: 1, margin: 0 }}>
              <span className="pb-neg" style={{ width: `${chair.percent}%` }} />
            </span>
            <span className="pb-meta" style={{ flexShrink: 0, textAlign: 'right' }}>
              {chair.percent} % de {chair.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Las frases que todas las cátedras marcan parejo: son de la materia, no de quien la dicta. */
function SharedItem({ shared }: { shared: Shared[] }) {
  return (
    <div className="pb-item">
      <div className="pb-eyebrow">Lo que sí es de la materia</div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        {shared.map((item) => (
          <li key={item.itemCode} style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
            {item.itemText} «{item.negativeLabel.toLowerCase()}» lo marcan entre el{' '}
            {item.lowestPercent} % y el {item.highestPercent} % en las {item.chairCount} cátedras.
          </li>
        ))}
      </ul>
    </div>
  );
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
