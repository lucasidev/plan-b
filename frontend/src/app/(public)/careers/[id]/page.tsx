import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
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
 * Identidad y cobertura salen de reviews (`fetchCareerFactsServer`); los seis datos oficiales
 * salen aparte de academic (`fetchOfficialFactsServer`, sujeto `Offering`), porque son afirmaciones
 * con su propia fuente, no un cálculo sobre reseñas. "Qué frena la cursada" y la nota de curaduría
 * necesitan un corpus de reseñas que hoy no existe: no se mockean ni se dejan con números falsos.
 */
export default async function CareerPage({ params }: { params: Params }) {
  const { id } = await params;
  const facts = await fetchCareerFactsServer(id);

  if (!facts) {
    notFound();
  }

  const officialFacts = await fetchOfficialFactsServer('Offering', id);

  return <CareerFactsSheet facts={facts} officialFacts={officialFacts} />;
}
