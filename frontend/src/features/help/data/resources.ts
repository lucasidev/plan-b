/**
 * Resources linked from the Help page (US-073). In MVP the first three are placeholders
 * (no real destination) because they depend on separate USs:
 *  - "Guía rápida" (PDF) needs editorial + design for an onboarding PDF.
 *  - "Política de moderación" gets drafted when US-019 (report review) lands.
 *  - "Términos y privacidad" needs an actual legal review.
 *
 * The fourth ("Estado del servicio") could link to a future status page; while it does
 * not exist we render the inline ✓ from the mockup.
 */

export type ResourceLink = {
  label: string;
  href?: string;
  status?: 'ok' | 'pending';
};

export const HELP_RESOURCES: readonly ResourceLink[] = [
  { label: 'Guía rápida (PDF, 4 páginas)', status: 'pending' },
  { label: 'Política de moderación', status: 'pending' },
  { label: 'Términos y privacidad', status: 'pending' },
  { label: 'Estado del servicio', status: 'ok' },
] as const;

export const SUPPORT_EMAIL = 'hola@plan-b.app';
