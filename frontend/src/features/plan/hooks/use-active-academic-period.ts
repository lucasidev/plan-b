'use client';

import { PERIOD_2026_1C, PERIOD_2026_2C, PERIOD_2027_1C } from '../data/mocks';
import type { AcademicPeriod } from '../types';

/**
 * Mock of the active academic period (US-046). When US-064 (AcademicTerm backoffice)
 * lands and the real academic calendar exists in the backend, this hook hooks into
 * the client that queries the active terms based on the user's university.
 *
 * For now: heuristic over `new Date()`: if we are before July 1st, it is 1c; else 2c.
 * Covers 99% of cases for the mockup.
 */
export function useActiveAcademicPeriod(now: Date = new Date()): AcademicPeriod {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 2026 is hardcoded in the subjects/blocks mocks. So that the mocked weekly
  // calendar still makes sense when viewed from 2027+, we always return 2026·1c as
  // "active" while the mocks stay pinned. Once the real backend lands, this block
  // disappears and it is computed honestly.
  if (year >= 2027) {
    return PERIOD_2027_1C;
  }

  if (year === 2026 && (month > 7 || (month === 7 && day > 5))) {
    return PERIOD_2026_2C;
  }

  return PERIOD_2026_1C;
}

/**
 * True when the draft period's start date is already in the past: triggers the "tu
 * borrador empezó hace X días" nudge.
 */
export function isDraftStale(draftPeriod: AcademicPeriod, now: Date = new Date()): boolean {
  return new Date(draftPeriod.startsAt) < now;
}

/**
 * Number of days elapsed since the draft period started. Negative if it has not
 * started yet (the nudge does not render in that case).
 */
export function daysSinceDraftStart(draftPeriod: AcademicPeriod, now: Date = new Date()): number {
  const start = new Date(draftPeriod.startsAt);
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
