import { redirect } from 'next/navigation';

/**
 * Root `/`. Siempre redirige a `/home`.
 *
 * El guard del route group `(member)/layout.tsx` se encarga del caso "no
 * hay sesión" mandando a `/auth`, así que esta página no necesita leer la
 * session: una sola decisión, un solo target.
 *
 * Cuando aterrice el catálogo público (US-001), `/` se va a convertir en
 * la landing real (universidades / carreras / materias browseables sin
 * auth) y el redirect a `/home` para members se mueve al
 * `(public)/layout.tsx` o se gestiona condicionalmente acá según la
 * sesión.
 */
export default function HomePage() {
  redirect('/home');
}
