import { describe, expect, it } from 'vitest';
import { reviewCtaHref } from './review-cta-href';

/**
 * US-229, E1: el CTA "reseñala" de una ficha pública sin sesión tiene que caer en el gate con
 * el motivo, no en `/reviews/new` (que el guard de `(member)` redirigiría igual, pero sin decir
 * para qué).
 */
describe('reviewCtaHref', () => {
  it('conserva materia y cátedra al pasar por el ingreso', () => {
    const selection = { subjectId: 'subject-1', chairId: 'chair-1' };
    expect(
      new URL(reviewCtaHref(null, selection) ?? '', 'https://planb.test').searchParams.get('from'),
    ).toBe('/reviews/new?subjectId=subject-1&chairId=chair-1');
  });

  it('no ofrece reseñar a un administrador', () => {
    expect(reviewCtaHref({ userId: 'admin', email: 'admin@test.com', role: 'admin' })).toBeNull();
  });
  it('sin sesión, manda al gate de Ingresar con el motivo de reseñar', () => {
    expect(reviewCtaHref(null)).toBe('/sign-in?from=%2Freviews%2Fnew');
  });

  it('con sesión, va directo a reseñar', () => {
    expect(reviewCtaHref({ userId: 'u-1', email: 'lucia@test.com', role: 'member' })).toBe(
      '/reviews/new',
    );
  });
});
