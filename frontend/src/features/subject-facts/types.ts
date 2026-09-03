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
  isPublished: boolean;
  totalVoices: number;
  publishingChairs: number;
  chairsBelowFloor: number;
  span: SubjectSpan | null;
  attempts: Distribution | null;
  completion: SubjectCompletion | null;
  enablesCount: number;
  spread: Spread[];
  shared: Shared[];
  takenWith: TakenWith[];
  chairs: SubjectChair[];
}

export interface SubjectSpan {
  fromYear: number;
  toYear: number;
}

/**
 * La distribución de una frase, con su moda. Nunca un promedio.
 *
 * `openEnded` es la opción abierta de la frase ("tres o más"), cuando tiene una. Viene separada del
 * resto para que la ficha la diga sola: es la gente a la que le costó, que es justo la que un
 * promedio taparía.
 */
export interface Distribution {
  code: string;
  text: string;
  modeLabel: string;
  modePercent: number;
  total: number;
  options: Slice[];
  openEnded: Slice | null;
}

export interface Slice {
  label: string;
  percent: number;
  isNegative: boolean;
}

export interface SubjectCompletion {
  outOfTen: number;
  reaching: number;
  total: number;
}

/** Una frase donde las cátedras difieren: la respuesta depende de con quién te toque. */
export interface Spread {
  itemCode: string;
  itemText: string;
  negativeLabel: string;
  byChair: ChairShare[];
}

export interface ChairShare {
  chairId: string;
  chairName: string;
  percent: number;
  total: number;
}

/** Una frase que todas las cátedras marcan parejo: es de la materia, no de quien la dicta. */
export interface Shared {
  itemCode: string;
  itemText: string;
  negativeLabel: string;
  lowestPercent: number;
  highestPercent: number;
  chairCount: number;
}

export interface SubjectChair {
  chairId: string;
  chairName: string;
  reviewCount: number;
  isPublished: boolean;
  reviewsMissingToPublish: number;
  lastReviewedAt: string | null;
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
