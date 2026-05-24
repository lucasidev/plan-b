import { z } from 'zod';

/**
 * Espeja el shape del backend (GetMySettingsResponse / UpdateMySettingsRequest).
 * `language` y `theme` son enums string para no acoplar nuestro UI al integer del enum del
 * dominio; el backend los parsea y devuelve 400 con catálogo de valores válidos si el cliente
 * manda algo inesperado.
 */

export const LANGUAGES = ['EsRioplatense', 'EsNeutro', 'En'] as const;
export const THEMES = ['Auto', 'Light', 'Dark'] as const;

export type LanguageOption = (typeof LANGUAGES)[number];
export type ThemeOption = (typeof THEMES)[number];

export const settingsSchema = z.object({
  notificationsInApp: z.boolean(),
  notificationsEmail: z.boolean(),
  notifyReviewResponse: z.boolean(),
  notifyNewReviewInFollowed: z.boolean(),
  notifyAcademicCalendar: z.boolean(),
  notifyDraftPromotionNudge: z.boolean(),
  showDisplayNameInReviews: z.boolean(),
  allowTeacherContact: z.boolean(),
  language: z.enum(LANGUAGES),
  theme: z.enum(THEMES),
});

export type Settings = z.infer<typeof settingsSchema>;

/**
 * PATCH parcial: todo nullable. El UI manda solo el field que el user cambió (semántica
 * auto-save). El backend valida que al menos un field venga no-null (400 si todo vacío).
 */
export const settingsPatchSchema = settingsSchema.partial();

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
