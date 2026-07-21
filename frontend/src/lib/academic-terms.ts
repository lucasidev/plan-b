/**
 * Cadencia académica: el valor canónico (inglés, espeja `TermKind` del backend) y su label en
 * español para la UI.
 *
 * El valor viaja por el wire y se compara en código; el label es lo único que ve el alumno. Tener
 * las dos cosas en un solo lugar evita que cada form arme su propio mapa (había tres copias) y que
 * las vistas de solo lectura muestren el valor crudo: sin esto, renombrar el enum a inglés hacía
 * que la ficha de una materia dijera "FourMonth" en vez de "Cuatrimestral".
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
 * Label de una cadencia para mostrar al usuario. Si llega un valor que este frontend no conoce
 * todavía, lo devuelve tal cual antes que romper: esto formatea, no valida.
 */
export function formatTermKind(kind: TermKind | string): string {
  return TERM_KIND_LABELS[kind as TermKind] ?? kind;
}
