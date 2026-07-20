import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TermTable } from '@/features/manage-terms';
import { fetchTermsByUniversityServer } from '@/features/manage-terms/api.server';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Listado del backoffice de períodos lectivos de una universidad (US-064 admin). RSC: fetch
 * server-side de la uni (para el header) + sus períodos, gateado a rol admin por el layout de
 * `/admin/universities`. Las mutaciones redirigen acá y refrescan la RSC (ADR-0046).
 */
export default async function AdminTermsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: universityId } = await params;
  // La uni es el gate: la buscamos primero y cortamos con 404 si no existe (o si el id no es un
  // GUID, que el backend responde 404). Mismo motivo que AdminCareersPage: si metiéramos ambos
  // fetch en un Promise.all, un id inválido haría tirar al list y degradaría el 404 a un 500.
  const university = await fetchUniversityDetailServer(universityId);
  if (!university) {
    notFound();
  }
  const terms = await fetchTermsByUniversityServer(universityId);

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow={`Universidades · ${university.name}`}
        title="Períodos lectivos"
        subtitle={`${terms.length} en el catálogo`}
        action={
          <Link
            href={`/admin/universities/${universityId}/terms/new`}
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Nuevo período
          </Link>
        }
      />
      <TermTable universityId={universityId} terms={terms} />
    </div>
  );
}
