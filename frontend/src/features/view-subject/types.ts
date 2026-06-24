/**
 * DTOs for the public subject detail page (US-002). Mirror the backend responses:
 *  - SubjectDetail: GET /api/academic/subjects/{id}
 *  - SubjectInsights: GET /api/reviews/insights?subjectId={id}
 *  - SubjectReviewsPage: GET /api/reviews?subjectId={id}&page=N (shared BrowseReviews shape)
 *
 * All public per ADR-0009: nothing identifies a review's author beyond the anonymous
 * year-in-career + period the student chose to show.
 */

export type SubjectDetail = {
  id: string;
  careerPlanId: string;
  code: string;
  name: string;
  yearInPlan: number;
  termInYear: number | null;
  termKind: string;
  weeklyHours: number;
  totalHours: number;
  description: string | null;
  isOfficial: boolean;
};

export type SubjectInsights = {
  totalCount: number;
  averageOverallRating: number | null;
  averageDifficulty: number | null;
  averageHoursPerWeek: number | null;
  recommendPercentage: number | null;
  /** Five buckets, index 0 = rating 1 ... index 4 = rating 5. */
  ratingHistogram: number[];
};

export type SubjectReview = {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  difficultyRating: number;
  overallRating: number;
  hoursPerWeek: number | null;
  tags: string[];
  wouldRecommendCourse: boolean;
  wouldRetakeTeacher: boolean;
  subjectText: string | null;
  finalGrade: number | null;
  createdAt: string;
  /** Votos de utilidad (helpfulness). myVoteIsHelpful: null si el caller no votó / es anónimo. */
  helpfulCount: number;
  notHelpfulCount: number;
  myVoteIsHelpful: boolean | null;
};

export type SubjectReviewsPage = {
  items: SubjectReview[];
  page: number;
  pageSize: number;
  totalCount: number;
};

/**
 * Aprobación histórica de la materia (ADR-0047). `passRate` es el porcentaje (0-100) o `null`
 * cuando la muestra es menor al gate mínimo (anti re-identificación): la UI muestra "pocos datos".
 * `sampleSize` es el denominador (cursadas con verdicto), para el disclaimer.
 */
export type SubjectPassRate = {
  passRate: number | null;
  sampleSize: number;
};

export const SUBJECT_REVIEWS_PAGE_SIZE = 20;
