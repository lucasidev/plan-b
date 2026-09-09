import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CareerComparisonView, fetchCareerComparisonServer } from '@/features/career-comparison';

// La comparación cambia con cada afirmación que carga el equipo: se sirve fresca, no prerenderizada.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const comparison = await fetchCareerComparisonServer(id);

  return {
    title: comparison
      ? `${comparison.groupName ?? comparison.offerings[0]?.careerName ?? 'Carrera'} · planb`
      : 'Carrera · planb',
  };
}

/**
 * /careers/[id]/where-to-study (SC-008, US-128, ADR-0090, R6 tarea 5). **Pública, sin cuenta.**
 *
 * `id` es cualquier oferta del grupo de carrera canónica que se quiere comparar (llega desde su
 * propia ficha, US-128 "Adónde va"): el backend resuelve el grupo entero y la ciudad de esa
 * oferta puntual, así que la misma pantalla sirve para entrar desde cualquiera de las
 * instituciones comparadas, no solo desde una fija.
 */
export default async function CareerComparisonPage({ params }: { params: Params }) {
  const { id } = await params;
  const comparison = await fetchCareerComparisonServer(id);

  if (!comparison) {
    notFound();
  }

  return <CareerComparisonView comparison={comparison} />;
}
