import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { CommissionTeacherOption } from './types';

/**
 * Server fetcher of the teachers assigned to a commission (US-065). The write-review page uses it
 * to populate the "who taught you" picker: the student reviews one real teacher of the enrollment's
 * commission. Public endpoint; returns an empty list if the commission has no teachers loaded.
 */
export async function fetchCommissionTeachersServer(
  commissionId: string,
): Promise<CommissionTeacherOption[]> {
  const response = await apiFetchAuthenticated(
    `/api/academic/commissions/${commissionId}/teachers`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Commission teachers fetch failed: ${response.status}`);
  }
  return (await response.json()) as CommissionTeacherOption[];
}
