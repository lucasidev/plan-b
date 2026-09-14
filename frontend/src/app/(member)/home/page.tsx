import { redirect } from 'next/navigation';

/**
 * `/home` (histórico, US-231) se funde con Mis aportes: esta pantalla queda solo como
 * redirect para no romper links viejos. Vive adentro del guard de `(member)/layout.tsx`, así
 * que a quien no tiene sesión lo manda a `/sign-in` antes de llegar acá.
 */
export default function HomePage() {
  redirect('/reviews/mine');
}
