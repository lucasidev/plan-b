/**
 * Un texto libre como lo lee el equipo (ADR-0084). No trae la cuenta de quien lo escribió, y esa
 * ausencia es el contrato: se lee lo que alguien escribió, no quién lo escribió.
 */
export type FreeText = {
  reviewId: string;
  subjectName: string;
  termLabel: string;
  chairName: string | null;
  text: string;
  writtenAt: string;
};

export type FreeTexts = {
  items: FreeText[];
  /** Cuántos hay en total, para saber cuánto queda sin traérselo todo. */
  total: number;
};

/** El estado del alta de una pregunta destilada, como lo lee la pantalla. */
export type DistilItemState =
  | { status: 'idle' }
  | { status: 'success'; code: string; instrumentVersion: number }
  | { status: 'error'; message: string };

export const initialDistilItemState: DistilItemState = { status: 'idle' };
