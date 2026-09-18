import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminUserPage } from './types';

export async function fetchUsersServer(
  search: string,
  status: string,
  page: number,
): Promise<AdminUserPage> {
  const params = new URLSearchParams({ search, status, page: String(page) });
  const response = await apiFetchAuthenticated(`/api/identity/users?${params}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`User list failed with ${response.status}`);
  return response.json();
}
