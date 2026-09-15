import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChairFactsSheet, type ChairSibling, fetchChairFactsServer } from '@/features/chair-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { reviewCtaHref } from '@/features/write-review';
import { getSession } from '@/lib/session';

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
  const [facts, session] = await Promise.all([fetchChairFactsServer(id), getSession()]);

  if (!facts) {
    notFound();
  }

  // "Las hermanas · misma materia" (columna derecha) y si alguna ya publica (para "Comparada con
  // las otras cátedras"): la ficha de materia ya trae cada cátedra con su cantidad de reseñas y si
  // cruzó el piso, así que no hace falta un endpoint aparte. Sin catch, un pedido que falla (no
  // 404) tiraría abajo la ficha entera por un dato que no es el centro de la pantalla: sin ella,
  // la cátedra se ve sin hermanas, con migas genéricas y sin la sección de contrastes.
  const subjectFacts = await fetchSubjectFactsServer(facts.subjectId).catch(() => null);
  const siblings: ChairSibling[] = (subjectFacts?.chairs ?? [])
    .filter((chair) => chair.chairId !== facts.chairId && chair.reviewCount > 0)
    .map((chair) => ({
      chairId: chair.chairId,
      chairName: chair.chairName,
      reviewCount: chair.reviewCount,
    }));
  // `undefined` sin ficha de materia: no se sabe si hay hermanas publicadas, así que la ficha no
  // puede afirmar "ninguna llega a las 10 reseñas" sin haberlo podido verificar.
  const hasPublishedSibling = subjectFacts
    ? subjectFacts.chairs.some((chair) => chair.chairId !== facts.chairId && chair.isPublished)
    : undefined;

  return (
    <ChairFactsSheet
      facts={facts}
      siblings={siblings}
      hasPublishedSibling={hasPublishedSibling}
      reviewHref={reviewCtaHref(session)}
    />
  );
}
