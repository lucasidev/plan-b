/**
 * Mock reviews for the subject and teacher drawers (US-045-d).
 *
 * When the backend lands: `GET /api/reviews?subjectCode=...&top=3` (US-005, to be
 * documented). This only needs the top reviews, not the full list; the full listing
 * goes to `/reviews?subjectId=...`.
 *
 * Shape designed to render in the canvas's V2ResenaCard: who + score + diff + text +
 * useful + prof.
 */

export type ReviewMock = {
  id: string;
  /** Subject code this entry reviews. */
  subjectCode: string;
  /** Teacher id (string id from teachers.ts). */
  teacherId: string;
  /** Anonymous author display: year + period taken. */
  who: string;
  /** Teacher score 1-5. */
  score: number;
  /** Perceived difficulty 1-5. */
  difficulty: number;
  /** Review body. */
  text: string;
  /** "Useful" vote count. */
  useful: number;
};

export const reviews: ReviewMock[] = [
  // ISW302
  {
    id: 'rev_isw302_1',
    subjectCode: 'ISW302',
    teacherId: 'brandt',
    who: 'Anónimo · 4° año · cursó 2025·1c',
    score: 4,
    difficulty: 4,
    text: 'Materia bien estructurada. El TP integrador es exigente pero te enseña a laburar en equipo. Brandt es claro pero pide.',
    useful: 14,
  },
  {
    id: 'rev_isw302_2',
    subjectCode: 'ISW302',
    teacherId: 'brandt',
    who: 'Anónimo · 5° año · cursó 2024·2c',
    score: 5,
    difficulty: 4,
    text: 'Si te gusta diseño de software, es la mejor del plan. Vas a programar mucho, preparate para eso.',
    useful: 11,
  },
  {
    id: 'rev_isw302_3',
    subjectCode: 'ISW302',
    teacherId: 'brandt',
    who: 'Anónimo · 4° año · cursó 2024·1c',
    score: 3,
    difficulty: 5,
    text: 'El parcial 2 es un cuello de botella. Estudiá el material extra que sube la cátedra, no alcanza con la teórica.',
    useful: 9,
  },
  // INT302
  {
    id: 'rev_int302_1',
    subjectCode: 'INT302',
    teacherId: 'iturralde',
    who: 'Anónimo · 4° año · cursó 2025·1c',
    score: 3,
    difficulty: 5,
    text: 'El tema engancha pero las clases son densas. El final es difícil; sin grupo de estudio no llegás.',
    useful: 8,
  },
  {
    id: 'rev_int302_2',
    subjectCode: 'INT302',
    teacherId: 'iturralde',
    who: 'Anónimo · 5° año · cursó 2024·2c',
    score: 4,
    difficulty: 5,
    text: 'Si te interesa IA en serio, hacela. Iturralde no te lleva de la mano pero el contenido vale.',
    useful: 6,
  },
  // SEG302
  {
    id: 'rev_seg302_1',
    subjectCode: 'SEG302',
    teacherId: 'sosa',
    who: 'Anónimo · 4° año · cursó 2025·1c',
    score: 4,
    difficulty: 3,
    text: 'Buenos labs prácticos, casos reales. Sosa explica con ejemplos del laburo, se valora.',
    useful: 10,
  },
  // MAT401
  {
    id: 'rev_mat401_1',
    subjectCode: 'MAT401',
    teacherId: 'reynoso',
    who: 'Anónimo · 4° año · cursó 2024·anual',
    score: 3,
    difficulty: 4,
    text: 'Reynoso explica bien la teoría pero los parciales tienen un nivel arriba de la práctica que dan. Pediles ejercicios resueltos.',
    useful: 7,
  },
  // ISW301
  {
    id: 'rev_isw301_1',
    subjectCode: 'ISW301',
    teacherId: 'brandt',
    who: 'Anónimo · 3° año · cursó 2024·1c',
    score: 5,
    difficulty: 3,
    text: 'Buena introducción al diseño. Te deja con ganas de cursar la 2.',
    useful: 12,
  },
  // BD201
  {
    id: 'rev_bd201_1',
    subjectCode: 'BD201',
    teacherId: 'castellanos',
    who: 'Anónimo · 2° año · cursó 2023·2c',
    score: 4,
    difficulty: 3,
    text: 'Castellanos explica con casos reales. Los parciales se pueden si seguís el TP.',
    useful: 9,
  },
];

/** Top N reviews for a specific subject, sorted by `useful` desc. */
export function topReviewsForSubject(subjectCode: string, limit = 3): ReviewMock[] {
  return reviews
    .filter((r) => r.subjectCode === subjectCode)
    .toSorted((a, b) => b.useful - a.useful)
    .slice(0, limit);
}

/** Total review count for a subject (display "Ver las N reseñas"). */
export function reviewCountForSubject(subjectCode: string): number {
  return reviews.filter((r) => r.subjectCode === subjectCode).length;
}

/** Top N reviews for a teacher, sorted by `useful` desc. */
export function topReviewsForTeacher(teacherId: string, limit = 3): ReviewMock[] {
  return reviews
    .filter((r) => r.teacherId === teacherId)
    .toSorted((a, b) => b.useful - a.useful)
    .slice(0, limit);
}
