import { z } from 'zod';

/**
 * Mirrors the backend shape (GetMySettingsResponse / UpdateMySettingsRequest).
 * `language` and `theme` are string enums so the UI does not couple to the domain enum's
 * integer value; the backend parses them and returns 400 with a catalog of valid values
 * if the client sends something unexpected.
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
 * Partial PATCH: every field nullable. The UI sends only the one the user touched
 * (auto-save semantics). The backend validates that at least one field is non-null
 * (400 if everything is empty).
 */
export const settingsPatchSchema = settingsSchema.partial();

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
