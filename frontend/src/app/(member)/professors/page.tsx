import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/professors` se consolidó en `/mi-carrera?tab=docentes`
 * (US-045-a). Mantenemos la ruta para no romper bookmarks.
 */
export default function ProfessorsRedirect() {
  redirect('/mi-carrera?tab=docentes');
}
