import { describe, expect, it } from 'vitest';
import type { CareerCoverage } from '@/features/browse-catalog';
import { describeCareerReviews } from './describe-institution-careers';

function coverage(overrides: Partial<CareerCoverage> = {}): CareerCoverage {
  return {
    careerId: 'career-1',
    careerName: 'Carrera',
    universityId: 'unsta',
    universityName: 'UNSTA',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: null,
    ...overrides,
  };
}

describe('describeCareerReviews', () => {
  it('con voces publicadas, dice cuántas reseñas (singular y plural)', () => {
    expect(describeCareerReviews(coverage({ voiceCount: 1 }))).toBe('1 reseña');
    expect(describeCareerReviews(coverage({ voiceCount: 412 }))).toBe('412 reseñas');
  });

  it('sin voces publicadas pero con carga bajo el piso, dice "con reseñas"', () => {
    expect(describeCareerReviews(coverage({ voiceCount: 0, hasReviewsBelowFloor: true }))).toBe(
      'con reseñas',
    );
  });

  it('sin ninguna señal, no dice nada', () => {
    expect(
      describeCareerReviews(coverage({ voiceCount: 0, hasReviewsBelowFloor: false })),
    ).toBeNull();
  });

  it('sin cobertura para esa carrera, no dice nada', () => {
    expect(describeCareerReviews(undefined)).toBeNull();
  });
});
