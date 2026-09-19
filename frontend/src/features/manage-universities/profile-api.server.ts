import 'server-only';
import { apiFetch } from '@/lib/api-client';
import type { InstitutionProfile } from './profile-types';

export async function fetchInstitutionProfile(id: string): Promise<InstitutionProfile | null> {
  const response = await apiFetch(`/api/academic/universities/${encodeURIComponent(id)}/profile`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Institution profile failed: ${response.status}`);
  return response.json();
}
