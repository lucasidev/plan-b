import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Root `/`. Hoy redirige basado en session:
 *  - Hay session de member → `/home`
 *  - Cualquier otro caso (sin session, role distinto, session inválida) → `/auth`
 *
 * Cuando aterrice el catálogo público (US-001), esta página se reemplaza
 * por la landing real (universidades / carreras / materias browseables sin
 * auth) y el redirect a `/home` para users logueados se mueve al
 * `(public)/layout.tsx` o sigue acá pero solo en el caso autenticado.
 *
 * Por ahora: zero contenido propio. La aplicación tiene dos puertas: `/auth`
 * para visitors y `/home` para members. La raíz solo decide cuál.
 */
export default async function HomePage() {
  const session = await getSession();
  redirect(session?.role === 'member' ? '/home' : '/auth');
}
