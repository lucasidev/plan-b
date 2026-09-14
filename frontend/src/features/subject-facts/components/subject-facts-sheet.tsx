import Link from 'next/link';
import { Eyebrow } from '@/components/ui';
import type { Subject } from '@/features/browse-catalog';
import { formatRelativeDate } from '@/lib/format-date';
import { chairHeadlineSentence } from '../lib/chair-headlines';
import type { Shared, Spread, SubjectChair, SubjectFacts, TakenWith } from '../types';

/**
 * La ficha de una materia (SC-007, US-129, ADR-0085).
 *
 * La pregunta que esta pantalla contesta y la de cátedra no es **"¿es la materia, o es la cátedra
 * que te tocó?"**. Por eso el centro no son los conteos (esos viven en cada cátedra) sino las dos
 * mitades de esa respuesta: lo que varía entre cátedras y lo que ninguna se salva de tener.
 *
 * Lo que no muestra nunca: ningún puntaje ni escala, ninguna cátedra remarcada como "la mejor",
 * ningún dato de una cátedra que todavía no llegó a las 10 reseñas, y ningún desenlace individual.
 */
type Props = {
  facts: SubjectFacts;
  /** Las materias del plan, sin filtrar: la ficha arma "Las otras materias de Nº año" a partir de esta lista. */
  planSubjects?: Subject[];
  /**
   * A dónde manda "¿La cursaste? Reseñala" (US-229): sin sesión, directo al gate con el
   * motivo, en vez de a `/reviews/new` (que el guard de `(member)` redirigiría igual, pero sin
   * decir para qué). Lo decide la página (`reviewCtaHref`, que sabe si hay sesión); el default
   * acá es el camino directo, para no forzar a cada test a pasarlo.
   */
  reviewHref?: string;
};

export function SubjectFactsSheet({
  facts,
  planSubjects = [],
  reviewHref = '/reviews/new',
}: Props) {
  const otherSubjects = otherSubjectsOfYear(facts, planSubjects);
  const hasOtherSubjects = otherSubjects.length > 0;

  return (
    <div className="w-full">
      <div
        className={
          hasOtherSubjects
            ? 'mx-auto w-full max-w-[560px] px-4 py-8 lg:max-w-[960px]'
            : 'mx-auto w-full max-w-[560px] px-4 py-8'
        }
      >
        <Identity facts={facts} />

        {hasOtherSubjects ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-[1fr_300px]">
            <MainColumn facts={facts} />
            <OtherSubjectsOfYear facts={facts} subjects={otherSubjects} />
          </div>
        ) : (
          <MainColumn facts={facts} />
        )}

        <Footer reviewHref={reviewHref} />
      </div>
    </div>
  );
}

/** Todo lo que hoy vive en la columna principal, sea que haya o no una columna al lado. */
function MainColumn({ facts }: { facts: SubjectFacts }) {
  return (
    <div className="min-w-0">
      {facts.isPublished ? (
        <>
          <Numbers facts={facts} />
          <SubjectOrChair facts={facts} />
        </>
      ) : (
        <Empty facts={facts} />
      )}
      <TakenWithBlock facts={facts} />
      <Chairs facts={facts} />
    </div>
  );
}

/** Reseñas y cátedras con al menos una, sobre TODAS sus cátedras: no solo las que publican. */
function reviewTotals(facts: SubjectFacts): { totalReviews: number; chairsWithReviews: number } {
  const totalReviews = facts.chairs.reduce((sum, chair) => sum + chair.reviewCount, 0);
  const chairsWithReviews = facts.chairs.filter((chair) => chair.reviewCount > 0).length;
  return { totalReviews, chairsWithReviews };
}

/** Las materias del mismo año del plan, sin la que ya se está mostrando. */
function otherSubjectsOfYear(facts: SubjectFacts, planSubjects: Subject[]): Subject[] {
  return planSubjects
    .filter((subject) => subject.yearInPlan === facts.yearInPlan && subject.id !== facts.subjectId)
    .sort((a, b) => a.code.localeCompare(b.code));
}

function Identity({ facts }: { facts: SubjectFacts }) {
  const { totalReviews, chairsWithReviews } = reviewTotals(facts);
  // "Depende de cuál te toque" solo tiene sentido si hay con qué comparar: dos o más cátedras con
  // reseñas, o una diferencia real ya publicada (facts.spread). Con una sola, la línea termina en
  // el rango de años y no promete un contraste que la ficha no tiene.
  const hasComparison = chairsWithReviews >= 2 || facts.spread.length > 0;

  return (
    <div className="mb-[18px]">
      <Eyebrow className="mb-1">
        Materia
        {' · '}
        <Link
          href={`/careers/${facts.careerId}`}
          prefetch={false}
          className="underline underline-offset-2 hover:text-ink"
        >
          {facts.careerName}
        </Link>
        {' · '}
        {facts.universityName}
      </Eyebrow>
      <h1 className="mb-1 font-serif text-[24px] font-semibold text-ink">
        {facts.subjectCode} · {facts.subjectName}
      </h1>
      <p className="text-[12.5px] leading-relaxed text-ink-3">
        {totalReviews === 0
          ? 'Todavía sin reseñas.'
          : `${totalReviews} ${totalReviews === 1 ? 'reseña' : 'reseñas'} en ${chairsWithReviews} ${chairsWithReviews === 1 ? 'cátedra' : 'cátedras'}${subjectSpanSuffix(facts)}.${hasComparison ? ' Depende de cuál te toque.' : ''}`}
      </p>
    </div>
  );
}

function subjectSpanSuffix(facts: SubjectFacts): string {
  if (!facts.span) return '';
  return facts.span.fromYear === facts.span.toYear
    ? `, de ${facts.span.fromYear}`
    : `, de ${facts.span.fromYear} a ${facts.span.toYear}`;
}

/**
 * La materia arranca vacía hasta que alguna de sus cátedras cruce el piso. No es un cero: es que
 * todavía no hay nada que mostrar, y se dice con esas palabras.
 */
function Empty({ facts }: { facts: SubjectFacts }) {
  return (
    <div className="mb-5 rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1.5 font-serif text-[19px] font-semibold leading-tight text-ink">
        Todavía no hay nada publicado de esta materia.
      </p>
      <p className="text-[12.5px] leading-relaxed text-ink-3">
        {facts.chairs.length === 0
          ? 'No tiene cátedras cargadas todavía.'
          : 'Una cátedra publica sus conteos recién a las 10 reseñas, para que no se pueda deducir quién dijo qué. Abajo está lo que junta cada una.'}
      </p>
    </div>
  );
}

/**
 * Los números que resumen la materia: cuánto se reseñó, en cuántas cátedras, cuánto llega al
 * final y cuánto habilita. Cada uno dice de dónde sale: reseñas y cátedras, de todas las que tiene
 * la materia; la finalización, de lo que contaron los que cursaron; lo que habilita, del plan.
 */
function Numbers({ facts }: { facts: SubjectFacts }) {
  const { totalReviews, chairsWithReviews } = reviewTotals(facts);

  return (
    <section className="mb-5">
      <div className="grid grid-cols-2 gap-2.5">
        <Cell label="Reseñas" value={`${totalReviews}`} note="en todas sus cátedras" />
        <Cell label="Cátedras" value={`${chairsWithReviews}`} note="con al menos una reseña" />
        {facts.completion && (
          <Cell
            label="Llegan a aprobada o regular"
            value={`${facts.completion.outOfTen} de 10`}
            note={`sobre ${facts.completion.total} cursadas reseñadas`}
          />
        )}
        <Cell
          label="Habilita"
          value={`${facts.enablesCount} ${facts.enablesCount === 1 ? 'materia' : 'materias'}`}
          note="según el plan de la carrera"
        />
      </div>
    </section>
  );
}

function Cell({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1 text-[12px] text-ink-3">{label}</p>
      <p className="mb-1 font-serif text-[20px] font-medium text-ink">{value}</p>
      <p className="text-[11px] leading-snug text-ink-3">{note}</p>
    </div>
  );
}

/**
 * La sección que da sentido a toda la pantalla. Con una sola cátedra publicando no aparece: sin
 * dos, no hay con qué contrastar, y decir que algo "es de la materia" sería una afirmación sin base.
 */
function SubjectOrChair({ facts }: { facts: SubjectFacts }) {
  if (facts.spread.length === 0 && facts.shared.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">¿Es la materia o es una cátedra?</p>

      {facts.spread.map((item) => (
        <SpreadCard key={item.itemCode} item={item} />
      ))}

      {facts.shared.length > 0 && <SharedCard shared={facts.shared} />}
    </section>
  );
}

function SpreadCard({ item }: { item: Spread }) {
  return (
    <div className="mb-2.5 rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1 text-[13.5px] text-ink">{item.itemText}</p>
      <p className="mb-2.5 text-[12px] text-ink-3">
        Depende de la cátedra: «{item.negativeLabel.toLowerCase()}»
      </p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {item.byChair.map((chair) => (
          <li key={chair.chairId} className="flex items-baseline gap-2">
            <span className="w-[88px] shrink-0 truncate text-[12.5px] text-ink-2">
              {chair.chairName}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-[4px] bg-bg-elev">
              <span
                className="block h-full rounded-[4px]"
                style={{
                  width: `${chair.percent}%`,
                  background: 'var(--color-alarm)',
                }}
              />
            </span>
            <span
              className="w-[70px] shrink-0 whitespace-nowrap text-right text-[11px] text-ink-3"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {chair.percent}% de {chair.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SharedCard({ shared }: { shared: Shared[] }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1.5 text-[12px] text-ink-3">Lo que sí es de la materia</p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {shared.map((item) => (
          <li key={item.itemCode} className="text-[13px] leading-relaxed text-ink-2">
            <span className="text-ink">{item.itemText}</span> «{item.negativeLabel.toLowerCase()}»
            lo marcan entre el {item.lowestPercent} % y el {item.highestPercent} % en las{' '}
            {item.chairCount} cátedras.
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
function TakenWithBlock({ facts }: { facts: SubjectFacts }) {
  if (facts.takenWith.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Con qué se llevó</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {facts.takenWith.map((pair, index) => (
          <TakenWithRow
            key={`${pair.subjectId}`}
            pair={pair}
            last={index === facts.takenWith.length - 1}
          />
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
        Sale de quienes reseñaron las dos en el mismo período. No dice que una cause la otra: dice
        cuántos las llevaron juntas y a cuántos se les cayó alguna.
      </p>
    </section>
  );
}

function TakenWithRow({ pair, last }: { pair: TakenWith; last: boolean }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: last ? 0 : '1px solid var(--color-line-2)' }}>
      <div className="flex items-baseline justify-between gap-2.5">
        <Link
          href={`/subjects/${pair.subjectId}`}
          // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
          prefetch={false}
          className="text-[13.5px] text-ink underline-offset-2 hover:underline"
        >
          {pair.subjectName}
        </Link>
        <span className="whitespace-nowrap font-mono text-[10.5px] text-ink-3">
          {pair.subjectCode}
        </span>
      </div>

      {pair.isPublished ? (
        <p className="mt-[5px] text-[12.5px] leading-relaxed text-ink-2">
          {pair.togetherCount} la llevaron junto con esta.{' '}
          {pair.droppedCount === 0
            ? 'Ninguno dejó alguna de las dos.'
            : `${pair.droppedCount} dejaron alguna de las dos.`}
        </p>
      ) : (
        <p className="mt-[5px] text-[12.5px] leading-relaxed text-ink-3">
          {pair.togetherCount} la llevaron junto con esta: con {pair.missingToPublish} más se
          publica cómo les fue.
        </p>
      )}
    </div>
  );
}

/**
 * Sus cátedras: cada una con reseñas trae el nombre, la conclusión de su frase con la moda más
 * marcada (o que todavía no tiene una) y quién está a cargo. Las que todavía no tienen ni una
 * reseña se pliegan en una sola línea al final, para no repetir veinte veces "sin reseñas todavía".
 */
function Chairs({ facts }: { facts: SubjectFacts }) {
  if (facts.chairs.length === 0) return null;

  const withReviews = facts.chairs.filter((chair) => chair.reviewCount > 0);
  const withoutReviews = facts.chairs.filter((chair) => chair.reviewCount === 0);
  const rowCount = withReviews.length + (withoutReviews.length > 0 ? 1 : 0);

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Sus cátedras</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {withReviews.map((chair, index) => (
          <ChairRow key={chair.chairId} chair={chair} last={index === rowCount - 1} />
        ))}
        {withoutReviews.length > 0 && (
          <div
            style={{
              padding: '10px 0',
              borderBottom: 0,
            }}
          >
            <p className="text-[12.5px] text-ink-3">
              {withoutReviews.length} {withoutReviews.length === 1 ? 'cátedra más' : 'cátedras más'}{' '}
              · sin reseñas todavía
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ChairRow({ chair, last }: { chair: SubjectChair; last: boolean }) {
  const footer = chairFooter(chair);

  return (
    <div style={{ padding: '10px 0', borderBottom: last ? 0 : '1px solid var(--color-line-2)' }}>
      <Link
        href={`/chairs/${chair.chairId}`}
        // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
        prefetch={false}
        className="text-[13.5px] text-ink underline underline-offset-2"
      >
        {chair.chairName}
      </Link>
      <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">{chairConclusion(chair)}</p>
      {footer && (
        <p className="mt-0.5 text-[11px] text-ink-3" style={{ fontFamily: 'var(--font-mono)' }}>
          {footer}
        </p>
      )}
    </div>
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

/** Las otras materias del mismo año del plan, para no tener que volver al plan entero a buscarlas. */
function OtherSubjectsOfYear({ facts, subjects }: { facts: SubjectFacts; subjects: Subject[] }) {
  return (
    <aside className="min-w-0">
      <p className="mb-2 text-[12px] text-ink-3">Las otras materias de {facts.yearInPlan}º año</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {subjects.map((subject, index) => (
          <div
            key={subject.id}
            style={{
              padding: '10px 0',
              borderBottom: index === subjects.length - 1 ? 0 : '1px solid var(--color-line-2)',
            }}
          >
            <Link
              href={`/subjects/${subject.id}`}
              prefetch={false}
              className="flex items-baseline justify-between gap-2.5"
            >
              <span className="text-[13.5px] text-ink underline underline-offset-2">
                {subject.name}
              </span>
              <span
                className="shrink-0 text-right text-[11px] text-ink-3"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {subject.code}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Footer({ reviewHref }: { reviewHref: string }) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <Link
        href="/method"
        // Sin prefetch: /method es `force-dynamic` y no tiene loading.tsx. Con el middleware de
        // ADR-0095 cubriéndola, el prefetch por default de un Link hacia ahí nunca llega a
        // completarse y el click que sigue queda sin navegar.
        prefetch={false}
        className="text-[12px] text-accent-ink underline-offset-2 hover:underline"
      >
        ¿Cómo calculamos esto?
      </Link>
      <Link
        href={reviewHref}
        className="whitespace-nowrap rounded-lg px-3.5 py-[9px] text-[13px] font-medium"
        style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
      >
        ¿La cursaste? Reseñala
      </Link>
    </div>
  );
}
