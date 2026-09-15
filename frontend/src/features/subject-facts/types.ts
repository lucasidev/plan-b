/**
 * La ficha de una materia tal como baja del backend (US-129, ADR-0085).
 *
 * Espeja `GetSubjectFactsResponse`. Una materia nunca se reseña directo: todo esto se derivó
 * sumando las cursadas de sus cátedras, y solo de las que cruzaron el piso de 10.
 */

export interface SubjectFacts {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  yearInPlan: number;
  careerPlanId: string;
  careerId: string;
  careerName: string;
  universityName: string;
  isPublished: boolean;
  totalVoices: number;
  publishingChairs: number;
  chairsBelowFloor: number;
  span: SubjectSpan | null;
  completion: SubjectCompletion | null;
  enablesCount: number;
  takenWith: TakenWith[];
  chairs: SubjectChair[];
}

export interface SubjectSpan {
  fromYear: number;
  toYear: number;
}

export interface SubjectCompletion {
  outOfTen: number;
  reaching: number;
  total: number;
}

export interface SubjectChair {
  chairId: string;
  chairName: string;
  reviewCount: number;
  isPublished: boolean;
  reviewsMissingToPublish: number;
  lastReviewedAt: string | null;
  leadTeacherName: string | null;
  headline: SubjectChairHeadline | null;
}

/**
 * La frase de conducta con la moda más marcada de una cátedra publicada (US-129): mismo ítem,
 * opción y porcentaje que su propia ficha ya publica como moda (ADR-0083). `optionValue` identifica
 * la opción de forma estable (es lo que se persiste; el texto se afina y el orden se puede
 * reordenar en la curaduría, el valor no); `chair-headlines.ts` lo traduce a la frase de
 * conclusión.
 */
export interface SubjectChairHeadline {
  itemCode: string;
  optionValue: number;
  percent: number;
  respondents: number;
}

/**
 * Con qué otra materia se llevó esta, en un período (US-143).
 *
 * Tiene su propio piso por par y período, así que un par puede no publicar aunque la materia sí:
 * que una materia junte cuarenta reseñas no dice nada de una combinación puntual.
 */
export type TakenWith = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  togetherCount: number;
  /** Cuántas cuentas dejaron al menos una de las dos. Solo viaja si el par publica. */
  droppedCount: number;
  isPublished: boolean;
  missingToPublish: number;
};
