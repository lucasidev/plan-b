import { z } from 'zod';

/**
 * Schema de los campos de una materia (US-062 admin). Los rangos espejan las validaciones del
 * aggregate Subject del backend (`Subject.Validate`): code/name obligatorios (code max 40, name max
 * 200, columnas del data-model), yearInPlan 1-10, weeklyHours 0-40, totalHours positivo y al menos
 * la semanal, y el invariante term_kind/term_in_year (una materia anual nunca lleva número de
 * cuatrimestre o bimestre; cualquier otra cadencia sí, entre 1 y 6): feedback inmediato, el dominio
 * revalida (defensa en profundidad, no la única barrera).
 */

/**
 * Los límites numéricos, en un solo lugar. El schema los valida y el form los muestra en sus hints
 * (`subject-form.tsx`): antes cada hint repetía el rango a mano y quedaba mintiendo cuando el
 * dominio cambiaba, que es exactamente lo que pasó al permitir 0 hs semanales (el hint siguió
 * diciendo "entre 1 y 40" y nada falló, porque un texto no tiene quién lo verifique).
 *
 * El backend mantiene su propia copia (`Subject.Validate` + los validators): eso es defensa en
 * profundidad y va a seguir duplicado, son lenguajes distintos. Lo que no queremos duplicar es la
 * misma regla entre lo que el cliente valida y lo que el cliente dice que valida.
 */
export const SUBJECT_LIMITS = {
  code: { maxLength: 40 },
  name: { maxLength: 200 },
  yearInPlan: { min: 1, max: 10 },
  termInYear: { min: 1, max: 6 },
  weeklyHours: { min: 0, max: 40 },
  totalHours: { min: 1 },
  description: { maxLength: 500 },
} as const;

/** Vacío (campo opcional no completado) se colapsa a undefined antes de validar. */
const optionalTrimmed = (max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max, msg).optional(),
  );

export const subjectFieldsSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'El código es obligatorio.')
      .max(SUBJECT_LIMITS.code.maxLength, `Máximo ${SUBJECT_LIMITS.code.maxLength} caracteres.`),
    name: z
      .string()
      .trim()
      .min(1, 'El nombre es obligatorio.')
      .max(SUBJECT_LIMITS.name.maxLength, `Máximo ${SUBJECT_LIMITS.name.maxLength} caracteres.`),
    yearInPlan: z.coerce
      .number({ message: 'Ingresá un año de plan válido.' })
      .int('El año del plan tiene que ser un número entero.')
      .min(SUBJECT_LIMITS.yearInPlan.min, `Mínimo ${SUBJECT_LIMITS.yearInPlan.min}.`)
      .max(SUBJECT_LIMITS.yearInPlan.max, `Máximo ${SUBJECT_LIMITS.yearInPlan.max}.`),
    termKind: z.enum(['TwoMonth', 'FourMonth', 'SixMonth', 'FullYear'], {
      message: 'Elegí una cadencia.',
    }),
    termInYear: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.coerce
        .number({ message: 'Ingresá un cuatrimestre o bimestre válido.' })
        .int('Tiene que ser un número entero.')
        .min(SUBJECT_LIMITS.termInYear.min, `Mínimo ${SUBJECT_LIMITS.termInYear.min}.`)
        .max(SUBJECT_LIMITS.termInYear.max, `Máximo ${SUBJECT_LIMITS.termInYear.max}.`)
        .optional(),
    ),
    weeklyHours: z.coerce
      .number({ message: 'Ingresá una carga horaria semanal válida.' })
      .int('Tiene que ser un número entero.')
      // 0 es válido: hay materias con carga total pero sin carga semanal fija (Proyecto Final de
      // la TUDCS son 0 hs/sem y 350 totales, igual que prácticas profesionales y tesis).
      .min(SUBJECT_LIMITS.weeklyHours.min, 'No puede ser negativa.')
      .max(
        SUBJECT_LIMITS.weeklyHours.max,
        `Máximo ${SUBJECT_LIMITS.weeklyHours.max} horas semanales.`,
      ),
    totalHours: z.coerce
      .number({ message: 'Ingresá una carga horaria total válida.' })
      .int('Tiene que ser un número entero.')
      .min(SUBJECT_LIMITS.totalHours.min, 'Tiene que ser mayor a 0.'),
    description: optionalTrimmed(
      SUBJECT_LIMITS.description.maxLength,
      `Máximo ${SUBJECT_LIMITS.description.maxLength} caracteres.`,
    ),
  })
  .refine((v) => v.termKind !== 'FullYear' || v.termInYear === undefined, {
    message: 'Una materia anual no lleva número de cuatrimestre o bimestre.',
    path: ['termInYear'],
  })
  .refine((v) => v.termKind === 'FullYear' || v.termInYear !== undefined, {
    message: 'Elegí el cuatrimestre o bimestre de la materia.',
    path: ['termInYear'],
  })
  .refine((v) => v.totalHours >= v.weeklyHours, {
    message: 'La carga horaria total tiene que ser al menos la semanal.',
    path: ['totalHours'],
  });

export type SubjectFieldsValues = z.infer<typeof subjectFieldsSchema>;

/**
 * Schema de una correlativa (US-062 admin, panel de correlativas). `type` es el literal fijo del
 * contrato HTTP (ADR-0003: dos DAGs separados sobre las mismas materias, "para cursar" / "para
 * rendir"). El backend valida aciclicidad (409 cycle_detected) y que ambas materias sean del mismo
 * plan (400 cross_plan); acá solo se valida que los dos campos estén presentes.
 */
export const prerequisiteFieldsSchema = z.object({
  requiredSubjectId: z.string().trim().min(1, 'Elegí la materia correlativa.'),
  type: z.enum(['ToEnroll', 'ToTakeFinal'], { message: 'Elegí un tipo de correlativa.' }),
});

export type PrerequisiteFieldsValues = z.infer<typeof prerequisiteFieldsSchema>;
