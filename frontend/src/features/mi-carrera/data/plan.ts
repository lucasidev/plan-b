/**
 * Mock del plan de estudios para el tab "Plan" de Mi carrera (US-045-b).
 *
 * Cuando aterrice el backend real, este mock se reemplaza por:
 *   - `GET /api/career-plans/{id}/subjects` (US-061) para la lista del plan.
 *   - `GET /api/me/enrollments` (Enrollments BC, futuro) para el estado
 *     real del alumno (AP / CU / PD) y la nota final.
 *
 * Mientras tanto, el state ya viene pre-cocido en cada subject del mock para
 * simular "lo que ve el alumno" sin tener que cruzar dos sources.
 *
 * Datos basados en una Tecnicatura en IT genérica de 5 años. La intención
 * NO es ser fiel a ninguna carrera real de UNSTA — los códigos y créditos
 * son ilustrativos.
 */

/** Estado de la materia para el alumno. */
export type SubjectState =
  /** Aprobada con nota final. */
  | 'AP'
  /** Cursando este período. */
  | 'CU'
  /** Pendiente: todavía no se cursó. */
  | 'PD';

/** Modalidad de cursada definida por la cátedra. Source of truth del plan. */
export type SubjectModality = 'anual' | '1c' | '2c';

export type PlannedSubject = {
  code: string;
  name: string;
  modality: SubjectModality;
  state: SubjectState;
  /** Nota final 1-10 cuando state === 'AP'. null en CU/PD. */
  grade: number | null;
  /** Códigos de materias correlativas para cursar. Vacío si no tiene. */
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
