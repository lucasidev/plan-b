import Link from 'next/link';
import { formatShortDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { formatOfficialFactValue } from './format-official-fact-value';
import { OFFICIAL_FACT_LABELS } from './official-fact-fields';
import type { OfficialFact } from './types';

/** El sujeto de la ficha que renderiza la fila: cambia la etiqueta de los estados sin valor (ADR-0090). */
export type OfficialFactSubject = 'career' | 'institution';

/**
 * Una afirmación oficial, en la forma que le corresponde a su estado (ADR-0090). La comparten la
 * ficha de carrera y la de institución (y, después, Dónde estudiarla): el render de un dato
 * oficial vive acá una sola vez, no se duplica por ficha.
 *
 * Nunca un espacio en blanco y nunca un número sin fuente: Published y Derived siempre muestran
 * su fuente; los tres estados sin valor (NotPublished, Requested, NotApplicable) nunca se
 * reemplazan por una celda vacía, se dice qué se buscó, cuándo, o por qué no aplica. Un derivado
 * nunca toma la forma de un dato publicado: lleva su propia etiqueta y el link a la regla.
 */
export function OfficialFactRow({
  fact,
  subject,
  last = false,
}: {
  fact: OfficialFact;
  subject: OfficialFactSubject;
  last?: boolean;
}) {
  const label = OFFICIAL_FACT_LABELS[fact.field] ?? fact.field;

  return (
    <div className={cn('py-2.5', !last && 'border-b border-line-2')}>
      <p className="mb-1 text-[11px] text-ink-3">{label}</p>
      <Body fact={fact} subject={subject} />
    </div>
  );
}

function Body({ fact, subject }: { fact: OfficialFact; subject: OfficialFactSubject }) {
  switch (fact.status) {
    case 'Published':
      return (
        <>
          <p className="font-serif text-[17px] font-medium leading-snug text-ink">
            {formatOfficialFactValue(fact.value ?? '', fact.unit)}
          </p>
          <p className="mt-1 text-[11px] text-ink-3">
            {fact.sourceName}
            {fact.period ? ` · ${fact.period}` : ''}
          </p>
        </>
      );

    case 'Derived': {
      // Sin regla citada, el link cae a Método a secas: nunca se rompe ni apunta a un fragmento inventado.
      const methodHref = fact.derivationRuleId ? `/method#${fact.derivationRuleId}` : '/method';
      return (
        <>
          <div className="flex flex-wrap items-baseline gap-1.5">
            <p className="font-serif text-[17px] font-normal leading-snug text-ink-2">
              {formatOfficialFactValue(fact.value ?? '', fact.unit)}
            </p>
            <span className="rounded-[4px] bg-bg-elev px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-3">
              derivado
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-3">
            <Link href={methodHref} className="text-accent-ink underline-offset-2 hover:underline">
              Ver la regla en Método
            </Link>
          </p>
        </>
      );
    }

    // Etiqueta fija según quién no publicó el dato (maqueta aprobada, ADR-0090): la nota nunca la
    // reemplaza, va debajo como explicación. Sin nota, la etiqueta sola alcanza para no dejar la
    // fila muda.
    case 'NotPublished':
      return (
        <>
          <p className="text-[13px] leading-relaxed text-ink-2">
            {subject === 'career'
              ? 'No publicado por falta de datos'
              : 'La institución no lo publica'}
            <span className="text-ink-3"> · relevado el {formatShortDate(fact.relievedAt)}</span>
          </p>
          {fact.note && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{fact.note}</p>}
        </>
      );

    case 'Requested':
      return (
        <p className="text-[13px] leading-relaxed text-ink-2">
          {`Pedido a ${fact.sourceName} el ${formatShortDate(fact.relievedAt)}.`}
          {fact.note ? ` ${fact.note}` : ''}
        </p>
      );

    case 'NotApplicable':
      return (
        <>
          <p className="text-[13px] leading-relaxed text-ink-2">
            {subject === 'career' ? 'No aplica a esta carrera' : 'No aplica a esta institución'}
          </p>
          {fact.note && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{fact.note}</p>}
        </>
      );

    default:
      return null;
  }
}
