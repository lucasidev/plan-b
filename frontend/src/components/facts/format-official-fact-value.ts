/**
 * El valor de un dato oficial, con su unidad (ADR-0090: `years`, `percent`, `count`,
 * `currency_ars`). El backend guarda el valor como texto tipado, no como número: si no parsea
 * como uno, es porque el campo es texto libre (una resolución, un régimen de ingreso) y se
 * muestra tal cual llegó, nunca truncado ni reinterpretado.
 */
export function formatOfficialFactValue(value: string, unit: string | null): string {
  if (unit === null) return value;

  const parsed = Number(value.replace(',', '.'));
  if (Number.isNaN(parsed)) return value;

  const formatted = parsed.toLocaleString('es-AR', { maximumFractionDigits: 2 });

  switch (unit) {
    case 'years':
      return `${formatted} ${parsed === 1 ? 'año' : 'años'}`;
    case 'percent':
      return `${formatted} %`;
    case 'currency_ars':
      return `$ ${formatted}`;
    case 'count':
      return formatted;
    default:
      return value;
  }
}
