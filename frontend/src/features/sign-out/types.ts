/**
 * Estado del action de cerrar sesión. Existe por la misma razón que en el resto de los flujos:
 * el action es una mutación pura y la navegación la hace el cliente (ADR-0046). No tiene variante
 * de error a propósito: la revocación del refresh token es best-effort y las cookies locales se
 * borran igual, así que desde el punto de vista del usuario cerrar sesión no falla.
 */
export type SignOutState = { status: 'idle' } | { status: 'success'; redirectTo: string };

export const initialSignOutState: SignOutState = { status: 'idle' };
