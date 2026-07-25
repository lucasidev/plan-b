import Link from 'next/link';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CommissionForm } from '@/features/manage-commissions';
import {
  fetchCommissionSubjectOptionsServer,
  fetchTeachersByUniversityServer,
} from '@/features/manage-commissions/api.server';
import { fetchTermDetailServer } from '@/features/manage-terms/api.server';

export const dynamic = 'force-dynamic';

/**
 * Alta de comisión (US-093 admin). Requiere `universityId` + `termId` (los trae el link "+ Nueva
 * comisión" del listado "Comisiones · término"): sin esos dos no hay contra qué crear la comisión, así
 * que si faltan se invita a volver al listado en vez de asumir un default. El catálogo de materias
 * elegibles se filtra por la cadencia del término (evita un 400 term_kind_mismatch seguro).
 */
export default async function NewCommissionPage({
  searchParams,
}: {
  searchParams: Promise<{ universityId?: string; termId?: string }>;
}) {
  const { universityId, termId } = await searchParams;

  if (!universityId || !termId) {
    return <MissingContextNotice />;
  }

  const term = await fetchTermDetailServer(termId);
  if (!term) {
    return (
      <MissingContextNotice message="No encontramos ese período lectivo. Volvé al listado y elegilo de nuevo." />
    );
  }

  const [allSubjects, teachers] = await Promise.all([
    fetchCommissionSubjectOptionsServer(universityId),
    fetchTeachersByUniversityServer(universityId),
  ]);
  const subjects = allSubjects.filter((s) => s.termKind === term.kind);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        eyebrow="Comisiones"
        title="Nueva comisión"
        subtitle={`Oferta de ${term.label}.`}
      />
      {subjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
          <p className="m-0 text-[13px] text-ink-3">
            No hay materias activas con la cadencia de este período. Cargá o activá una materia con
            esa cadencia antes de crear la comisión.
          </p>
        </div>
      ) : (
        <CommissionForm
          mode="create"
          universityId={universityId}
          termId={termId}
          subjects={subjects}
          teachers={teachers}
        />
      )}
    </div>
  );
}

function MissingContextNotice({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader eyebrow="Comisiones" title="Nueva comisión" />
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          {message ??
            'Elegí una universidad y un período desde el listado de comisiones para crear una nueva.'}
        </p>
        <Link
          href="/admin/commissions"
          className="mt-3 inline-block text-[12.5px] text-ink underline"
        >
          Volver al listado
        </Link>
      </div>
    </div>
  );
}
