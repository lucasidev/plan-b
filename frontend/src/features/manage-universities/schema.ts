import { z } from 'zod';

/**
 * Schema de los campos de universidad (US-060 admin). Los límites espejan las columnas del
 * aggregate University del backend (name 200, slug 100, `UniversityConfiguration.HasMaxLength`).
 *
 * A diferencia del form de docentes, create y edit comparten exactamente el mismo shape: el
 * aggregate no tiene un campo inmutable post-alta (el slug se puede reeditar; `UpdateUniversityCommand`
 * revalida unicidad igual que el alta). El backend re-normaliza name/slug/dominios (trim + lowercase
 * + dedup) sin importar lo que llegue acá: esto es feedback inmediato + defensa en profundidad, no
 * la única barrera.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export const universityFieldsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200, 'Máximo 200 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio.')
    .max(100, 'Máximo 100 caracteres.')
    .refine(
      (v) => SLUG_PATTERN.test(v),
      'Solo minúsculas, números y guiones. Ej: unsta, utn-frba.',
    ),
  institutionalEmailDomains: z
    .array(
      z
        .string()
        .trim()
        .max(255, 'Máximo 255 caracteres.')
        .refine(
          (v) => DOMAIN_PATTERN.test(v),
          'Tiene que ser un dominio válido. Ej: unsta.edu.ar.',
        ),
    )
    .default([]),
});

export type UniversityFieldsValues = z.infer<typeof universityFieldsSchema>;
