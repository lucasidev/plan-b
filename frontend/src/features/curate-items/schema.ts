import { z } from 'zod';
import { OPTION_VALENCES } from '@/features/curation/schema';

/**
 * Las tres capas. Se reexportan desde el schema de la curaduría en vez de redefinirse: son el mismo
 * enum del backend, y dos listas del mismo enum se desincronizan el día que se agrega una capa.
 */
export { ITEM_LAYERS, OPTION_VALENCES } from '@/features/curation/schema';

const option = z.object({
  value: z.coerce.number().int().min(1),
  order: z.coerce.number().int().min(1),
  label: z.string().trim().min(1, 'Cada opción necesita su etiqueta.').max(80),
  valence: z.enum(OPTION_VALENCES),
});

const layer = z.enum(['Context', 'ChairConduct', 'StudentExperience']);

/** Editar una frase sin cortar su serie: el código no viaja porque no se toca. */
export const editItemSchema = z.object({
  text: z.string().trim().min(1, 'Escribí la pregunta.').max(200),
  help: z.string().trim().max(500).optional(),
  layer,
  options: z.array(option).min(2, 'Una pregunta necesita al menos dos opciones.'),
});

/** Abrir un código nuevo porque cambió lo que se pregunta. Acá el código sí es lo central. */
export const supersedeItemSchema = editItemSchema.extend({
  code: z
    .string()
    .trim()
    .min(1, 'La pregunta nueva necesita un código.')
    .max(60)
    .regex(/^[A-Za-z0-9_]+$/, 'El código lleva letras, números y guiones bajos.'),
});
