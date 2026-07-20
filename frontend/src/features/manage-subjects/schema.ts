import { z } from 'zod';

/**
 * Schema de los campos de una materia (US-062 admin). Los rangos espejan las validaciones del
 * aggregate Subject del backend (`Subject.Validate`): code/name obligatorios (code max 40, name max
 * 200, columnas del data-model), yearInPlan 1-10, weeklyHours 1-40, totalHours positivo y al menos
 * la semanal, y el invariante term_kind/term_in_year (una materia anual nunca lleva número de
 * cuatrimestre o bimestre; cualquier otra cadencia sí, entre 1 y 6): feedback inmediato, el dominio
 * revalida (defensa en profundidad, no la única barrera).
 */

/** Vacío (campo opcional no completado) se colapsa a undefined antes de validar. */
const optionalTrimmed = (max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max, msg).optional(),
  );

export const subjectFieldsSchema = z
  .object({
    code: z.string().trim().min(1, 'El código es obligatorio.').max(40, 'Máximo 40 caracteres.'),
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200, 'Máximo 200 caracteres.'),
    yearInPlan: z.coerce
      .number({ message: 'Ingresá un año de plan válido.' })
      .int('El año del plan tiene que ser un número entero.')
      .min(1, 'Mínimo 1.')
      .max(10, 'Máximo 10.'),
    termKind: z.enum(['Bimestral', 'Cuatrimestral', 'Semestral', 'Anual'], {
      message: 'Elegí una cadencia.',
    }),
    termInYear: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.coerce
        .number({ message: 'Ingresá un cuatrimestre o bimestre válido.' })
        .int('Tiene que ser un número entero.')
        .min(1, 'Mínimo 1.')
        .max(6, 'Máximo 6.')
        .optional(),
    ),
    weeklyHours: z.coerce
      .number({ message: 'Ingresá una carga horaria semanal válida.' })
      .int('Tiene que ser un número entero.')
      .min(1, 'Mínimo 1 hora semanal.')
      .max(40, 'Máximo 40 horas semanales.'),
    totalHours: z.coerce
      .number({ message: 'Ingresá una carga horaria total válida.' })
      .int('Tiene que ser un número entero.')
      .min(1, 'Tiene que ser mayor a 0.'),
    description: optionalTrimmed(500, 'Máximo 500 caracteres.'),
  })
  .refine((v) => v.termKind !== 'Anual' || v.termInYear === undefined, {
    message: 'Una materia anual no lleva número de cuatrimestre o bimestre.',
    path: ['termInYear'],
  })
  .refine((v) => v.termKind === 'Anual' || v.termInYear !== undefined, {
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
  type: z.enum(['ParaCursar', 'ParaRendir'], { message: 'Elegí un tipo de correlativa.' }),
});

export type PrerequisiteFieldsValues = z.infer<typeof prerequisiteFieldsSchema>;
