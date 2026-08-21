import { z } from 'zod';

/**
 * Schema de los campos de una comisión (US-093 admin). Los límites espejan el aggregate `Commission`
 * del backend (`Commission.Validate`): nombre obligatorio (max 100), cupo opcional positivo, notas
 * opcionales (max 2000). `subjectId`/`termId` no viven acá: viajan aparte (el subject en la URL del
 * POST de alta, inmutables en la edición), no son campos del form que se repitan entre create/edit.
 *
 * Docentes y horario son opcionales (una comisión sin docentes o sin horario cargado todavía es un
 * estado válido, `Commission.ReplaceSchedule`/`AssignTeacher`). Por bloque horario solo se valida lo
 * que puede chequearse sin I/O (día + "HH:mm" válidos y fin posterior al inicio): la unicidad de
 * docente, el límite de un titular y el solape entre bloques son invariantes cross-entidad que
 * valida el aggregate (409 teacher_already_assigned / titular_already_assigned / schedule_overlap),
 * no el form.
 */

export const COMMISSION_MODALITIES = ['Presencial', 'Virtual', 'Hibrida'] as const;
export type CommissionModality = (typeof COMMISSION_MODALITIES)[number];
export const COMMISSION_MODALITY_LABELS: Record<CommissionModality, string> = {
  Presencial: 'Presencial',
  Virtual: 'Virtual',
  Hibrida: 'Híbrida',
};

/** Espeja CommissionTeacherRole. Labels según el glosario (docs/product/language.md). */
export const COMMISSION_TEACHER_ROLES = [
  'Lead',
  'Associate',
  'PracticalLead',
  'Assistant',
  'Guest',
] as const;
export type CommissionTeacherRole = (typeof COMMISSION_TEACHER_ROLES)[number];
export const COMMISSION_TEACHER_ROLE_LABELS: Record<CommissionTeacherRole, string> = {
  Lead: 'Titular',
  Associate: 'Adjunto',
  PracticalLead: 'JTP',
  Assistant: 'Ayudante',
  Guest: 'Invitado',
};

/** Espeja DayOfWeek del backend (nombre en inglés). Orden Lunes a Domingo para selects y display. */
export const COMMISSION_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export type CommissionDay = (typeof COMMISSION_DAYS)[number];
export const COMMISSION_DAY_LABELS: Record<CommissionDay, string> = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};
/** Abreviatura de dos letras para el horario compacto de la tabla, agrupado por rango horario. */
export const COMMISSION_DAY_ABBREVIATIONS: Record<CommissionDay, string> = {
  Monday: 'Lu',
  Tuesday: 'Ma',
  Wednesday: 'Mi',
  Thursday: 'Ju',
  Friday: 'Vi',
  Saturday: 'Sá',
  Sunday: 'Do',
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Vacío (campo opcional no completado) se colapsa a undefined antes de validar. */
const optionalTrimmed = (max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max, msg).optional(),
  );

const optionalPositiveInt = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.coerce
      .number({ message: msg })
      .int('Tiene que ser un número entero.')
      .positive('Tiene que ser mayor a cero.')
      .optional(),
  );

export const commissionTeacherSchema = z.object({
  teacherId: z.string().uuid('Elegí un docente válido.'),
  role: z.enum(COMMISSION_TEACHER_ROLES, { message: 'Elegí un rol.' }),
});

export const commissionScheduleBlockSchema = z
  .object({
    day: z.enum(COMMISSION_DAYS, { message: 'Elegí un día.' }),
    start: z.string().regex(TIME_RE, 'Ingresá un horario de inicio válido (HH:mm).'),
    end: z.string().regex(TIME_RE, 'Ingresá un horario de fin válido (HH:mm).'),
  })
  .refine((v) => v.end > v.start, {
    message: 'El horario de fin tiene que ser posterior al de inicio.',
    path: ['end'],
  });

export const commissionFieldsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  modality: z.enum(COMMISSION_MODALITIES, { message: 'Elegí una modalidad.' }),
  capacity: optionalPositiveInt('Ingresá un cupo válido.'),
  notes: optionalTrimmed(2000, 'Máximo 2000 caracteres.'),
  teachers: z.array(commissionTeacherSchema).default([]),
  schedule: z.array(commissionScheduleBlockSchema).default([]),
});

export type CommissionFieldsValues = z.infer<typeof commissionFieldsSchema>;
