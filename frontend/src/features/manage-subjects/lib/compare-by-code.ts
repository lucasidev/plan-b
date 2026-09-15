/**
 * Ordena por código con los faltantes al final y el nombre como desempate (US-062 admin, ADR-0097:
 * el código es opcional). Mismo criterio que `compareSubjectsByCode` del catálogo público
 * (`browse-catalog`); vive acá aparte porque ese toma el tipo `Subject` del catálogo público y acá
 * los callers no siempre tienen la materia completa (una correlativa puede apuntar a un id que no
 * está en el mapa cargado).
 */
export function compareByCodeThenName(
  a: { code: string | null; name: string },
  b: { code: string | null; name: string },
): number {
  if (a.code === null && b.code === null) return a.name.localeCompare(b.name);
  if (a.code === null) return 1;
  if (b.code === null) return -1;
  return a.code.localeCompare(b.code) || a.name.localeCompare(b.name);
}
