import { AppShell } from '@/components/layout/app-shell';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { getSession } from '@/lib/session';

/**
 * Layout del route group `(planb)`: el catálogo y las fichas, que se leen sin cuenta. A
 * diferencia de `(member)/layout.tsx`, acá NO hay guard: `getSession()` se lee para decorar el
 * shell (mostrar Mis aportes y el avatar si hay sesión), nunca para exigirla.
 *
 * Mismo `AppShell` que `(member)`: leer y reseñar comparten un solo shell con sesión opcional
 * (antes el catálogo tenía su propio header mínimo, `CatalogTopbar`, separado del área
 * autenticada).
 *
 * `crumbs` es el parallel route `@crumbs` (US-129, US-147, SC-001, SC-005): las cuatro fichas
 * arman sus propias migas server-side con nombres reales, y todo lo demás cae al catch-all con las
 * migas genéricas de siempre. `(member)` no tiene este slot: su topbar sigue calculándolas de
 * `usePathname()`.
 */
export default async function PlanbLayout({
  children,
  crumbs,
}: {
  children: React.ReactNode;
  crumbs: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <>
      <OfflineBanner />
      <AppShell session={session} crumbsSlot={crumbs}>
        {children}
      </AppShell>
    </>
  );
}
