/**
 * Response shape of `GET /api/reviews` (US-048 tab Explorar). Mirrors the backend's
 * `BrowseReviewsResponse` + `BrowseReviewItem`.
 *
 * The feed is public: no author identifier is included. The frontend uses the year +
 * career + period of the StudentProfile to render an anonymous attribution chip in a
 * later iteration; for now the card shows only the subject + review metadata.
 */
export type BrowseReview = {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  difficultyRating: number;
  subjectText: string | null;
  finalGrade: number | null;
  createdAt: string;
};

export type BrowseReviewsResponse = {
  items: BrowseReview[];
  page: number;
  pageSize: number;
  totalCount: number;
};

/**
 * URL-driven filters for the feed. Each field is optional: an absent value means "any".
 * `difficulty` is constrained to 1..5; the parser drops anything outside that range.
 */
export type BrowseReviewsFilters = {
  difficulty: number | null;
  page: number;
};

export function parseBrowseFilters(searchParams: URLSearchParams): BrowseReviewsFilters {
  const difficultyRaw = Number.parseInt(searchParams.get('difficulty') ?? '', 10);
  const difficulty =
    Number.isFinite(difficultyRaw) && difficultyRaw >= 1 && difficultyRaw <= 5
      ? difficultyRaw
      : null;

  const pageRaw = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  return { difficulty, page };
}
