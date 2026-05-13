import type { PlannedSubject, PlanYear, SubjectState } from '@/features/mi-carrera/data/plan';

/**
 * Devuelve los códigos de las materias aprobadas en el plan completo.
 * Source para chequeos de correlatividad.
 */
export function approvedCodes(plan: PlanYear[]): Set<string> {
  const codes = new Set<string>();
  for (const year of plan) {
    for (const subject of year.subjects) {
      if (subject.state === 'AP') codes.add(subject.code);
    }
  }
  return codes;
}

/**
 * Lista las correlativas que el alumno NO tiene aprobadas todavía. Devuelve
 * codes (no nombres) para que el caller decida qué mostrar.
 */
export function missingCorrelativas(subject: PlannedSubject, approved: Set<string>): string[] {
  return subject.correlativas.filter((code) => !approved.has(code));
}

/**
 * Una materia está "unlocked" (cursable) cuando todas sus correlativas
 * están aprobadas. Una materia sin correlativas siempre está unlocked.
 *
 * En MVP el color visual (AP/CU/PD) del mockup NO distingue unlocked vs
 * bloqueada; ambos casos caen en PD. Este helper queda disponible para:
 *   - Tooltip que liste correlativas pendientes.
 *   - Drawer de materia (US-045-d) que muestre el bloqueo.
 *   - Futura mejora visual si el equipo decide separar los dos casos.
 */
export function isUnlocked(subject: PlannedSubject, approved: Set<string>): boolean {
  return missingCorrelativas(subject, approved).length === 0;
}

/**
 * Copy human-readable del estado para tooltips y labels.
 */
export const stateLabel: Record<SubjectState, string> = {
  AP: 'Aprobada',
  CU: 'Cursando',
  PD: 'Pendiente',
};
