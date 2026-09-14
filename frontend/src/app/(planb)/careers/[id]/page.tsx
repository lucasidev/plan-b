import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
import {
  fetchCatalogCoverageServer,
  fetchPlanSubjectCoverageServer,
  fetchPlansByCareerServer,
  fetchSubjectsByPlanServer,
} from '@/features/browse-catalog/api.server';
import { CareerFactsSheet, fetchCareerFactsServer } from '@/features/career-facts';
import { reviewCtaHref } from '@/features/write-review';
import { getSession } from '@/lib/session';

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
 * afirmaciones con su propia fuente, no un cálculo sobre reseñas. `catalogCoverage` solo hace
 * falta para "instituciones que la dictan" (agrupa por `canonicalGroupName`). El plan vigente es
 * el de año más alto entre los `Active` (puede haber más de uno mientras se completa una reforma,
 * US-204); sin ninguno, la ficha ofrece el link a la lista completa de planes en su lugar. "Qué
 * frena la cursada" y la nota de curaduría necesitan un corpus de reseñas que hoy no existe: no se
 * mockean ni se dejan con números falsos.
 */
export default async function CareerPage({ params }: { params: Params }) {
  const { id } = await params;
  const [facts, session] = await Promise.all([fetchCareerFactsServer(id), getSession()]);

  if (!facts) {
    notFound();
  }

  const [officialFacts, catalogCoverage, plans] = await Promise.all([
    fetchOfficialFactsServer('Offering', id),
    fetchCatalogCoverageServer(),
    fetchPlansByCareerServer(id),
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

  return (
    <CareerFactsSheet
      facts={facts}
      officialFacts={officialFacts}
      catalogCoverage={catalogCoverage}
      academicUnitName={facts.academicUnitName}
      activePlan={activePlan}
      reviewHref={reviewCtaHref(session)}
    />
  );
}
