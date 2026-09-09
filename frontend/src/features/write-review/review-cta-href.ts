import type { Session } from '@/lib/session';

const REVIEW_ENTRY_PATH = '/reviews/new';

/**
 * A dónde manda el CTA "reseñala" de una ficha pública (chair-facts, subject-facts,
 * career-facts). Sin sesión, directo al gate con el motivo (US-229): `/reviews/new` la
 * redirigiría igual el guard de `(member)`, pero sin decir para qué.
 */
export function reviewCtaHref(session: Session | null): string {
  return session ? REVIEW_ENTRY_PATH : `/sign-in?from=${encodeURIComponent(REVIEW_ENTRY_PATH)}`;
}
