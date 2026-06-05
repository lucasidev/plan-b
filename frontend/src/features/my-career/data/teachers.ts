/**
 * Mock de docentes que dictan materias del plan (US-045-d).
 *
 * Cuando aterrice el backend real:
 *   - `GET /api/teachers?planId=...` (US-063 + US-061) para la lista.
 *   - `GET /api/teachers/{id}/metrics` para rating + counters.
 *
 * Mock con 6 teachers que cubren las materias mock de `plan.ts`. Cada
 * docente dicta 1-2 materias del plan inventado. El `subjects` array tiene
 * los códigos de materia (no nombres) para keep linking consistente.
 */

export type TeacherRating = {
  overall: number;
  reviewCount: number;
};

export type TeacherMetrics = {
  /** Sub-dimensiones 0-5. */
  claridad: number;
  exigencia: number;
  buenaonda: number;
  responde: number;
};

export type TeacherTag = {
  label: string;
  count: number;
};

export type Teacher = {
  id: string;
  /** Nombre completo "Apellido, Nombre". */
  name: string;
  /** Códigos de materias del plan que dicta. */
  subjects: string[];
  rating: TeacherRating;
  metrics: TeacherMetrics;
  /** Tags top + cuántas reseñas las mencionan. */
  tags: TeacherTag[];
};

export const teachers: Teacher[] = [
  {
    id: 'brandt',
    name: 'Brandt, Carlos',
    subjects: ['ISW301', 'ISW302'],
    rating: { overall: 4.4, reviewCount: 42 },
    metrics: { claridad: 4.6, exigencia: 4.1, buenaonda: 3.9, responde: 3.2 },
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
    rating: { overall: 3.4, reviewCount: 28 },
    metrics: { claridad: 3.1, exigencia: 4.5, buenaonda: 2.8, responde: 3.0 },
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
    rating: { overall: 4.4, reviewCount: 31 },
    metrics: { claridad: 4.5, exigencia: 3.9, buenaonda: 4.6, responde: 4.4 },
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
    rating: { overall: 4.0, reviewCount: 24 },
    metrics: { claridad: 4.0, exigencia: 4.2, buenaonda: 3.8, responde: 3.5 },
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
    rating: { overall: 3.8, reviewCount: 19 },
    metrics: { claridad: 3.5, exigencia: 4.3, buenaonda: 3.4, responde: 3.7 },
    tags: [
      { label: 'tabla rasa con el parcial', count: 10 },
      { label: 'da práctica extra', count: 6 },
    ],
  },
  {
    id: 'castellanos',
    name: 'Castellanos, Marcela',
    subjects: ['BD201', 'BD301'],
    rating: { overall: 4.3, reviewCount: 36 },
    metrics: { claridad: 4.4, exigencia: 3.7, buenaonda: 4.2, responde: 4.0 },
    tags: [
      { label: 'explica con casos', count: 15 },
      { label: 'corrige rápido', count: 10 },
      { label: 'parcial accesible', count: 7 },
    ],
  },
];

/**
 * Devuelve los docentes que dictan una materia específica.
 * O(N) sobre el array de teachers; para 6 docentes es trivial.
 */
export function teachersForSubject(subjectCode: string): Teacher[] {
  return teachers.filter((t) => t.subjects.includes(subjectCode));
}

/**
 * Lookup por id.
 */
export function teacherById(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id);
}
