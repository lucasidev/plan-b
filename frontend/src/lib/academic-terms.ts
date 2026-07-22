/**
 * Formato canónico de períodos y cadencias para toda la UI.
 *
 * Antes cada consumidor formateaba por su cuenta y el resultado eran cuatro vocabularios distintos
 * para el mismo dato: "2025-C2" en el backoffice, "2025·2c" en reseñas, "1c" en el simulador y
 * "1er cuatri" en las píldoras. Ninguno estaba definido en ningún lado, así que el alumno tenía que
 * adivinar si "3b" era un bimestre, una comisión o un aula.
 *
 * Dos reglas detrás de estas funciones:
 *
 * 1. **Nada de letras sueltas.** "1c" y "3b" ahorran cuatro caracteres a cambio de ser
 *    indescifrables. La forma corta abrevia ("1er cuatri"), no codifica.
 * 2. **El período se arma acá, no en la base.** El SQL de pendientes concatenaba la 'c' a mano, así
 *    que un período bimestral se mostraba como "2025·3c": un dato falso, no solo oscuro. La query
 *    ahora devuelve year/number/kind crudos y el formato vive únicamente en este archivo.
 *
 * El valor de `TermKind` viaja por el wire y se compara en código (inglés); el label es lo único
 * que ve el alumno (español). El backend tiene su propio `AcademicTerm.ComputeLabel` ("2025-C2")
 * para la etiqueta que persiste en la columna `label`: es un identificador estable, no copy, y no
 * lo reemplaza esto ni al revés.
 */

/** Espeja `TermKind` del backend (`Planb.Academic.Domain.TermKind`). */
export type TermKind = 'TwoMonth' | 'FourMonth' | 'SixMonth' | 'FullYear';

export const TERM_KIND_LABELS: Record<TermKind, string> = {
  TwoMonth: 'Bimestral',
  FourMonth: 'Cuatrimestral',
  SixMonth: 'Semestral',
  FullYear: 'Anual',
};

/** Orden de presentación de las cadencias en selects y listados. */
export const TERM_KINDS = Object.keys(TERM_KIND_LABELS) as TermKind[];

/**
 * Label de una cadencia para mostrar al usuario ("Cuatrimestral"). Si llega un valor que este
 * frontend no conoce todavía, lo devuelve tal cual antes que romper: esto formatea, no valida.
 */
export function formatTermKind(kind: TermKind | string): string {
  return TERM_KIND_LABELS[kind as TermKind] ?? kind;
}

/** Ordinales en masculino: acompañan a "cuatrimestre", "bimestre", "semestre". */
const ORDINALS: Record<number, string> = {
  1: '1er',
  2: '2do',
  3: '3er',
  4: '4to',
  5: '5to',
  6: '6to',
};

const TERM_NOUNS: Record<Exclude<TermKind, 'FullYear'>, { long: string; short: string }> = {
  FourMonth: { long: 'cuatrimestre', short: 'cuatri' },
  SixMonth: { long: 'semestre', short: 'sem' },
  TwoMonth: { long: 'bimestre', short: 'bim' },
};

type FormatOptions = {
  /** Abrevia el sustantivo ("1er cuatri") para lugares con poco ancho. Nunca lo codifica. */
  short?: boolean;
};

/**
 * Cadencia de una materia dentro del año del plan: "1er cuatrimestre", "3er bimestre", "anual".
 *
 * `numberInYear` es null para las materias anuales (invariante del aggregate Subject: una materia
 * anual nunca lleva número de término). Si llega un número sin cadencia conocida, se devuelve algo
 * legible en vez de romper: esta función formatea, no valida.
 */
export function formatTermOfYear(
  kind: TermKind | string,
  numberInYear: number | null | undefined,
  options: FormatOptions = {},
): string {
  if (kind === 'FullYear' || numberInYear === null || numberInYear === undefined) {
    return 'anual';
  }

  const noun = TERM_NOUNS[kind as Exclude<TermKind, 'FullYear'>];
  if (!noun) {
    // Cadencia que este frontend no conoce todavía: mostramos el dato tal cual antes que inventar.
    return `${numberInYear}° ${formatTermKind(kind).toLowerCase()}`;
  }

  const ordinal = ORDINALS[numberInYear] ?? `${numberInYear}°`;
  return `${ordinal} ${options.short ? noun.short : noun.long}`;
}

/**
 * Período lectivo concreto del calendario: "2025 · 2do cuatrimestre", "2025 · anual".
 *
 * Devuelve null cuando no hay período que mostrar, para que el consumidor decida si omite el dato o
 * pone su propio texto. Es el caso de las cursadas viejas sin término vinculado: preferimos no
 * mostrar nada antes que un "2025·1c" inventado.
 */
export function formatAcademicPeriod(
  year: number | null | undefined,
  kind: TermKind | string | null | undefined,
  numberInYear: number | null | undefined,
  options: FormatOptions = {},
): string | null {
  if (year === null || year === undefined) return null;
  if (!kind) return String(year);
  return `${year} · ${formatTermOfYear(kind, numberInYear, options)}`;
}
