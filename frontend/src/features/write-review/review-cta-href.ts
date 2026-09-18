import type { Session } from '@/lib/session';

const REVIEW_ENTRY_PATH = '/reviews/new';

/**
 * A dónde manda el CTA "reseñala" de una ficha pública (chair-facts, subject-facts,
 * career-facts). Sin sesión, directo al gate con el motivo (US-229): `/reviews/new` la
 * redirigiría igual el guard de `(member)`, pero sin decir para qué.
 */
export function reviewCtaHref(
  session: Session | null,
  selection?: { subjectId: string; chairId: string },
): string | null {
  if (session && session.role !== 'member') return null;
  const path = selection
    ? `${REVIEW_ENTRY_PATH}?${new URLSearchParams(selection)}`
    : REVIEW_ENTRY_PATH;
  return session ? path : `/sign-in?from=${encodeURIComponent(path)}`;
}
