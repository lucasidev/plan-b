/**
 * Materias cerradas (cursadas en algún cuatri pasado) sobre las que el
 * alumno todavía no escribió reseña. Shape espejada del mock
 * `v2-shell.jsx::V2_TO_REVIEW`. Cuando aterricen US-017 (escribir reseña)
 * + Reviews backend, este file reemplaza el mock por un fetch a
 * `GET /api/me/pending-reviews` (o equivalente).
 */
export type PendingReview = {
  code: string;
  name: string;
  /** Apellido del docente que dictó la materia ese cuatri. */
  prof: string;
  /** String compacto del cuatri cerrado (ej. "2025·2c"). */
  closed: string;
  /** Nota final que sacó el alumno. `null` si aprobó por equivalencia o sin nota numérica. */
  note: number | null;
};

// TODO: cuando aterrice US-017 (escribir reseña) + Reviews backend,
// reemplazar por fetch real. El shape se mantiene.
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
