import type { AvailabilityStatus, AvailableSubject, BlockedBySubject } from '../types';

/**
 * Helpers puros del catálogo de materias disponibles del planificador (US-016). Viven acá y no en
 * `subject-picker-drawer.tsx` porque un archivo que mezcla componentes con funciones sueltas rompe
 * el fast-refresh de React (regla `only-export-components`): al editar el componente, React no
 * puede recargar en caliente y recarga la página entera. Además son puros y testeables sin montar
 * el drawer.
 */

const VISIBLE_STATUSES: ReadonlySet<AvailabilityStatus> = new Set(['Available', 'Blocked']);

/**
 * Disponibles + bloqueadas (con motivo). Las ya aprobadas/regularizadas/en curso quedan afuera:
 * no tiene sentido ofrecerlas para sumar a una simulación del período que viene.
 */
export function selectVisibleSubjects(items: readonly AvailableSubject[]): AvailableSubject[] {
  return items.filter((item) => VISIBLE_STATUSES.has(item.status));
}

/**
 * "Año 2 · Cuatrimestral 1" / "Año 2 · Anual" (Anual nunca trae termInYear, invariante del
 * backend). Sin traducir a ordinales: mismo criterio simple que `SubjectHeader` de view-subject
 * (termKind ya viaja en español desde el backend).
 */
export function formatSubjectPeriod(
  yearInPlan: number,
  termInYear: number | null,
  termKind: string,
): string {
  const term = termInYear !== null ? `${termKind} ${termInYear}` : termKind;
  return `Año ${yearInPlan} · ${term}`;
}

/** "Te falta aprobar o regularizar: MAT101 Análisis Matemático I, FIS101 Física I". */
export function formatBlockedReason(blockedBy: readonly BlockedBySubject[]): string {
  const list = blockedBy.map((b) => `${b.code} ${b.name}`).join(', ');
  return `Te falta aprobar o regularizar: ${list}`;
}
