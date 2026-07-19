import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CareerPlansPanel } from '@/features/manage-careers';
import {
  fetchCareerDetailServer,
  fetchCareerPlansServer,
} from '@/features/manage-careers/api.server';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Detalle de una carrera (US-061 admin): resumen de metadata + panel de planes de estudio. RSC:
 * fetch server-side de la carrera, sus planes y la uni (para el header). El panel gestiona el alta y
 * la transición de estado de los planes; refresca esta RSC vía router.refresh() (ADR-0046).
 */
export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ id: string; careerId: string }>;
}) {
  const { id: universityId, careerId } = await params;
  // La carrera es el gate: la buscamos primero (maneja 404 → null) y cortamos antes de pedir los
  // planes. Con un careerId que no es GUID el list de planes respondería 404 y tiraría, rechazando el
  // Promise.all y degradando el 404 a un 500; con el gate primero eso no pasa. Además tiene que
  // pertenecer a la uni de la ruta: el GET por id no valida el parent, así que sin este chequeo una
  // URL cruzada mostraría la carrera con los links de "volver" a la uni errada.
  const career = await fetchCareerDetailServer(careerId);
  if (!career || career.universityId !== universityId) {
    notFound();
  }
  const [plans, university] = await Promise.all([
    fetchCareerPlansServer(careerId),
    fetchUniversityDetailServer(universityId),
  ]);

  // Resumen con la metadata que sí tenemos cargada (materias/alumnos son US-062/US-093).
  const summaryParts = [
    career.degreeType,
    career.durationYears ? `${career.durationYears} años` : null,
    career.cadence,
    career.code,
  ].filter(Boolean);
  const subtitle = summaryParts.length
    ? summaryParts.join(' · ')
    : 'Sin metadata cargada. Editá la carrera para completarla.';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/admin/universities/${universityId}/careers`}
        className="mb-3 inline-block text-[12px] text-ink-3 hover:text-ink"
      >
        ← Volver a carreras
      </Link>
      <AdminPageHeader
        eyebrow={`${university?.name ?? 'Universidad'} · Carrera`}
        title={career.name}
        subtitle={subtitle}
        action={
          <Link
            href={`/admin/universities/${universityId}/careers/${careerId}/edit`}
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-line bg-bg-card px-3.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            Editar carrera
          </Link>
        }
      />
      {!career.isActive && (
        <p className="mb-4 rounded-md border border-line bg-bg-elev px-3.5 py-2 text-[12px] text-ink-3">
          Esta carrera está desactivada. Reactivala desde el listado para que vuelva al catálogo.
        </p>
      )}
      <CareerPlansPanel careerId={careerId} plans={plans} />
    </div>
  );
}
