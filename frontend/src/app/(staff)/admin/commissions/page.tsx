import Link from 'next/link';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CommissionTable, TermPicker, UniversityPicker } from '@/features/manage-commissions';
import { fetchTermCommissionsServer } from '@/features/manage-commissions/api.server';
import {
  fetchTermDetailServer,
  fetchTermsByUniversityServer,
} from '@/features/manage-terms/api.server';
import { fetchAdminUniversitiesServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Listado global de comisiones de un período lectivo, cross-materia (US-093 admin): "Comisiones ·
 * término". La oferta es por término, y un término pertenece a una sola universidad, así que la
 * pantalla pide elegir universidad y después término (`?universityId=&termId=`) antes de mostrar la
 * tabla. Sin esos dos no hay contra qué listar: en vez de asumir un default, invita a elegir.
 */
export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ universityId?: string; termId?: string }>;
}) {
  const { universityId, termId } = await searchParams;

  if (!universityId) {
    const universities = await fetchAdminUniversitiesServer();
    return (
      <div className="mx-auto max-w-5xl">
        <AdminPageHeader
          eyebrow="Datos académicos · oferta"
          title="Comisiones"
          subtitle="Elegí una universidad para ver su oferta."
        />
        <UniversityPicker universities={universities} />
      </div>
    );
  }

  if (!termId) {
    const terms = await fetchTermsByUniversityServer(universityId);
    return (
      <div className="mx-auto max-w-5xl">
        <AdminPageHeader
          eyebrow="Datos académicos · oferta"
          title="Comisiones"
          subtitle="Elegí un período lectivo para ver su oferta."
        />
        <TermPicker universityId={universityId} terms={terms} />
      </div>
    );
  }

  const term = await fetchTermDetailServer(termId);
  if (!term) {
    const terms = await fetchTermsByUniversityServer(universityId);
    return (
      <div className="mx-auto max-w-5xl">
        <AdminPageHeader
          eyebrow="Datos académicos · oferta"
          title="Comisiones"
          subtitle="No encontramos ese período lectivo. Elegí uno de la lista."
        />
        <TermPicker universityId={universityId} terms={terms} />
      </div>
    );
  }

  const commissions = await fetchTermCommissionsServer(termId);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Datos académicos · oferta"
        title={`Comisiones · ${term.label}`}
        subtitle="Lo que se está dictando este período."
        action={
          <Link
            href={`/admin/commissions/new?universityId=${universityId}&termId=${termId}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Nueva comisión
          </Link>
        }
      />
      <Link
        href="/admin/commissions"
        className="mb-4 inline-block text-[11.5px] text-ink-3 underline hover:text-ink-2"
      >
        Cambiar universidad o período
      </Link>
      <CommissionTable universityId={universityId} termId={termId} commissions={commissions} />
    </div>
  );
}
