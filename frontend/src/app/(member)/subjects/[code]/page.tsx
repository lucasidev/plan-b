import { ComingSoon } from '@/components/ui';

/**
 * Dynamic stub for `/subjects/[code]`. The home and the subjects listing have Links to
 * this route pointing to specific codes (ISW301, MAT201, etc.). Real content lands
 * with [US-002](docs/domain/user-stories/US-002.md): subject detail with metadata,
 * review aggregates and histogram.
 *
 * Meanwhile this page renders a ComingSoon contextualized to the code, so the
 * evaluator understands the route is mapped and not a generic 404.
 */
export default async function SubjectDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <ComingSoon
      section={code}
      futureUs="US-002"
      description="Acá vas a ver la metadata de la materia, agregados de reseñas (rating promedio, histograma), lista paginada de reseñas anonimizadas, y links a los docentes que la dictan. Aterriza con la vista de materia."
    />
  );
}
