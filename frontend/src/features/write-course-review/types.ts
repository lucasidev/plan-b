/**
 * DTOs de la pantalla Reseñar (US-146, ADR-0082). Espejan lo que devuelve el backend: el
 * cuestionario vigente, las materias del plan del alumno, sus períodos y las cátedras de la
 * materia elegida.
 */

/** Una opción de respuesta. No trae valencia: la recolección va sin alarma (ADR-0071). */
export type InstrumentOption = {
  value: number;
  label: string;
};

/** Las tres capas de la reseña. Ordenan los pasos de la pantalla. */
export type ItemLayer = 'Context' | 'ChairConduct' | 'StudentExperience';

export type InstrumentItem = {
  code: string;
  text: string;
  help: string | null;
  layer: ItemLayer;
  options: readonly InstrumentOption[];
};

export type CurrentInstrument = {
  code: string;
  version: number;
  items: readonly InstrumentItem[];
};

export type SubjectOption = {
  id: string;
  code: string;
  name: string;
  yearInPlan: number;
};

export type TermOption = {
  id: string;
  label: string;
};

export type ChairOption = {
  id: string;
  name: string;
  leadFirstName: string | null;
  leadLastName: string | null;
};

/** Lo que el usuario respondió: código de ítem contra valor de opción. Saltear = no está la clave. */
export type AnswerDraft = Record<string, number>;

/** Estado del server action, en el formato que usa el resto de los features. */
export type PublishCourseReviewResult =
  | { status: 'idle' }
  | { status: 'success'; reviewId: string; answeredItems: number }
  | { status: 'error'; message: string };

export const initialPublishState: PublishCourseReviewResult = { status: 'idle' };
