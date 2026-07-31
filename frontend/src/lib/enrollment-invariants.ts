import { z } from 'zod';

/**
 * Las invariantes cross-field de una cursada, en un solo lugar.
 *
 * Vive en `lib/` y no adentro de un feature porque tiene dos consumidores reales: el alta
 * (`add-enrollment`, US-013-f) y la edición (`edit-enrollment`, US-015-f). Es el mismo movimiento
 * que hizo el backend cuando llegó la edición: `EnrollmentRecord.Create` y `EnrollmentRecord.Update`
 * comparten un único `ValidateInvariants`, porque una regla que valga distinto en el alta que en la
 * edición sería un bug, no una diferencia.
 *
 * El backend sigue siendo la fuente de verdad: esto solo evita disparar requests imposibles y le
 * pone el mensaje al lado del campo que lo causó.
 */

export const ENROLLMENT_STATUS_VALUES = [
  'Passed',
  'Regularized',
  'InProgress',
  'Failed',
  'Dropped',
] as const;

export const APPROVAL_METHOD_VALUES = [
  'Coursework',
  'Promotion',
  'FinalExam',
  'IndependentFinalExam',
  'CreditTransfer',
] as const;

/**
 * Los cinco campos editables de una cursada. La materia queda afuera a propósito: es parte del alta
 * y no se puede cambiar después (el PATCH del backend tampoco la acepta), así que cada schema la
 * agrega por su cuenta si le corresponde.
 */
export const enrollmentAcademicStateShape = {
  commissionId: z.string().uuid().optional().nullable(),
  termId: z.string().uuid().optional().nullable(),
  status: z.enum(ENROLLMENT_STATUS_VALUES, { message: 'Elegí un estado válido.' }),
  approvalMethod: z.enum(APPROVAL_METHOD_VALUES).optional().nullable(),
  grade: z.coerce
    .number()
    .min(0, { message: 'La nota debe ser >= 0.' })
    .max(10, { message: 'La nota debe ser <= 10.' })
    .optional()
    .nullable(),
};

export type EnrollmentAcademicState = {
  commissionId?: string | null;
  termId?: string | null;
  status: (typeof ENROLLMENT_STATUS_VALUES)[number];
  approvalMethod?: (typeof APPROVAL_METHOD_VALUES)[number] | null;
  grade?: number | null;
};

type Invariant = {
  holds: (state: EnrollmentAcademicState) => boolean;
  message: string;
  /** Campo al que se le cuelga el error. Los consumidores lo usan para ubicarlo en el form. */
  path: string;
};

/**
 * El orden importa: los actions reportan `issues[0]`, así que el primero que falle es el que ve el
 * alumno. Van de lo más específico del estado elegido a lo más específico del método.
 */
const ENROLLMENT_INVARIANTS: readonly Invariant[] = [
  {
    holds: (d) => d.status !== 'Passed' || !!d.approvalMethod,
    message: 'Aprobada requiere forma de aprobación.',
    path: 'approvalMethod',
  },
  {
    holds: (d) => !(d.status === 'Passed' || d.status === 'Regularized') || d.grade != null,
    message: 'La nota es obligatoria.',
    path: 'grade',
  },
  {
    holds: (d) => d.status !== 'InProgress' || !!d.termId,
    message: 'Indicá el cuatrimestre.',
    path: 'termId',
  },
  {
    holds: (d) => d.approvalMethod !== 'CreditTransfer' || (!d.commissionId && !d.termId),
    message: 'Equivalencia no lleva comisión ni cuatrimestre.',
    path: 'approvalMethod',
  },
  {
    holds: (d) => d.approvalMethod !== 'IndependentFinalExam' || (!d.commissionId && !!d.termId),
    message: 'Final libre requiere cuatrimestre sin comisión.',
    path: 'approvalMethod',
  },
];

/**
 * Pasa como `superRefine` de cualquier schema que tenga los cinco campos. Un `superRefine` y no
 * cinco `.refine()` encadenados por una razón práctica: encadenar sobre un shape que cada feature
 * arma distinto obliga a envolver el schema en cada paso, y acá lo único que cambia entre features
 * son los campos de más, no las reglas.
 */
export function checkEnrollmentInvariants(
  state: EnrollmentAcademicState,
  ctx: z.RefinementCtx,
): void {
  for (const invariant of ENROLLMENT_INVARIANTS) {
    if (invariant.holds(state)) continue;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: invariant.message,
      path: [invariant.path],
    });
  }
}
