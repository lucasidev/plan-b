/**
 * Recursos linkeados desde la página Ayuda (US-073). En MVP los 3 primeros son placeholders
 * (sin destino real) porque dependen de US separadas:
 *  - Guía rápida (PDF) requiere editorial + diseño de un PDF onboarding.
 *  - Política de moderación se redacta cuando aterrice US-019 (reportar reseña).
 *  - Términos y privacidad necesita revisión legal real.
 *
 * El cuarto ("Estado del servicio") podría linkear a un futuro status page; mientras no
 * exista mostramos el ✓ inline del mockup.
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
