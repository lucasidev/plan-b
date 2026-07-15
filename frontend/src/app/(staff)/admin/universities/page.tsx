import Link from 'next/link';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { UniversityTable } from '@/features/manage-universities';
import { fetchAdminUniversitiesServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Listado del backoffice de universidades (US-060 admin). RSC: fetch server-side (gateado a rol
 * admin) + render de la tabla client. Las mutaciones refrescan esta RSC vía router.refresh()
 * (ADR-0046).
 */
export default async function AdminUniversitiesPage() {
  const universities = await fetchAdminUniversitiesServer();
  const activeCount = universities.filter((u) => u.isActive).length;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow="Datos académicos"
        title="Universidades"
        subtitle={`${universities.length} en el catálogo · ${activeCount} activas`}
        action={
          <Link
            href="/admin/universities/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Afiliar universidad
          </Link>
        }
      />
      <UniversityTable universities={universities} />
    </div>
  );
}
