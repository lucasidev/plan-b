import type { PlannedSubject, PlanYear, SubjectState } from '@/features/my-career/data/plan';

/**
 * Returns the codes of the subjects approved in the full plan. Source for
 * prerequisite checks.
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
 * Lists the prerequisites the student has not yet approved. Returns codes (not names)
 * so the caller decides what to display.
 */
export function missingCorrelativas(subject: PlannedSubject, approved: Set<string>): string[] {
  return subject.correlativas.filter((code) => !approved.has(code));
}

/**
 * A subject is "unlocked" (cursable) when all of its prerequisites are approved. A
 * subject with no prerequisites is always unlocked.
 *
 * In MVP the mockup's visual color (AP/CU/PD) does NOT distinguish unlocked vs locked;
 * both fall into PD. This helper stays available for:
 *   - Tooltip listing pending prerequisites.
 *   - Subject drawer (US-045-d) that shows the lock.
 *   - Future visual improvement if the team decides to separate the two cases.
 */
export function isUnlocked(subject: PlannedSubject, approved: Set<string>): boolean {
  return missingCorrelativas(subject, approved).length === 0;
}

/**
 * Human-readable state copy for tooltips and labels.
 */
export const stateLabel: Record<SubjectState, string> = {
  AP: 'Aprobada',
  CU: 'Cursando',
  PD: 'Pendiente',
};
