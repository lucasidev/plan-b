import { OFFICIAL_FACT_FIELDS, type OfficialFact, OfficialFactRow } from '@/components/facts';

/**
 * La cabecera de la ficha de institución (SC-005): eyebrow (tipo de institución), nombre, cuántas
 * unidades académicas tiene y, cuando está relevado, el dato completo de identidad institucional
 * (ADR-0090, campo `institution_type`) con su fuente. Reusa el mismo render de una afirmación que
 * el resto de las fichas: nunca un número sin fuente, tampoco acá.
 *
 * "Unidades académicas" y no "facultades": el catálogo agrupa carreras bajo unidades de distinto
 * tipo (facultades, pero también sedes o centros regionales), y llamarlas todas "facultad" sería
 * un dato inventado para las que no lo son.
 *
 * Sin relevamiento todavía, solo queda el eyebrow genérico y el nombre: no es un espacio en
 * blanco, es lo único que hay.
 */
export function InstitutionIdentity({
  name,
  facts,
  academicUnitCount,
}: {
  name: string;
  facts: OfficialFact[];
  academicUnitCount: number;
}) {
  const identity = facts.find((fact) => fact.field === OFFICIAL_FACT_FIELDS.institutionType);
  const kind = institutionKind(identity);

  return (
    <div className="mb-[18px]">
      <p className="mb-1.5 font-mono text-[11px] tracking-[0.02em] text-ink-3">
        Universidad{kind ? ` · ${kind}` : ''}
      </p>
      <h1 className="mb-2 font-serif text-[24px] font-semibold text-ink">{name}</h1>
      {academicUnitCount > 0 && (
        <p className="text-[13px] text-ink-2">
          {academicUnitCount}{' '}
          {academicUnitCount === 1 ? 'unidad académica.' : 'unidades académicas.'}
        </p>
      )}
      {identity && (
        <div className="mt-3 rounded-xl border border-line bg-bg-card px-4 py-[5px]">
          <OfficialFactRow fact={identity} subject="institution" last />
        </div>
      )}
    </div>
  );
}

/**
 * El tipo de institución para el eyebrow ("Universidad · privada"): el primer segmento del valor
 * de `institution_type`, en minúscula. El valor guarda varios datos separados por "; " (pública o
 * privada primero, después estudiantes/egresados: ver `OfficialFactSeedData.cs`); acá solo hace
 * falta el primero. `null` cuando el campo no está relevado o no tiene valor (no publicado).
 */
function institutionKind(fact: OfficialFact | undefined): string | null {
  if (!fact?.value) return null;
  const [firstSegment] = fact.value.split(';');
  const kind = firstSegment?.trim().toLowerCase();
  return kind || null;
}
