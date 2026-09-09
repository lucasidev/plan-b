import { OFFICIAL_FACT_FIELDS, type OfficialFact, OfficialFactRow } from '@/components/facts';

/**
 * La cabecera de identidad de la ficha de institución (SC-005): el nombre y, cuando está
 * relevado, su dato de identidad institucional (tipo, provincia, facultades y estudiantes,
 * ADR-0090, campo `institution_type`). Reusa el mismo render de una afirmación que el resto de
 * las fichas: nunca un número sin fuente, tampoco acá.
 *
 * Sin relevamiento todavía, el bloque de identidad no se dibuja: el nombre solo no es un espacio
 * en blanco, es lo único que hay.
 */
export function InstitutionIdentity({ name, facts }: { name: string; facts: OfficialFact[] }) {
  const identity = facts.find((fact) => fact.field === OFFICIAL_FACT_FIELDS.institutionType);

  return (
    <div className="mb-[18px]">
      <h1 className="mb-2 font-serif text-[24px] font-semibold text-ink">{name}</h1>
      {identity && (
        <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
          <OfficialFactRow fact={identity} last />
        </div>
      )}
    </div>
  );
}
