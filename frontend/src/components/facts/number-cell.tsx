import Link from 'next/link';
import { formatOfficialFactValue } from './format-official-fact-value';
import type { OfficialFact } from './types';

/**
 * Una celda de la tira de números de una ficha (mismo patrón visual en la ficha de carrera y la
 * de institución): una etiqueta, un valor grande y una nota opcional debajo. `isDerived` marca el
 * chip "derivado" (ADR-0090): un derivado nunca toma la forma de un dato publicado, y el chip
 * linkea a su regla en Método, igual que `OfficialFactRow`.
 */
export function NumberCell({
  label,
  value,
  note,
  isDerived = false,
  derivationRuleId = null,
}: {
  label: string;
  value: string;
  note?: string | null;
  isDerived?: boolean;
  /** La regla que citó el cálculo. Sin ella, el link cae a Método a secas (mismo criterio que `OfficialFactRow`). */
  derivationRuleId?: string | null;
}) {
  const methodHref = derivationRuleId ? `/method#${derivationRuleId}` : '/method';

  return (
    <div className="rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1 text-[12px] text-ink-3">{label}</p>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <p className="font-serif text-[20px] font-medium text-ink">{value}</p>
        {isDerived && (
          <Link
            href={methodHref}
            className="rounded-[4px] bg-bg-elev px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-3 hover:underline"
          >
            derivado
          </Link>
        )}
      </div>
      {note && <p className="mt-1 text-[11px] leading-snug text-ink-3">{note}</p>}
    </div>
  );
}

/**
 * Resume un dato oficial para una celda de la tira. Publicado o derivado muestra su valor con su
 * período. Los demás estados hablan del hecho, no lo confunden con "no informa" (que no existe en
 * el glosario): sin afirmación todavía, "Sin relevar" (misma idea que `MissingFactRow`, para
 * cuando ni siquiera hay un `OfficialFact` para este sujeto y campo); `NotPublished`, "No
 * publicado"; `NotApplicable`, "No aplica"; `Requested`, "Pedido". La nota corta del hecho, si la
 * tiene, va debajo. El detalle completo, con fuente y fecha, vive en el bloque de datos oficiales
 * debajo de la tira: acá alcanza con el vistazo.
 */
export function officialFactCellContent(fact: OfficialFact | undefined): {
  value: string;
  note: string | null;
  isDerived: boolean;
  derivationRuleId: string | null;
} {
  if (!fact) {
    return { value: 'Sin relevar', note: null, isDerived: false, derivationRuleId: null };
  }

  switch (fact.status) {
    case 'Published':
      return {
        value: formatOfficialFactValue(fact.value ?? '', fact.unit),
        note: fact.period,
        isDerived: false,
        derivationRuleId: null,
      };
    case 'Derived':
      return {
        value: formatOfficialFactValue(fact.value ?? '', fact.unit),
        note: fact.period,
        isDerived: true,
        derivationRuleId: fact.derivationRuleId,
      };
    case 'NotPublished':
      return { value: 'No publicado', note: fact.note, isDerived: false, derivationRuleId: null };
    case 'NotApplicable':
      return { value: 'No aplica', note: fact.note, isDerived: false, derivationRuleId: null };
    case 'Requested':
      return { value: 'Pedido', note: fact.note, isDerived: false, derivationRuleId: null };
    default:
      return { value: 'Sin relevar', note: null, isDerived: false, derivationRuleId: null };
  }
}
