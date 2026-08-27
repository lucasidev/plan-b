import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChairFactsSheet, fetchChairFactsServer } from '@/features/chair-facts';

// Los conteos cambian con cada reseña nueva y la ficha es lo que el producto publica: se sirve
// fresca en vez de prerenderizada.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const facts = await fetchChairFactsServer(id);

  if (!facts) {
    return { title: 'Cátedra · planb' };
  }

  return {
    title: `Cátedra ${facts.chairName} · ${facts.subjectName} · planb`,
  };
}

/**
 * Ficha de cátedra (SC-002, US-147). **Pública, sin cuenta**: es la mitad de la tesis. El producto
 * recolecta con cuenta y publica sin ella, porque una presión que solo ven los registrados no
 * presiona.
 */
export default async function ChairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facts = await fetchChairFactsServer(id);

  if (!facts) {
    notFound();
  }

  return <ChairFactsSheet facts={facts} />;
}
