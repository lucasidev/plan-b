import Link from 'next/link';
import { CatalogTopbar } from '@/features/browse-catalog';
import type { Distribution, SubjectChair, SubjectFacts } from '../types';

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
export function SubjectFactsSheet({ facts }: { facts: SubjectFacts }) {
  return (
    <div data-surface="bulletin" className="min-h-screen w-full">
      {/* Con el topbar, porque una ficha sin él es una calle sin salida: se llega desde la
          búsqueda y no hay cómo seguir buscando ni volver. */}
      <CatalogTopbar />
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <Identity facts={facts} />

        {facts.isPublished ? (
          <>
            <Numbers facts={facts} />
            <SubjectOrChair facts={facts} />
          </>
        ) : (
          <Empty facts={facts} />
        )}

        <Chairs facts={facts} />
        <Footer facts={facts} />
      </div>
    </div>
  );
}

function Identity({ facts }: { facts: SubjectFacts }) {
  return (
    <div className="mb-[18px]">
      <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">{facts.subjectName}</h1>
      <p className="mb-1 text-[13px] text-ink-2">
        {facts.subjectCode} · {facts.yearInPlan}º año
      </p>
      {facts.isPublished && (
        <p className="text-[11px] text-ink-3" style={{ fontFamily: 'var(--font-mono)' }}>
          {facts.totalVoices} {facts.totalVoices === 1 ? 'voz' : 'voces'} en{' '}
          {facts.publishingChairs} {facts.publishingChairs === 1 ? 'cátedra' : 'cátedras'}
          {facts.span &&
            (facts.span.fromYear === facts.span.toYear
              ? ` · ${facts.span.fromYear}`
              : ` · ${facts.span.fromYear} a ${facts.span.toYear}`)}
        </p>
      )}
    </div>
  );
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
 * Los números que resumen la materia. Cada uno dice de dónde sale: los intentos y la finalización,
 * de lo que contaron los que cursaron; lo que habilita, del plan de la carrera.
 */
function Numbers({ facts }: { facts: SubjectFacts }) {
  return (
    <section className="mb-5">
      <div className="grid grid-cols-2 gap-2.5">
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
        {facts.attempts && <Attempts attempts={facts.attempts} />}
      </div>
    </section>
  );
}

/**
 * Los intentos: la moda y, aparte, la cola.
 *
 * El boceto pedía acá un promedio ("2,1 intentos") y no sobrevive: la última opción del ítem es
 * abierta ("tres o más"), así que promediarla subestima siempre y por un margen que nadie puede
 * recalcular. Pero publicar la distribución sola tampoco alcanzaba: obliga a leer tres números y
 * hacer la cuenta en la cabeza para darse cuenta de lo único que importa.
 *
 * Así que se dicen las dos cosas por separado: lo que le pasa a la mayoría, y **cuántos quedaron
 * en la cola**. Esa segunda frase es el dato que la materia existe para publicar, porque no
 * importa cuánto tarda el que va bien sino a cuántos les cuesta.
 */
function Attempts({ attempts }: { attempts: Distribution }) {
  return (
    <div className="col-span-2 rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1.5 text-[12px] text-ink-3">{attempts.text}</p>

      <p className="mb-1 font-serif text-[20px] font-medium text-ink">
        {attempts.modeLabel}, el {attempts.modePercent} %
      </p>

      {attempts.openEnded && attempts.openEnded.percent > 0 && (
        <p className="mb-2 text-[14px] leading-snug text-ink-2">
          Pero <b className="font-medium text-ink">{attempts.openEnded.percent} de cada 100</b>{' '}
          marcaron «{attempts.openEnded.label.toLowerCase()}».
        </p>
      )}

      {/* La cola va del tono más oscuro para que la barra diga lo mismo que el texto de arriba.
          No va en alarma: cursar tres veces no es una falta de nadie, es un hecho que el dato
          existe para mostrar, y el rojo acá significaría algo que no queremos decir. */}
      <div className="mb-2 flex h-2.5 gap-px overflow-hidden rounded-[5px]">
        {attempts.options.map((option, index) => (
          <span
            key={option.label}
            style={{
              width: `${option.percent}%`,
              background:
                option.label === attempts.openEnded?.label
                  ? 'var(--color-ink-2)'
                  : index % 2 === 0
                    ? 'var(--color-line)'
                    : 'var(--color-ink-4)',
            }}
          />
        ))}
      </div>

      <p className="text-[11px] text-ink-4" style={{ fontFamily: 'var(--font-mono)' }}>
        {attempts.options.map((o) => `${o.label.toLowerCase()} ${o.percent}`).join(' · ')} · de{' '}
        {attempts.total}
      </p>
    </div>
  );
}

function Cell({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1 text-[12px] text-ink-3">{label}</p>
      <p className="mb-1 font-serif text-[20px] font-medium text-ink">{value}</p>
      <p className="text-[11px] leading-snug text-ink-4">{note}</p>
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
        <div key={item.itemCode} className="mb-2.5 rounded-xl border border-line bg-bg-card p-4">
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
                  className="w-[70px] shrink-0 whitespace-nowrap text-right text-[11px] text-ink-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {chair.percent}% de {chair.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {facts.shared.length > 0 && (
        <div className="rounded-xl border border-line bg-bg-card p-4">
          <p className="mb-1.5 text-[12px] text-ink-3">Lo que sí es de la materia</p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {facts.shared.map((item) => (
              <li key={item.itemCode} className="text-[13px] leading-relaxed text-ink-2">
                <span className="text-ink">{item.itemText}</span> «
                {item.negativeLabel.toLowerCase()}» lo marcan entre el {item.lowestPercent} % y el{' '}
                {item.highestPercent} % en las {item.chairCount} cátedras.
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * Sus cátedras, **ordenadas por cantidad de voces y nunca por sus números**: ordenarlas por
 * resultado sería un ranking, y acá no hay ranking. La que no llegó al piso se lista igual, con su
 * cuenta y lo que le falta, y sin un solo conteo.
 *
 * Es además el camino a la ficha de cátedra, que hasta acá no tenía ninguno.
 */
function Chairs({ facts }: { facts: SubjectFacts }) {
  if (facts.chairs.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Sus cátedras</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {facts.chairs.map((chair, index) => (
          <ChairRow key={chair.chairId} chair={chair} last={index === facts.chairs.length - 1} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-4">
        ordenadas por cantidad de voces, nunca por sus números
      </p>
    </section>
  );
}

function ChairRow({ chair, last }: { chair: SubjectChair; last: boolean }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: last ? 0 : '1px solid var(--color-line-2)' }}>
      <Link
        href={`/chairs/${chair.chairId}`}
        className="flex items-baseline justify-between gap-2.5"
      >
        <span className="text-[13.5px] text-ink underline underline-offset-2">
          {chair.chairName}
        </span>
        <span
          className="shrink-0 text-right text-[11px] text-ink-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {chair.isPublished
            ? `${chair.reviewCount} ${chair.reviewCount === 1 ? 'voz' : 'voces'}`
            : `${chair.reviewCount} ${chair.reviewCount === 1 ? 'reseña' : 'reseñas'} · faltan ${chair.reviewsMissingToPublish}`}
        </span>
      </Link>
    </div>
  );
}

function Footer({ facts }: { facts: SubjectFacts }) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <span className="text-[12px] text-ink-3">{facts.subjectCode}</span>
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
