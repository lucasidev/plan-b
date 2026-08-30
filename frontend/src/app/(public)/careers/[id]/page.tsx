import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
 * /careers/[id] (SC-001, US-127, US-134). **Pública, sin cuenta.**
 *
 * Alcance acotado a lo que tiene fuente real hoy: identidad, cuánto dura en el papel y la
 * cobertura. Lo que la ficha completa pide y todavía no entra (los datos oficiales de egreso por
 * cohorte, "qué frena la cursada" y la nota de curaduría) necesita un relevamiento propio o un
 * corpus de reseñas que hoy no existen: no se mockean ni se dejan con números falsos.
 */
export default async function CareerPage({ params }: { params: Params }) {
  const { id } = await params;
  const facts = await fetchCareerFactsServer(id);

  if (!facts) {
    notFound();
  }

  return <CareerFactsSheet facts={facts} />;
}
