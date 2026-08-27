/**
 * Mock of teachers who deliver plan subjects (US-045-d).
 *
 * Once the real backend lands: `GET /api/teachers?planId=...` (US-063 + US-061) for the list. Sin
 * puntajes ni promedios: lo que el producto publica es de la cátedra y vive en su ficha (ADR-0083).
 *
 * Mock with 6 teachers covering the `plan.ts` mock subjects. Each teacher delivers
 * 1-2 subjects from the invented plan. The `subjects` array carries the subject codes
 * (not names) to keep linking consistent.
 */

export type TeacherTag = {
  label: string;
  count: number;
};

export type Teacher = {
  id: string;
  /** Full name "Surname, FirstName". */
  name: string;
  /** Codes of plan subjects they deliver. */
  subjects: string[];
  /** Top tags + how many reviews mention them. */
  tags: TeacherTag[];
};

export const teachers: Teacher[] = [
  {
    id: 'brandt',
    name: 'Brandt, Carlos',
    subjects: ['ISW301', 'ISW302'],
    tags: [
      { label: 'claro explicando', count: 22 },
      { label: 'exige pero acompaña', count: 18 },
      { label: 'TPs bien armados', count: 11 },
      { label: 'responde tarde', count: 8 },
    ],
  },
  {
    id: 'iturralde',
    name: 'Iturralde, Eduardo',
    subjects: ['INT302', 'MAT202'],
    tags: [
      { label: 'parcial difícil', count: 14 },
      { label: 'tema interesante', count: 9 },
      { label: 'poca devolución', count: 6 },
    ],
  },
  {
    id: 'castro',
    name: 'Castro, Mariana',
    subjects: ['MOV302', 'BD301'],
    tags: [
      { label: 'muy buena onda', count: 18 },
      { label: 'feedback rápido', count: 12 },
      { label: 'TPs actualizados', count: 8 },
    ],
  },
  {
    id: 'sosa',
    name: 'Sosa, Ramiro',
    subjects: ['SEG302', 'COM301'],
    tags: [
      { label: 'casos reales', count: 11 },
      { label: 'parciales justos', count: 8 },
      { label: 'horario fijo', count: 5 },
    ],
  },
  {
    id: 'reynoso',
    name: 'Reynoso, Luis',
    subjects: ['MAT401', 'MAT201'],
    tags: [
      { label: 'tabla rasa con el parcial', count: 10 },
      { label: 'da práctica extra', count: 6 },
    ],
  },
  {
    id: 'castellanos',
    name: 'Castellanos, Marcela',
    subjects: ['BD201', 'BD301'],
    tags: [
      { label: 'explica con casos', count: 15 },
      { label: 'corrige rápido', count: 10 },
      { label: 'parcial accesible', count: 7 },
    ],
  },
];

/**
 * Returns the teachers who deliver a specific subject. O(N) over the teachers array;
 * for 6 teachers it is trivial.
 */
export function teachersForSubject(subjectCode: string): Teacher[] {
  return teachers.filter((t) => t.subjects.includes(subjectCode));
}

/**
 * Lookup by id.
 */
export function teacherById(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id);
}
