/**
 * Response shape of `GET /api/reviews/me` (US-048 tab Mías). Mirrors the backend's
 * `GetMyReviewsResponse` + `MyReviewItem` + `MyReviewsStats` records.
 *
 * `status` carries the persisted review state. The list renders all of them; the chip
 * colour comes from this string.
 */
export type ReviewStatus = 'Published' | 'UnderReview' | 'Removed';

/**
 * Por qué una reseña está en `UnderReview`. Espeja el enum de dominio `UnderReviewReason`
 * (mismo criterio Pascal que `ReviewStatus`). `ContentFilter` y `EnrollmentChanged` se
 * resuelven editando (el filtro reevalúa el texto nuevo); `Reports` espera a un moderador.
 */
export type UnderReviewReason = 'ContentFilter' | 'Reports' | 'EnrollmentChanged';

export type MyReview = {
  id: string;
  enrollmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  status: ReviewStatus;
  /** Null salvo que `status` sea `UnderReview`. */
  underReviewReason: UnderReviewReason | null;
  difficultyRating: number;
  subjectText: string | null;
  finalGrade: number | null;
  createdAt: string;
};

export type MyReviewsStats = {
  totalCount: number;
  publishedCount: number;
  underReviewCount: number;
  removedCount: number;
};

export type MyReviewsResponse = {
  items: MyReview[];
  stats: MyReviewsStats;
};
