import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CareerTable } from '@/features/manage-careers';
import { fetchCareersByUniversityServer } from '@/features/manage-careers/api.server';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Listado del backoffice de carreras de una universidad (US-061 admin). RSC: fetch server-side de la
 * uni (para el header) + sus carreras, gateado a rol admin por el layout de `/admin/universities`.
 * Las mutaciones refrescan esta RSC vía router.refresh() (ADR-0046).
 */
export default async function AdminCareersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: universityId } = await params;
  // La uni es el gate: la buscamos primero y cortamos con 404 si no existe (o si el id no es un GUID,
  // que el backend responde 404). Recién ahí pedimos las carreras: si metiéramos ambos fetch en un
  // Promise.all, un id inválido haría tirar al list y rechazaría el Promise.all, degradando el 404 a
  // un 500 del error boundary antes de llegar a este guard.
  const university = await fetchUniversityDetailServer(universityId);
  if (!university) {
    notFound();
  }
  const careers = await fetchCareersByUniversityServer(universityId);

  const activeCount = careers.filter((c) => c.isActive).length;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow={`Universidades · ${university.name}`}
        title="Carreras"
        subtitle={`${careers.length} en el catálogo · ${activeCount} activas`}
        action={
          <Link
            href={`/admin/universities/${universityId}/careers/new`}
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Nueva carrera
          </Link>
        }
      />
      <CareerTable universityId={universityId} careers={careers} />
    </div>
  );
}
