import { env } from '@/lib/env';

/**
 * Thin fetch wrapper around the backend API.
 * Used from Server Actions and from feature api.ts for TanStack Query fetchers.
 */
export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${env.NEXT_PUBLIC_API_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  return response;
}
