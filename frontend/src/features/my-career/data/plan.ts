/**
 * Career-plan mock for the "Plan" tab of Mi carrera (US-045-b).
 *
 * Once the real backend lands, this mock is replaced by:
 *   - `GET /api/career-plans/{id}/subjects` (US-061) for the plan list.
 *   - `GET /api/me/enrollments` (Enrollments BC, future) for the student's real state
 *     (AP / CU / PD) and the final grade.
 *
 * Meanwhile, the state is pre-baked into each mock subject to simulate "what the
 * student sees" without having to cross two sources.
 *
 * Data based on a generic 5-year IT technicatura. The intent is NOT to be faithful to
 * any real UNSTA career: the codes and credits are illustrative.
 */

/** Student-facing subject state. */
export type SubjectState =
  /** Approved with a final grade. */
  | 'AP'
  /** Currently being taken this period. */
  | 'CU'
  /** Pending: not yet taken. */
  | 'PD';

/** Course modality defined by the cátedra. Plan source of truth. */
export type SubjectModality = 'anual' | '1c' | '2c';

export type PlannedSubject = {
  code: string;
  name: string;
  modality: SubjectModality;
  state: SubjectState;
  /** Final grade 1-10 when state === 'AP'. null on CU/PD. */
  grade: number | null;
  /** Codes of prerequisite subjects to take. Empty if none. */
  correlativas: string[];
};

export type PlanYear = {
  year: number;
  subjects: PlannedSubject[];
};

export const plan: PlanYear[] = [
  {
    year: 1,
    subjects: [
      {
        code: 'MAT101',
        name: 'Análisis Matemático I',
        modality: 'anual',
        state: 'AP',
        grade: 9,
        correlativas: [],
      },
      {
        code: 'ALG101',
        name: 'Álgebra y Geometría',
        modality: 'anual',
        state: 'AP',
        grade: 8,
        correlativas: [],
      },
      {
        code: 'PRG101',
        name: 'Programación I',
        modality: '1c',
        state: 'AP',
        grade: 9,
        correlativas: [],
      },
      {
        code: 'PRG102',
        name: 'Programación II',
        modality: '2c',
        state: 'AP',
        grade: 8,
        correlativas: ['PRG101'],
      },
      {
        code: 'SOC101',
        name: 'Inglés Técnico',
        modality: '1c',
        state: 'AP',
        grade: 8,
        correlativas: [],
      },
      {
        code: 'SOC102',
        name: 'Sistemas y Organizaciones',
        modality: '2c',
        state: 'AP',
        grade: 7,
        correlativas: [],
      },
    ],
  },
  {
    year: 2,
    subjects: [
      {
        code: 'MAT201',
        name: 'Análisis II',
        modality: 'anual',
        state: 'AP',
        grade: 7,
        correlativas: ['MAT101'],
      },
      {
        code: 'MAT202',
        name: 'Probabilidad y Estadística',
        modality: '2c',
        state: 'AP',
        grade: 8,
        correlativas: ['MAT101'],
      },
      {
        code: 'PRG201',
        name: 'Estructuras de Datos',
        modality: '1c',
        state: 'AP',
        grade: 9,
        correlativas: ['PRG102'],
      },
      {
        code: 'BD201',
        name: 'Bases de Datos I',
        modality: '2c',
        state: 'AP',
        grade: 8,
        correlativas: ['PRG102'],
      },
      {
        code: 'SO201',
        name: 'Sistemas Operativos',
        modality: '1c',
        state: 'AP',
        grade: 7,
        correlativas: ['PRG102'],
      },
      {
        code: 'HW201',
        name: 'Arquitectura de Computadoras',
        modality: '2c',
        state: 'AP',
        grade: 6,
        correlativas: [],
      },
    ],
  },
  {
    year: 3,
    subjects: [
      {
        code: 'ISW301',
        name: 'Ingeniería de Software I',
        modality: '1c',
        state: 'AP',
        grade: 8,
        correlativas: ['PRG201'],
      },
      {
        code: 'BD301',
        name: 'Bases de Datos II',
        modality: '2c',
        state: 'AP',
        grade: 7,
        correlativas: ['BD201'],
      },
      {
        code: 'COM301',
        name: 'Comunicación de Datos',
        modality: '2c',
        state: 'AP',
        grade: 6,
        correlativas: ['SO201'],
      },
      { code: 'ECO301', name: 'Economía', modality: '1c', state: 'AP', grade: 7, correlativas: [] },
      {
        code: 'DER301',
        name: 'Derecho Informático',
        modality: '2c',
        state: 'PD',
        grade: null,
        correlativas: [],
      },
      {
        code: 'LEG301',
        name: 'Legislación',
        modality: '1c',
        state: 'PD',
        grade: null,
        correlativas: [],
      },
    ],
  },
  {
    year: 4,
    subjects: [
      {
        code: 'ISW302',
        name: 'Ingeniería de Software II',
        modality: '1c',
        state: 'CU',
        grade: null,
        correlativas: ['ISW301'],
      },
      {
        code: 'INT302',
        name: 'Inteligencia Artificial',
        modality: '1c',
        state: 'CU',
        grade: null,
        correlativas: ['MAT202', 'PRG201'],
      },
      {
        code: 'SEG302',
        name: 'Seguridad Informática',
        modality: '1c',
        state: 'CU',
        grade: null,
        correlativas: ['SO201', 'COM301'],
      },
      {
        code: 'QUI201',
        name: 'Química General',
        modality: '2c',
        state: 'CU',
        grade: null,
        correlativas: [],
      },
      {
        code: 'MAT401',
        name: 'Matemática Aplicada',
        modality: 'anual',
        state: 'CU',
        grade: null,
        correlativas: ['MAT201'],
      },
      {
        code: 'MOV302',
        name: 'Apps Móviles',
        modality: '2c',
        state: 'PD',
        grade: null,
        correlativas: ['PRG201'],
      },
    ],
  },
  {
    year: 5,
    subjects: [
      {
        code: 'PFC501',
        name: 'Proyecto Final',
        modality: 'anual',
        state: 'PD',
        grade: null,
        correlativas: ['ISW302'],
      },
      {
        code: 'ETI501',
        name: 'Ética Profesional',
        modality: '1c',
        state: 'PD',
        grade: null,
        correlativas: [],
      },
      {
        code: 'GES501',
        name: 'Gestión de Proyectos',
        modality: '2c',
        state: 'PD',
        grade: null,
        correlativas: ['ISW302'],
      },
      {
        code: 'EMP501',
        name: 'Emprendedorismo',
        modality: '1c',
        state: 'PD',
        grade: null,
        correlativas: [],
      },
    ],
  },
];
