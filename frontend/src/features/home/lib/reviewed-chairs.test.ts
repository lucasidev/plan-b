import { describe, expect, it } from 'vitest';
import type { MyCourseReview } from '@/features/my-course-reviews/types';
import { groupByChair } from './reviewed-chairs';

function review(over: Partial<MyCourseReview>): MyCourseReview {
  return {
    id: crypto.randomUUID(),
    subjectId: 'sub-1',
    subjectName: 'Base de datos',
    subjectCode: 'BDD201',
    termId: 'term-1',
    termLabel: '2025-C2',
    chairId: 'chair-perez',
    chairName: 'Pérez',
    answeredItems: 14,
    answers: [],
    freeText: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('groupByChair', () => {
  it('una fila por cátedra, no por cursada', () => {
    const chairs = groupByChair([
      review({ chairId: 'a', chairName: 'Pérez' }),
      review({ chairId: 'a', chairName: 'Pérez' }),
      review({ chairId: 'b', chairName: 'Ruiz' }),
    ]);

    expect(chairs).toHaveLength(2);
    expect(chairs.find((c) => c.chairId === 'a')?.ownReviews).toBe(2);
  });

  it('muestra el período de la cursada reseñada más recientemente, no el primero de la lista', () => {
    const chairs = groupByChair([
      review({ termLabel: '2024-C1', createdAt: '2026-01-01T00:00:00Z' }),
      review({ termLabel: '2025-C2', createdAt: '2026-06-01T00:00:00Z' }),
    ]);

    expect(chairs[0].termLabel).toBe('2025-C2');
  });

  it('la reseña sin cátedra no produce fila: no hay sujeto del que decir si publica', () => {
    const chairs = groupByChair([
      review({ chairId: null, chairName: null }),
      review({ chairId: 'b', chairName: 'Ruiz' }),
    ]);

    expect(chairs).toHaveLength(1);
    expect(chairs[0].chairName).toBe('Ruiz');
  });

  it('las voces quedan en null y nunca en cero: la cátedra puede tener doce', () => {
    const chairs = groupByChair([review({})]);

    expect(chairs[0].voices).toBeNull();
  });

  it('ordena alfabéticamente por cátedra, no por lo que devuelva el endpoint', () => {
    const chairs = groupByChair([
      review({ chairId: 'c', chairName: 'Quiroga' }),
      review({ chairId: 'a', chairName: 'Álvarez' }),
      review({ chairId: 'b', chairName: 'Pérez' }),
    ]);

    expect(chairs.map((c) => c.chairName)).toEqual(['Álvarez', 'Pérez', 'Quiroga']);
  });

  it('sin reseñas devuelve lista vacía, para que la pantalla decida no dibujar nada', () => {
    expect(groupByChair([])).toEqual([]);
  });
});
