import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TermForm } from '@/features/manage-terms';
import { fetchTermDetailServer } from '@/features/manage-terms/api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de período lectivo (US-064 admin). El período tiene que pertenecer a la uni de la ruta
 * (el GET por id no valida el parent): una URL cruzada cae a 404, mismo criterio que el edit de
 * carrera.
 */
export default async function EditTermPage({
  params,
}: {
  params: Promise<{ id: string; termId: string }>;
}) {
  const { id: universityId, termId } = await params;
  const term = await fetchTermDetailServer(termId);

  if (!term || term.universityId !== universityId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Períodos lectivos"
        title={`Editar: ${term.label}`}
        subtitle="Los cambios recalculan el identificador (label) del período."
      />
      <TermForm mode="edit" universityId={universityId} term={term} />
    </div>
  );
}
