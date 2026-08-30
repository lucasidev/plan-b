/**
 * Response shapes for the public catalog endpoints consumed by `CareerPicker` (mismos
 * endpoints que usaba `features/onboarding`). Replicadas acá desde el shape del backend para
 * que el cliente las consuma sin importar tipos del backend (cross-language boundary).
 */

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
  // 'Deprecated'. The picker filters for 'Active' so historical plans do not show up.
  status: 'Active' | 'Deprecated';
  // US-088: crowdsourced plans have isOfficial=false with the "No oficial" badge.
  isOfficial: boolean;
};
