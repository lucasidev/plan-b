import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/api-client.server', () => ({ apiFetchAuthenticated: vi.fn() }));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { saveAcademicUnit, saveInstitutionFact, saveInstitutionProfile } from './profile-actions';

const id = '11111111-1111-4111-a111-111111111111';
const idle = { status: 'idle' as const };
const input = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ universityId: id, ...values })) data.set(key, value);
  return data;
};
const location = { address: 'Av. Central 100', province: 'Mendoza', localityText: 'Godoy Cruz' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: id,
    email: 'admin@planb.local',
    role: 'admin',
  });
  vi.mocked(apiFetchAuthenticated).mockResolvedValue(new Response(null, { status: 200 }));
});

describe('institution profile writes', () => {
  it('preserves localityText in the request when editing an academic unit', async () => {
    const result = await saveAcademicUnit(
      idle,
      input({ ...location, name: 'Facultad', slug: 'facultad', unitId: id }),
    );
    expect(result.status).toBe('success');
    expect(apiFetchAuthenticated).toHaveBeenCalledWith(
      `/api/academic/universities/${id}/units/${id}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Facultad', slug: 'facultad', ...location }),
      }),
    );
  });

  it('does not write with an expired session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(
      (
        await saveInstitutionProfile(
          idle,
          input({ ...location, websiteUrl: 'https://example.edu.ar' }),
        )
      ).status,
    ).toBe('error');
    expect(apiFetchAuthenticated).not.toHaveBeenCalled();
  });

  it('does not send a stale value when marking an official fact as not published', async () => {
    const result = await saveInstitutionFact(
      idle,
      input({
        field: 'students',
        status: 'NotPublished',
        value: '1200',
        unit: '',
        period: '2025',
        sourceName: 'Anuario',
        sourceUrl: `https://example.edu.ar/${'a'.repeat(550)}`,
        sourceRetrievedAt: '2026-09-17',
        note: '',
      }),
    );
    expect(result.status).toBe('success');
    const body = JSON.parse(vi.mocked(apiFetchAuthenticated).mock.calls[0][1]?.body as string);
    expect(body).toMatchObject({
      subjectType: 'Institution',
      subjectId: id,
      value: null,
      status: 'NotPublished',
      sourceRetrievedAt: '2026-09-17T12:00:00Z',
    });
  });
});
