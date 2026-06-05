/**
 * Recent movements feed from the student's environment (responses to reviews, new
 * reviews on their plan, exam-date changes, etc.). Shape mirrored from the inline array
 * in `v2-screens.jsx::V2Inicio`.
 *
 * `timestamp` is already a pre-formatted relative string in the mock (e.g. "hace 2h",
 * "hace 1d"). When the real notifications module lands, timestamps come as ISO 8601
 * from the backend and a `formatRelativeTime(date, now)` helper turns them into the
 * string in the display component.
 */
export type Movement = {
  id: string;
  /** Pre-formatted relative string in MVP (e.g. "hace 2h"). */
  timestamp: string;
  /** Notification body, one line. */
  body: string;
};

// TODO: once the notifications backend lands (US-Notif), swap for a fetch to
// `GET /api/me/movements?limit=N`. The shape switches to ISO timestamps; a helper in
// `lib/time.ts` converts them to a relative string in the component.
export const movements: Movement[] = [
  { id: '1', timestamp: 'hace 2h', body: 'Brandt respondió a tu reseña de ISW301' },
  { id: '2', timestamp: 'hace 1d', body: 'Nueva reseña en INT302 (4★)' },
  { id: '3', timestamp: 'hace 3d', body: 'Iturralde subió la fecha del parcial' },
];
