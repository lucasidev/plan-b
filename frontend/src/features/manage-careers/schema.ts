import { z } from 'zod';

/**
 * Schema de los campos de carrera (US-061 admin). Los límites espejan las columnas del aggregate
 * Career del backend (name 200, slug 120, short_name 100, code 40, description 500). Create y edit
 * comparten el shape: el aggregate no tiene campos inmutables post-alta (UpdateCareerCommand
 * revalida unicidad igual que el alta).
 *
 * Los campos académicos son opcionales. degreeType/cadence viajan como string y el backend los
 * parsea a enum (rechaza con 400 si el valor no matchea, ver CareerEnumParsing); acá el enum de Zod
 * da feedback inmediato con las mismas opciones que el form ofrece. El backend re-normaliza
 * name/slug (trim + lowercase el slug): esto es feedback + defensa en profundidad, no la única barrera.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Vacío (campo opcional no completado) se colapsa a undefined antes de validar. */
const optionalTrimmed = (max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max, msg).optional(),
  );

export const careerFieldsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200, 'Máximo 200 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio.')
    .max(120, 'Máximo 120 caracteres.')
    .refine((v) => SLUG_PATTERN.test(v), 'Solo minúsculas, números y guiones. Ej: ing-sistemas.'),
  shortName: optionalTrimmed(100, 'Máximo 100 caracteres.'),
  code: optionalTrimmed(40, 'Máximo 40 caracteres.'),
  degreeType: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.enum(['Grado', 'Posgrado', 'Tecnicatura']).optional(),
  ),
  durationYears: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.coerce
      .number({ message: 'Ingresá un número de años válido.' })
      .int('Tienen que ser años enteros.')
      .min(1, 'Mínimo 1 año.')
      .max(15, 'Máximo 15 años.')
      .optional(),
  ),
  cadence: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.enum(['Anual', 'Cuatrimestral', 'Semestral']).optional(),
  ),
  description: optionalTrimmed(500, 'Máximo 500 caracteres.'),
});

export type CareerFieldsValues = z.infer<typeof careerFieldsSchema>;

/**
 * Schema del alta de un plan de estudios (US-061). `year` es la clave de unicidad por carrera
 * (UNIQUE(career_id, year)); `label` es una etiqueta editorial opcional (ej. "plan-2023").
 */
export const planFieldsSchema = z.object({
  year: z.coerce
    .number({ message: 'Ingresá un año válido.' })
    .int('El año tiene que ser entero.')
    .min(1950, 'Año demasiado antiguo.')
    // refine (no .max fijo): el tope se evalúa en cada validación, no al cargar el módulo, así el
    // año actual no queda congelado en un server de larga vida. Es feedback; el dominio revalida.
    .refine((y) => y <= new Date().getFullYear(), 'El plan no puede ser de un año futuro.'),
  label: optionalTrimmed(60, 'Máximo 60 caracteres.'),
});

export type PlanFieldsValues = z.infer<typeof planFieldsSchema>;
