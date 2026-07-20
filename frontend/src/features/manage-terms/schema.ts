import { z } from 'zod';

/**
 * Schema de los campos de un período lectivo (US-064 admin). Los rangos y las reglas cross-field
 * espejan el aggregate AcademicTerm del backend (year 1..añoActual+20, number 1-6, un período anual
 * siempre es el número 1, `endDate` posterior a `startDate`, `enrollmentCloses` posterior a
 * `enrollmentOpens`): feedback inmediato, el dominio revalida (defensa en profundidad, no la única
 * barrera).
 *
 * `startDate`/`endDate` son el string "YYYY-MM-DD" que devuelve un `input type="date"` (matchea el
 * `DateOnly` del backend tal cual); `enrollmentOpens`/`enrollmentCloses` son "YYYY-MM-DDTHH:mm" de
 * un `input type="datetime-local"`, sin offset de huso horario. Los dos formatos son comparables
 * lexicográficamente, así que las reglas de orden cross-field comparan los strings directo en vez
 * de parsear a `Date`: evita cualquier conversión de huso horario entre el browser y el server
 * action (un `Date` armado desde un "YYYY-MM-DD" ancla a medianoche UTC y se corre de día al
 * formatearlo en un huso horario negativo, como Argentina).
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export const termFieldsSchema = z
  .object({
    year: z.coerce
      .number({ message: 'Ingresá un año válido.' })
      .int('El año tiene que ser un año entero.')
      .min(1, 'El año tiene que ser positivo.')
      // El tope se evalúa en cada validación (no al cargar el módulo), así el año actual no queda
      // congelado en un server de larga vida.
      .refine(
        (y) => y <= new Date().getFullYear() + 20,
        'El año no puede ser tan lejano en el futuro.',
      ),
    number: z.coerce
      .number({ message: 'Ingresá un número de período válido.' })
      .int('Tiene que ser un número entero.')
      .min(1, 'Mínimo 1.')
      .max(6, 'Máximo 6.'),
    kind: z.enum(['Bimestral', 'Cuatrimestral', 'Semestral', 'Anual'], {
      message: 'Elegí una cadencia.',
    }),
    startDate: z.string().trim().regex(DATE_RE, 'Ingresá una fecha de inicio válida.'),
    endDate: z.string().trim().regex(DATE_RE, 'Ingresá una fecha de fin válida.'),
    enrollmentOpens: z
      .string()
      .trim()
      .regex(DATETIME_LOCAL_RE, 'Ingresá una fecha y hora de apertura de inscripción válida.'),
    enrollmentCloses: z
      .string()
      .trim()
      .regex(DATETIME_LOCAL_RE, 'Ingresá una fecha y hora de cierre de inscripción válida.'),
  })
  .refine((v) => v.kind !== 'Anual' || v.number === 1, {
    message: 'Un período anual siempre es el número 1.',
    path: ['number'],
  })
  .refine((v) => v.endDate > v.startDate, {
    message: 'La fecha de fin tiene que ser posterior a la de inicio.',
    path: ['endDate'],
  })
  .refine((v) => v.enrollmentCloses > v.enrollmentOpens, {
    message: 'El cierre de inscripción tiene que ser posterior a la apertura.',
    path: ['enrollmentCloses'],
  });

export type TermFieldsValues = z.infer<typeof termFieldsSchema>;
