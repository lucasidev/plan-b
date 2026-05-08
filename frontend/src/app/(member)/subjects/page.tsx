import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/subjects` se consolidó en `/mi-carrera?tab=catalogo`
 * (US-045-a). Mantenemos la ruta para no romper bookmarks.
 */
export default function SubjectsRedirect() {
  redirect('/mi-carrera?tab=catalogo');
}
