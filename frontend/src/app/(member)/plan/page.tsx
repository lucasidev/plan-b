import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/plan` se consolidó en `/mi-carrera?tab=plan` (US-045-a).
 * Mantenemos la ruta para no romper bookmarks. Cuando confirmemos que no
 * hay tráfico residual, borramos este file.
 */
export default function PlanRedirect() {
  redirect('/mi-carrera?tab=plan');
}
