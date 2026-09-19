import { z } from 'zod';
import {
  OFFICIAL_FACT_FIELDS,
  OFFICIAL_FACT_LABELS,
} from '@/components/facts/official-fact-fields';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
      } catch {
        return false;
      }
    }, 'Ingresá una URL completa HTTP o HTTPS.')
    .transform((v) => v || null);

export const institutionProfileSchema = z
  .object({
    websiteUrl: httpUrl(500),
    address: optionalText(300),
    province: optionalText(80),
    localityText: optionalText(80),
  })
  .refine((v) => Boolean(v.province) === Boolean(v.localityText), {
    message: 'Completá provincia y localidad juntas.',
  });

export const academicUnitSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre.').max(200),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Revisá el slug.'),
  address: z.string().trim().min(1, 'Ingresá la dirección.').max(300),
  province: z.string().trim().min(1, 'Ingresá la provincia.').max(80),
  localityText: z.string().trim().min(1, 'Ingresá la localidad.').max(80),
});

export const institutionFactFields: Record<string, string> = Object.fromEntries(
  [
    OFFICIAL_FACT_FIELDS.institutionType,
    OFFICIAL_FACT_FIELDS.students,
    OFFICIAL_FACT_FIELDS.graduates,
    OFFICIAL_FACT_FIELDS.minutesPublished,
    OFFICIAL_FACT_FIELDS.budgetPublished,
    OFFICIAL_FACT_FIELDS.staffRosterPublished,
    OFFICIAL_FACT_FIELDS.interimShare,
    OFFICIAL_FACT_FIELDS.institutionalEvaluation,
    OFFICIAL_FACT_FIELDS.agnAudit,
  ].map((field) => [field, OFFICIAL_FACT_LABELS[field]]),
);

export const institutionFactSchema = z
  .object({
    field: z.string().refine((v) => Object.hasOwn(institutionFactFields, v), 'Elegí un dato.'),
    status: z.enum(['Published', 'NotPublished', 'Requested', 'NotApplicable']),
    value: optionalText(2000),
    unit: optionalText(20),
    period: optionalText(120),
    sourceName: z.string().trim().min(1, 'Ingresá la fuente.').max(200),
    sourceUrl: httpUrl(2000).refine(
      (v) => Boolean(v),
      'Ingresá la URL de la fuente (hasta 2000 caracteres).',
    ),
    sourceRetrievedAt: z.string().date('Ingresá la fecha de consulta.'),
    note: optionalText(1000),
  })
  .refine((v) => v.status !== 'Published' || Boolean(v.value), {
    message: 'Un dato publicado necesita un valor.',
  })
  .refine((v) => v.status !== 'NotApplicable' || Boolean(v.note), {
    message: 'Explicá por qué no aplica.',
  });
