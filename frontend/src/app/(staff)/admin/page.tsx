import { redirect } from 'next/navigation';

/**
 * Landing del backoffice. El dashboard de KPIs (US-081) todavía no aterrizó, así que por ahora
 * `/admin` redirige a la única vista real: la gestión de docentes (US-063).
 */
export default function AdminIndexPage() {
  redirect('/admin/teachers');
}
