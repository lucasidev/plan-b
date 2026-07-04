/**
 * DTOs for the public teacher detail page (US-003). Mirror the backend responses:
 *  - TeacherDetail: GET /api/academic/teachers/{id}
 *  - TeacherInsights: GET /api/reviews/teacher-insights?teacherId={id}
 *  - TeacherReviewsPage: GET /api/reviews?teacherId={id}&page=N (shared BrowseReviews shape)
 *
 * All public per ADR-0009: nothing identifies a review's author beyond the anonymous
 * year-in-career + period the student chose to show. A teacher's reviews span several subjects, so
 * each review carries its subject context (unlike the subject page where they all share one).
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

export type TeacherInsights = {
  totalCount: number;
  averageOverallRating: number | null;
  averageDifficulty: number | null;
  averageHoursPerWeek: number | null;
  recommendPercentage: number | null;
  /** Five buckets, index 0 = rating 1 ... index 4 = rating 5. */
  ratingHistogram: number[];
};

export type TeacherReview = {
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
  /** Respuesta del docente (US-040). Null si nadie respondió. El autor aparece con su nombre. */
  responseText: string | null;
  responseAuthorName: string | null;
  responseCreatedAt: string | null;
  /** US-041: si es > responseCreatedAt, la respuesta fue editada. */
  responseUpdatedAt: string | null;
};

export type TeacherReviewsPage = {
  items: TeacherReview[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export const TEACHER_REVIEWS_PAGE_SIZE = 20;

/** Estado del server action de responder reseña (US-040). Vive en types (actions.ts solo exporta async). */
export type RespondFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialRespondState: RespondFormState = { status: 'idle' };
