import { z } from 'zod';
import { CHAIR_MEMBER_ROLES } from './types';

/** El nombre lo limita el aggregate en 100; el schema repite el tope para no ir al servidor de gusto. */
export const createChairSchema = z.object({
  subjectId: z.string().uuid('Elegí una materia.'),
  name: z
    .string()
    .trim()
    .min(1, 'La cátedra necesita un nombre.')
    .max(100, 'El nombre no puede pasar de 100 caracteres.'),
});

export const addChairMemberSchema = z.object({
  chairId: z.string().uuid(),
  teacherId: z.string().uuid('Elegí un docente.'),
  role: z.enum(CHAIR_MEMBER_ROLES, { message: 'Elegí un rol.' }),
  // El período desde el que integra no es metadata: sin él, una ficha que publica reseñas de tres
  // años le atribuye al titular de hoy lo que se dictó antes de que llegara.
  sinceTermId: z.string().uuid('Elegí desde qué período integra.'),
});

export const closeChairMemberSchema = z.object({
  chairId: z.string().uuid(),
  teacherId: z.string().uuid(),
  untilTermId: z.string().uuid('Elegí hasta qué período integró.'),
});
