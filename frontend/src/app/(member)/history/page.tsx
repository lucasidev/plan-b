import { redirect } from 'next/navigation';

/**
 * Legacy redirect: `/history` se consolidó en `/mi-carrera?tab=historial`
 * (US-045-a). Mantenemos la ruta para no romper bookmarks.
 */
export default function HistoryRedirect() {
  redirect('/mi-carrera?tab=historial');
}
