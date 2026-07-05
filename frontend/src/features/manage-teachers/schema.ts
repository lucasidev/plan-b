import { z } from 'zod';

/**
 * Schema compartido de los campos del docente (US-063 admin). Los límites espejan el aggregate
 * Teacher del backend (nombres 100, título 100, bio 2000, photoUrl 500). Lo usa el server action
 * para validar; el backend revalida igual (defensa en profundidad).
 *
 * Opcionales: string vacío se acepta y el backend lo interpreta como "limpiar el campo" (el form de
 * edición hace un replace completo). photoUrl vacío o una URL http(s) válida (opción A: se pega una
 * URL, el upload de archivos es una US aparte).
 */
const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres.`).optional().default('');

const photoUrl = z
  .string()
  .trim()
  .max(500, 'Máximo 500 caracteres.')
  .refine(
    (v) => v === '' || /^https?:\/\/.+/i.test(v),
    'Tiene que ser una URL que empiece con http:// o https://.',
  )
  .optional()
  .default('');

const nameField = (label: string) =>
  z.string().trim().min(1, `El ${label} es obligatorio.`).max(100, 'Máximo 100 caracteres.');

/** Campos comunes a alta y edición. */
export const teacherFieldsSchema = z.object({
  firstName: nameField('nombre'),
  lastName: nameField('apellido'),
  title: optionalText(100),
  bio: optionalText(2000),
  photoUrl,
});

/** El alta suma la universidad (en la edición es inmutable, no se manda). */
export const createTeacherSchema = teacherFieldsSchema.extend({
  universityId: z.string().uuid('Elegí una universidad.'),
});

export type TeacherFieldsValues = z.infer<typeof teacherFieldsSchema>;
