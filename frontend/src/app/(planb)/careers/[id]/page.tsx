import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
import { type CareerCoverage, universityShortName } from '@/features/browse-catalog';
import {
  fetchCatalogCoverageServer,
  fetchPlanSubjectCoverageServer,
  fetchPlansByCareerServer,
  fetchSubjectsByPlanServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';
import { fetchCareerComparisonServer } from '@/features/career-comparison';
import { CareerFactsSheet, fetchCareerFactsServer } from '@/features/career-facts';

// La cobertura cambia con cada reseña nueva: se sirve fresca en vez de prerenderizada.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const facts = await fetchCareerFactsServer(id);

  return {
    title: facts ? `${facts.careerName} · planb` : 'Carrera · planb',
  };
}

/**
 * /careers/[id] (SC-001, US-127, US-133, US-134, ADR-0090). **Pública, sin cuenta.**
 *
 * Identidad, cobertura y la facultad salen de reviews (`fetchCareerFactsServer`); los seis datos
 * oficiales salen aparte de academic (`fetchOfficialFactsServer`, sujeto `Offering`), porque son
 * afirmaciones con su propia fuente, no un cálculo sobre reseñas. `catalogCoverage` hace falta
 * para "instituciones que la dictan" y para resolver `universityShort` (no hay endpoint "get
 * university by career"; se cruza el `universityId` de la cobertura contra el listado completo de
 * universidades, mismo criterio barato que `/universities/[slug]/careers`). El plan vigente es el
 * de año más alto entre los `Active` (puede haber más de uno mientras se completa una reforma,
 * US-204); sin ninguno, la ficha ofrece el link a la lista completa de planes en su lugar.
 *
 * `universityShort` y la comparación (`fetchCareerComparisonServer`) son pedidos nuevos de esta
 * pantalla: si fallan, degradan a `null` en vez de tirar la página entera (la ficha ya sabe
 * mostrarse sin ese segmento del eyebrow y sin "Dónde estudiarla"). "Qué frena la cursada" y la
 * nota de curaduría necesitan un corpus de reseñas que hoy no existe: no se mockean ni se dejan
 * con números falsos.
 */
export default async function CareerPage({ params }: { params: Params }) {
  const { id } = await params;
  const facts = await fetchCareerFactsServer(id);

  if (!facts) {
    notFound();
  }

  const [officialFacts, catalogCoverage, plans, comparison] = await Promise.all([
    fetchOfficialFactsServer('Offering', id),
    fetchCatalogCoverageServer(),
    fetchPlansByCareerServer(id),
    fetchCareerComparisonServer(id).catch(() => null),
  ]);

  const activePlans = plans.filter((plan) => plan.status === 'Active');
  const activePlanSummary =
    activePlans.length > 0
      ? activePlans.reduce((latest, plan) => (plan.year > latest.year ? plan : latest))
      : null;

  let activePlan = null;
  if (activePlanSummary) {
    const [subjects, subjectCoverage] = await Promise.all([
      fetchSubjectsByPlanServer(activePlanSummary.id),
      fetchPlanSubjectCoverageServer(activePlanSummary.id),
    ]);
    activePlan = { year: activePlanSummary.year, subjects, subjectCoverage };
  }

  const universityShort = await resolveUniversityShort(id, catalogCoverage).catch(() => null);

  return (
    <CareerFactsSheet
      facts={facts}
      officialFacts={officialFacts}
      catalogCoverage={catalogCoverage}
      academicUnitName={facts.academicUnitName}
      activePlan={activePlan}
      universityShort={universityShort}
      comparison={comparison}
    />
  );
}

/** El nombre corto de la universidad que dicta esta carrera, para el eyebrow de la ficha. */
async function resolveUniversityShort(
  careerId: string,
  catalogCoverage: CareerCoverage[],
): Promise<string | null> {
  const universityId = catalogCoverage.find((career) => career.careerId === careerId)?.universityId;
  if (!universityId) return null;

  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.id === universityId);
  return university ? universityShortName(university) : null;
}
