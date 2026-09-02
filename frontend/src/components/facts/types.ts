/**
 * Una frase publicada y su distribución, tal como las publica cualquier ficha (ADR-0083).
 *
 * Viven acá y no dentro de una ficha porque los comparten la ficha de cátedra y la muestra de la
 * entrada, que enseña una ficha real. Es la forma de lo que el producto publica de una frase: qué se
 * preguntó, qué eligió la mayoría con su etiqueta literal, y la distribución completa.
 */

export interface PublishedItem {
  code: string;
  text: string;
  modeLabel: string;
  modePercent: number;
  modeIsNegative: boolean;
  total: number;
  distribution: DistributionSlice[];
  /**
   * El tramo de antes, cuando la pregunta cambió y se abrió un código nuevo (US-198). Cuelga del
   * frase de hoy porque es la misma pregunta antes de dejar de serlo, y se dibuja separada porque
   * los dos tramos no se comparan entre sí. No se suman nunca: cada uno tiene su propio total.
   */
  previousSeries?: PublishedItem | null;
  /** Cuándo dejó de preguntarse. Solo lo trae un tramo viejo: es la fecha del corte. */
  retiredAt?: string | null;
}

export interface DistributionSlice {
  label: string;
  percent: number;
  isNegative: boolean;
}
