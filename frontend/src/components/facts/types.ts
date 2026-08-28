/**
 * Un ítem publicado y su distribución, tal como los publica cualquier ficha (ADR-0083).
 *
 * Viven acá y no dentro de una ficha porque los comparten la ficha de cátedra y la muestra de la
 * entrada, que enseña una ficha real. Es la forma de lo que el producto publica de un ítem: qué se
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
}

export interface DistributionSlice {
  label: string;
  percent: number;
  isNegative: boolean;
}
