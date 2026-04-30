import { ComingSoon } from '@/components/ui';

/**
 * Stub dinámico para `/subjects/[code]`. La home y el listado de materias
 * tienen Links a esta ruta apuntando a códigos específicos (ISW301, MAT201,
 * etc.). Aterriza el contenido real con [US-002](docs/domain/user-stories/US-002.md):
 * detalle de materia con metadata, agregados de reseñas e histograma.
 *
 * Mientras tanto este page renderiza un ComingSoon contextualizado al
 * código, así el evaluador entiende que la ruta está mapeada y no es un
 * 404 genérico.
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
