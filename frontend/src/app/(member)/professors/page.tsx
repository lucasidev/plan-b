import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/professors` se consolidó en `/my-career?tab=teachers`
 * (US-045-a). Mantenemos la ruta para no romper bookmarks.
 */
export default function ProfessorsRedirect() {
  redirect('/my-career?tab=teachers');
}
