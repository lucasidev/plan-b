import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/history` se consolidó en `/my-career?tab=historial`
 * (US-045-a). Mantenemos la ruta para no romper bookmarks.
 */
export default function HistoryRedirect() {
  redirect('/my-career?tab=historial');
}
