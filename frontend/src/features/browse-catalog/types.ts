/**
 * DTOs del catálogo público (US-001): universidades → carreras → planes → materias. Todos los
 * endpoints son `AllowAnonymous`. Espejan los records de `Planb.Academic.Application.Contracts`
 * (feature group `PublicCatalog`), replicados acá porque el frontend no importa tipos del backend.
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
  /** US-088: carreras cargadas por alumnos (crowdsourced) tienen isOfficial=false. */
  isOfficial: boolean;
  /** La facultad o sede que dicta la oferta; null si la carrera no tiene una asignada. */
  academicUnitName: string | null;
};

/**
 * Item del listado de planes de una carrera. El backend serializa el enum CareerPlanStatus
 * (EF `HasConversion<string>`) como 'Active' | 'Deprecated'; 'Active' es el plan vigente.
 */
export type CareerPlan = {
  id: string;
  careerId: string;
  year: number;
  status: 'Active' | 'Deprecated';
  isOfficial: boolean;
};

/**
 * GET /api/academic/career-plans/{id}: resuelve un plan puntual a su carrera + universidad.
 * Distinto de `CareerPlan` (el item de listado): no trae status ni isOfficial, solo lo necesario
 * para validar que el plan existe (404 si no) y armar el breadcrumb de la página de materias.
 */
export type CareerPlanSummary = {
  id: string;
  careerId: string;
  universityId: string;
  year: number;
};

export type Subject = {
  id: string;
  careerPlanId: string;
  code: string;
  name: string;
  yearInPlan: number;
  termInYear: number | null;
  termKind: string;
};

/**
 * Cuánto junta una materia del plan (US-134, SC-018): cuántas cátedras y reseñas tiene detrás, y
 * si alguna ya cruzó el piso. Espeja `PlanSubjectCoverageView` de
 * `GET /api/reviews/career-plans/{id}/subject-coverage`. Una materia sin ninguna reseña con
 * cátedra no tiene entrada: se lee "sin reseñas".
 */
export type SubjectCoverage = {
  subjectId: string;
  reviewCount: number;
  chairCount: number;
  isCovered: boolean;
};

/**
 * Una carrera del catálogo entero con lo que ayuda a decidir si vale abrirla (US-222, ficha de
 * SC-003), antes de entrar: si tiene datos oficiales (ADR-0090), sus voces y su cobertura. Espeja
 * `CareerCoverageView` de `GET /api/reviews/catalog-coverage`.
 */
export type CareerCoverage = {
  careerId: string;
  careerName: string;
  universityId: string;
  universityName: string;
  isOfficial: boolean;
  hasOfficialData: boolean;
  /** Ya respeta el piso de publicación: nunca el conteo crudo de una cátedra que no lo cruzó. */
  voiceCount: number;
  /** Hay reseñas cargadas que todavía no cruzan el piso de alguna cátedra: no dice cuántas. */
  hasReviewsBelowFloor: boolean;
  totalSubjects: number;
  coveredSubjects: number;
  /** Nombre del grupo de carrera canónica (US-195) si esta oferta está agrupada con otras; null si no. */
  canonicalGroupName: string | null;
};

/** Una universidad con cuántas carreras tiene y cuántas de esas tienen algo para leer (US-222). */
export type UniversityWithCoverage = University & {
  careerCount: number;
  careersWithSomethingToRead: number;
};
