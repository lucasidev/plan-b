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

/**
 * Un dato oficial (ADR-0090), tal como lo publica `GET /api/academic/official-facts`: la
 * afirmación vigente de un sujeto y campo, con su valor, su fuente y su estado. Comparten esta
 * forma la ficha de carrera y la de institución (y, después, Dónde estudiarla): el mismo sujeto
 * nunca se muestra de dos formas distintas.
 */
export interface OfficialFact {
  id: string;
  /** Código del vocabulario curado (`paper_duration`, `minutes_published`, ...). Ver `OFFICIAL_FACT_LABELS`. */
  field: string;
  status: OfficialFactStatus;
  /** El valor tal como se publica. `null` cuando el estado no trae un dato (todos salvo Published/Derived). */
  value: string | null;
  unit: string | null;
  /** A qué período refiere el dato, distinto de `relievedAt`. */
  period: string | null;
  sourceName: string;
  sourceUrl: string;
  /** La regla de Método que citó el cálculo (ADR-0090). Solo la trae un `Derived`; el link de la ficha usa este id como fragmento (`/method#id`). */
  derivationRuleId: string | null;
  /** Una frase para la ficha cuando el estado la necesita (la razón de un NotApplicable, el detalle de un NotPublished). */
  note: string | null;
  /** Cuándo se relevó esta afirmación (ISO 8601). */
  relievedAt: string;
}

export type OfficialFactStatus =
  | 'Published'
  | 'Derived'
  | 'NotPublished'
  | 'Requested'
  | 'NotApplicable';
