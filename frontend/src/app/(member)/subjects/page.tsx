import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/subjects` se consolidó en `/my-career?tab=catalogo`
 * (US-045-a). Mantenemos la ruta para no romper bookmarks.
 */
export default function SubjectsRedirect() {
  redirect('/my-career?tab=catalogo');
}
