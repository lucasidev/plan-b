/**
 * Lo que una cuenta aportó, como lo ve su autor (US-165, US-166).
 *
 * Es el único lugar del producto donde una reseña se muestra de a una: todo lo que se publica es
 * agregado, y la ficha nunca muestra una reseña individual ni siquiera anónima (ADR-0083).
 */
export type MyCourseReview = {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  termId: string;
  termLabel: string;
  chairId: string | null;
  chairName: string | null;
  answeredItems: number;
  answers: MyAnswer[];
  freeText: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Estado de los dos actions de esta pantalla. */
/**
 * Una respuesta propia. Solo la ve quien la escribió: que nadie más pueda ver una respuesta
 * individual es la garantía del producto, y que su autor sí es lo que hace posible corregir una
 * sola sin recontestar todo.
 */
export type MyAnswer = {
  itemCode: string;
  optionValue: number;
};

export type ActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialActionState: ActionState = { status: 'idle' };
