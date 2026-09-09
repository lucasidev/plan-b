import type { OfficialFact } from '@/components/facts';

/**
 * Dónde estudiarla, tal como baja de `GET /api/academic/career-comparison` (SC-008, US-128,
 * ADR-0090, R6 tarea 5): la misma carrera canónica, en las instituciones de una ciudad.
 */
export interface CareerComparison {
  /** El nombre que el equipo le dio al grupo (US-195). Null cuando la carrera de partida no está agrupada con ninguna otra. */
  groupName: string | null;
  /** La localidad resuelta, o la provincia cuando ninguna localidad resolvió contra Georef. */
  cityLabel: string;
  /** True cuando `cityLabel` es la provincia, no una ciudad puntual: no se finge una ciudad que no se sabe. */
  isProvinceFallback: boolean;
  offerings: CareerComparisonOffering[];
}

/**
 * Una tarjeta de la comparación: identidad de la oferta y sus datos oficiales, con la misma forma
 * (`OfficialFact`) que el bloque de la ficha de carrera.
 */
export interface CareerComparisonOffering {
  careerId: string;
  careerName: string;
  universityId: string;
  universityName: string;
  academicUnitName: string | null;
  /** La localidad real de esta oferta (puede ser distinta de la aglomeración que agrupa la comparación, ver `cityLabel`). Null cuando no resolvió contra Georef. */
  localityName: string | null;
  /** "Pública" o "Privada". Null cuando ese dato todavía no está publicado. */
  institutionKind: string | null;
  facts: OfficialFact[];
}
