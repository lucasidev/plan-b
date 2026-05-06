/**
 * Estado del server action `submitCareerAction` (US-037-f paso 02).
 *
 * `idle` mientras el form no se submitió todavía. `error` cuando el backend
 * devolvió 4xx que el action mapeó a copy en español. El happy path es un
 * `redirect()` server-side que tira NEXT_REDIRECT (no llega de vuelta al
 * useActionState con `success`, por eso no hay variant `success`).
 */
export type OnboardingCareerFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; field?: 'enrollmentYear' };

export const initialOnboardingCareerState: OnboardingCareerFormState = { status: 'idle' };

// Shapes de respuesta de los endpoints públicos del catálogo (US-037-b).
// Se replican acá del shape del backend para que el cliente los consuma sin
// tener que importar tipos del backend (cross-language boundary).

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
};

export type CareerPlan = {
  id: string;
  careerId: string;
  year: number;
  // Enum CareerPlanStatus serializado por EF como string. Valores: 'Active' o
  // 'Deprecated'. El form filtra 'Active' para no mostrar planes históricos.
  status: 'Active' | 'Deprecated';
};
