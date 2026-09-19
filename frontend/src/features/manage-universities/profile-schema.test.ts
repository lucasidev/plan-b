import { describe, expect, it } from 'vitest';
import {
  academicUnitSchema,
  institutionFactSchema,
  institutionProfileSchema,
} from './profile-schema';

describe('US-234 institution profile schemas', () => {
  it('accepts an HTTP website and a complete location', () => {
    expect(
      institutionProfileSchema.safeParse({
        websiteUrl: 'https://universidad.edu.ar',
        address: 'Av. Central 100',
        province: 'Mendoza',
        localityText: 'Godoy Cruz',
      }).success,
    ).toBe(true);
  });

  it.each([
    ['ftp://universidad.edu.ar', 'Mendoza', 'Godoy Cruz'],
    ['https://user:secret@universidad.edu.ar', 'Mendoza', 'Godoy Cruz'],
    ['https://universidad.edu.ar', 'Mendoza', ''],
  ])('rejects an unsafe website or an incomplete location', (websiteUrl, province, localityText) => {
    expect(
      institutionProfileSchema.safeParse({ websiteUrl, address: '', province, localityText })
        .success,
    ).toBe(false);
  });

  it('requires every field needed to resolve an academic unit', () => {
    expect(
      academicUnitSchema.safeParse({
        name: 'Facultad de Ingeniería',
        slug: 'facultad-ingenieria',
        address: '',
        province: 'Tucumán',
        localityText: '',
      }).success,
    ).toBe(false);
  });

  it('requires value for Published and note for NotApplicable official facts', () => {
    const base = {
      field: 'students',
      unit: '',
      period: '',
      sourceName: 'Anuario',
      sourceUrl: 'https://example.edu.ar/anuario',
      sourceRetrievedAt: '2026-09-17',
      note: '',
    };
    expect(
      institutionFactSchema.safeParse({ ...base, status: 'Published', value: '' }).success,
    ).toBe(false);
    expect(
      institutionFactSchema.safeParse({ ...base, status: 'NotApplicable', value: '' }).success,
    ).toBe(false);
  });
});
