/**
 * Elige el período lectivo por defecto del planificador cuando la URL no trae `?termId=` (US-096):
 * el próximo (el primero cuya fecha de inicio es futura); si no hay ninguno futuro, el que está en
 * curso hoy (`now` cae dentro de `[startDate, endDate]`); si tampoco, el más reciente (el de fecha
 * de inicio más tardía entre los que ya terminaron).
 *
 * El orden importa: el alumno entra al planificador para armar lo que viene, no para mirar lo que
 * ya pasó. Recibe el shape mínimo (id + fechas) en vez del `AcademicTerm` entero para que el
 * criterio sea testeable sin construir el DTO completo.
 */
export type TermWithDates = {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  endDate: string;
};

export function pickDefaultTerm(
  terms: readonly TermWithDates[],
  now: Date = new Date(),
): string | null {
  if (terms.length === 0) return null;

  const upcoming = terms
    .filter((t) => new Date(t.startDate).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  if (upcoming.length > 0) return upcoming[0].id;

  const current = terms.find(
    (t) =>
      new Date(t.startDate).getTime() <= now.getTime() &&
      now.getTime() <= new Date(t.endDate).getTime(),
  );
  if (current) return current.id;

  const byRecency = [...terms].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  return byRecency[0].id;
}
