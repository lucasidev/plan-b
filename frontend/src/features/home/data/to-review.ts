/**
 * Closed subjects (taken in some past term) the student has not yet written a review
 * for. Shape mirrored from the `v2-shell.jsx::V2_TO_REVIEW` mock. Once US-017 (write
 * review) + the Reviews backend land, this file swaps the mock for a fetch to
 * `GET /api/me/pending-reviews` (or equivalent).
 */
export type PendingReview = {
  code: string;
  name: string;
  /** Surname of the teacher who delivered the subject that term. */
  prof: string;
  /** Compact string of the closed term (e.g. "2025·2c"). */
  closed: string;
  /** Final grade the student got. `null` if approved via equivalence or without a numeric grade. */
  note: number | null;
};

// TODO: once US-017 (write review) + Reviews backend land, swap for a real fetch. The
// shape stays the same.
export const pendingReviews: PendingReview[] = [
  {
    code: 'ISW301',
    name: 'Ingeniería de Software I',
    prof: 'Brandt',
    closed: '2025·2c',
    note: 8,
  },
  {
    code: 'BD301',
    name: 'Bases de Datos',
    prof: 'Castellanos',
    closed: '2025·2c',
    note: 7,
  },
  {
    code: 'COM301',
    name: 'Comunicación de Datos',
    prof: 'Sosa',
    closed: '2025·2c',
    note: 6,
  },
];
