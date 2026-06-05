/**
 * State of the `submitCareerAction` server action (US-037-f step 02).
 *
 * `idle` while the form has not been submitted yet. `error` when the backend returns a
 * 4xx that the action maps to user-facing copy. The happy path is a server-side
 * `redirect()` that throws NEXT_REDIRECT (it never returns to useActionState with
 * `success`, which is why there is no `success` variant).
 */
export type OnboardingCareerFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; field?: 'enrollmentYear' };

export const initialOnboardingCareerState: OnboardingCareerFormState = { status: 'idle' };

// Response shapes for the public catalog endpoints (US-037-b). Replicated here from the
// backend shape so the client can consume them without importing backend types
// (cross-language boundary).

export type University = {
  id: string;
  name: string;
  slug: string;
};

export type Career = {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  // US-088: crowdsourced careers (uploaded by students) have isOfficial=false.
  // The frontend displays them with a "No oficial" badge.
  isOfficial: boolean;
};

export type CareerPlan = {
  id: string;
  careerId: string;
  year: number;
  // The CareerPlanStatus enum is serialised by EF as a string. Values: 'Active' or
  // 'Deprecated'. The form filters for 'Active' so historical plans do not show up.
  status: 'Active' | 'Deprecated';
  // US-088: crowdsourced plans have isOfficial=false with the "No oficial" badge.
  isOfficial: boolean;
};
