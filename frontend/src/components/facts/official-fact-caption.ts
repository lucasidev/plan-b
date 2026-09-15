import type { OfficialFact } from './types';

/**
 * Lo que va debajo del valor de un dato oficial (ADR-0090, `V.career` línea 511 de la maqueta
 * aprobada): compartido por la ficha de carrera (cada fila de "Datos oficiales"), la de
 * institución ("Identidad institucional" y cada fila de "Transparencia").
 *
 * Derivado siempre remite a Método: la nota larga del proxy vive ahí, no acá. Publicado siempre
 * lleva su fuente con período (ADR-0090 no admite un dato sin fuente); si además tiene nota, va
 * primero, separada por un espacio cuando la nota ya cierra en punto y por " · " si no. Los demás
 * estados (no publicado, no aplica, pedido) muestran su nota; sin nota, caen a la fuente con
 * período, para no dejar la fila sin decir de dónde sale.
 */
export function officialFactCaption(fact: OfficialFact): string {
  if (fact.status === 'Derived') {
    return 'Derivado · la regla está en Método';
  }

  const sourceWithPeriod = fact.period ? `${fact.sourceName} · ${fact.period}` : fact.sourceName;

  if (fact.status === 'Published') {
    if (!fact.note) return sourceWithPeriod;
    const separator = fact.note.trim().endsWith('.') ? ' ' : ' · ';
    return `${fact.note}${separator}${sourceWithPeriod}`;
  }

  return fact.note ?? sourceWithPeriod;
}
