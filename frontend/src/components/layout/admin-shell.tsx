import { AdminSidebar, type BackofficeRole } from './admin-sidebar';
import { AdminTopbar } from './admin-topbar';

/**
 * Chrome del área `(staff)/admin` (port de `admin-shell.jsx::AdmShell`). Registro admin del design
 * system: sidebar denso 220px + topbar 46px con breadcrumbs + área de contenido scrollable. Mismo
 * design system que el alumno, más denso (tipografía chica, tablas, mono para ids).
 *
 * Server component: recibe el email + rol de la sesión (leídos en el layout RSC) y compone los bloques.
 * El rol decide qué links del sidebar van vivos (admin ve todo; moderador solo moderación). La
 * interactividad vive en los hijos (AdminSidebar / AdminTopbar marcan `'use client'`).
 */
export function AdminShell({
  email,
  role,
  children,
}: {
  email: string;
  role: BackofficeRole;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid bg-bg text-ink"
      style={{ gridTemplateColumns: '220px 1fr', height: '100vh', overflow: 'hidden' }}
    >
      <AdminSidebar email={email} role={role} />
      <div className="flex flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
