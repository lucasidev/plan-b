import { ComingSoon } from '@/components/ui';

/**
 * Stub: aterriza con [US-017](docs/domain/user-stories/US-017.md) (publicar
 * reseña). El topbar tiene un botón "＋ Escribir reseña" que linkea acá per
 * mockup; cuando US-017-f esté disponible, este page se reemplaza por el
 * form real (selector de materia + dificultad + textos + checkbox de
 * anonimato).
 */
export default function NewReviewPage() {
  return (
    <ComingSoon
      section="Escribir reseña"
      futureUs="US-017"
      description="Acá vas a publicar reseña sobre una materia que ya cursaste. Aterriza con publicar reseña (US-017): form con dificultad ponderada, texto libre sobre la materia y sobre el docente, y checkbox de anonimato verificado."
    />
  );
}
