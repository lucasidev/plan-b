/**
 * Tipos del editor de reseña (US-049). Alineados al rediseño UX post-claude-design
 * (ADR-0041): una reseña por cursada con 6 campos numerados.
 *
 * Cuando aterrice el backend rework (la US futura que reemplaza el modelo viejo de
 * US-017), estos tipos se acoplan a los DTOs reales. Por ahora son mocks puros con shape
 * estable.
 */

import type { ReviewFormInput } from './schema';

/**
 * Contexto de la cursada que se está reseñando. Se renderea en el header del editor y en
 * el preview lateral. El alumno llega a esta vista habiendo seleccionado una cursada
 * pendiente (US-048 tab Pendientes); cuando ese flow exista, el id de URL se resuelve
 * via API. Por ahora se mockea (`MOCK_CURSADA_CONTEXT`).
 */
export type CursadaContext = {
  /** Id de la cursada (EnrollmentRecord.id) en el backend. Mockeado por ahora. */
  id: string;
  /** Código corto de la materia (ej. ISW301). */
  matCode: string;
  /** Nombre completo de la materia. */
  matName: string;
  /** Apellido + nombre del docente principal. */
  prof: string;
  /** Comisión. */
  com: string;
  /** Período académico legible (ej. "2025·2c"). */
  period: string;
  /** Nota final que el alumno cargó en su historial. */
  finalNote: number;
};

/**
 * Identidad pseudónima que se renderea en la preview, alineada a la regla de presentación
 * ADR-0009 (anonimato): año en carrera + nombre de carrera + período. No exponer nombre,
 * email, ni legajo.
 */
export type ReviewAnonymousIdentity = {
  year: number;
  career: string;
  period: string;
};

/**
 * Resultado de la acción de publicar. Mock por ahora: el server action devuelve un id
 * sintético y el frontend redirige. Cuando aterrice el backend real, este shape se
 * acopla al ResponseBody de `POST /api/reviews`.
 */
export type PublishReviewResult =
  | { status: 'success'; reviewId: string }
  | { status: 'error'; message: string }
  | { status: 'idle' };

export const PUBLISH_REVIEW_INITIAL_STATE: PublishReviewResult = { status: 'idle' };

/** Re-export para que callers no tengan que importar de dos archivos. */
export type ReviewDraft = ReviewFormInput;
