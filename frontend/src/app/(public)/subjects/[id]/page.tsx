import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchSubjectFactsServer, SubjectFactsSheet } from '@/features/subject-facts';
import { reviewCtaHref } from '@/features/write-review';
import { getSession } from '@/lib/session';

// Los conteos cambian con cada reseña nueva: se sirve fresca en vez de prerenderizada.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const facts = await fetchSubjectFactsServer(id);

  return {
    title: facts ? `${facts.subjectCode} · ${facts.subjectName} · planb` : 'Materia · planb',
  };
}

/**
 * /subjects/[id] (SC-007, US-129). **Pública, sin cuenta.**
 *
 * Reemplaza a la ficha del modelo anterior, que publicaba promedio de rating, histograma de
 * estrellas, dificultad, porcentaje de recomendación y la lista de reseñas de texto libre. Eso lo
 * prohíben ADR-0083 (la ficha publica conteos, nunca puntajes) y ADR-0084 (el texto libre no se
 * publica jamás).
 *
 * Lo que muestra en su lugar sale de sus cátedras: una materia no se reseña, se deriva.
 */
export default async function SubjectPage({ params }: { params: Params }) {
  const { id } = await params;
  const [facts, session] = await Promise.all([fetchSubjectFactsServer(id), getSession()]);

  if (!facts) {
    notFound();
  }

  return <SubjectFactsSheet facts={facts} reviewHref={reviewCtaHref(session)} />;
}
