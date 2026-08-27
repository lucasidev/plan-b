/**
 * DTO de la ficha pública de un docente (US-003): espeja `GET /api/academic/teachers/{id}`.
 *
 * Es metadata y nada más. Lo que el producto publica es de la **cátedra**, no de la persona
 * (ADR-0083), así que la ficha del docente lleva a las cátedras que integra y ahí están los
 * conteos; acá no hay un promedio, una estrella ni un testimonio que mostrar.
 */

export type TeacherDetail = {
  id: string;
  universityId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  isActive: boolean;
};
