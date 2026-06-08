/**
 * Report reasons (US-019). The value is the backend enum string sent in the request; the
 * label + hint are the Spanish UI copy from the report modal mockup. Five reasons, no
 * "otro" bucket (matches the mockup, the source of truth).
 */
export type ReportReasonOption = {
  value: 'OffTopic' | 'DatosPersonales' | 'LenguajeInapropiado' | 'Difamacion' | 'Spam';
  label: string;
  hint: string;
};

export const REPORT_REASONS: readonly ReportReasonOption[] = [
  {
    value: 'OffTopic',
    label: 'No es sobre la cursada',
    hint: 'Habla de cosas que no son la materia o el docente.',
  },
  {
    value: 'DatosPersonales',
    label: 'Datos personales',
    hint: 'Identifica a un alumno o expone información privada.',
  },
  {
    value: 'LenguajeInapropiado',
    label: 'Lenguaje ofensivo',
    hint: 'Insultos, discriminación o ataques personales.',
  },
  {
    value: 'Difamacion',
    label: 'Información falsa',
    hint: 'Datos verificablemente incorrectos sobre la cursada.',
  },
  {
    value: 'Spam',
    label: 'Spam o promoción',
    hint: 'Promociona algo ajeno a la materia.',
  },
] as const;

/** Minimal data the modal needs: the review id to report.  */
export type ReportableReview = {
  id: string;
};

export type ReportReviewResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const REPORT_REVIEW_INITIAL_STATE: ReportReviewResult = { status: 'idle' };
