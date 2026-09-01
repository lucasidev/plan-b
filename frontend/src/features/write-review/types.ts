/**
 * DTOs de la pantalla Reseñar (US-146, ADR-0082). Espejan lo que devuelve el backend: el
 * cuestionario vigente, las materias del plan del alumno, sus períodos y las cátedras de la
 * materia elegida.
 *
 * Los tipos del cuestionario se reexportan de `components/instrument`: los comparte con corregir
 * una reseña, que dibuja las mismas preguntas.
 */

export type {
  CurrentInstrument,
  InstrumentItem,
  InstrumentOption,
  ItemLayer,
} from '@/components/instrument';

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
export type PublishReviewResult =
  | { status: 'idle' }
  | { status: 'success'; reviewId: string; answeredItems: number }
  | { status: 'error'; message: string };

export const initialPublishState: PublishReviewResult = { status: 'idle' };
