'use server';

import { z } from 'zod';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { AccessResult } from './types';

const inputSchema = z.discriminatedUnion('operation', [
  z.object({
    id: z.string().uuid(),
    operation: z.literal('suspend'),
    reason: z.string().trim().min(1).max(500),
  }),
  z.object({ id: z.string().uuid(), operation: z.literal('restore') }),
]);

export async function changeUserAccessAction(input: unknown): Promise<AccessResult> {
  const session = await getSession();
  if (session?.role !== 'admin')
    return { ok: false, message: 'No tenés permisos para gestionar usuarios.' };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: 'Indicá una cuenta válida y un motivo de hasta 500 caracteres.' };
  const data = parsed.data;
  try {
    const response = await apiFetchAuthenticated(
      `/api/identity/users/${data.id}/${data.operation}`,
      {
        method: 'POST',
        ...(data.operation === 'suspend'
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: data.reason }),
            }
          : {}),
      },
    );
    if (response.ok) return { ok: true };
    const messages: Record<number, string> = {
      400: 'Revisá el motivo de la suspensión.',
      401: 'Tu sesión expiró. Volvé a iniciar sesión.',
      403: 'Esta sección solo permite gestionar cuentas de alumnos.',
      404: 'La cuenta ya no está disponible.',
      409: 'El estado de la cuenta cambió. Actualizá la página.',
    };
    return {
      ok: false,
      message: messages[response.status] ?? 'No pudimos cambiar el acceso. Probá de nuevo.',
    };
  } catch {
    return { ok: false, message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }
}
