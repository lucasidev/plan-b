import type { Career } from '@/features/browse-catalog';
import { numberInWords } from '@/features/browse-catalog';

/**
 * La línea bajo el h1 de la ficha de institución (SC-005): cuántas carreras, en cuántas unidades
 * académicas. Nunca "facultad" para una unidad que no lo es (por ejemplo un centro regional): la
 * cuenta dice "facultades" solo cuando TODAS las unidades con carreras cargadas lo son.
 */
export function describeInstitutionCareers(careers: readonly Career[]): string | null {
  if (careers.length === 0) return null;

  const units = [
    ...new Set(
      careers
        .map((career) => career.academicUnitName)
        .filter((name): name is string => name !== null),
    ),
  ];
  const allFaculties =
    units.length > 0 && units.every((name) => name.toLowerCase().includes('facultad'));
  const unitNoun = allFaculties
    ? units.length === 1
      ? 'facultad'
      : 'facultades'
    : units.length === 1
      ? 'unidad académica'
      : 'unidades académicas';

  return `${careers.length} ${careers.length === 1 ? 'carrera' : 'carreras'} en ${units.length} ${unitNoun}.`;
}

/**
 * "Una carrera medida: la X." con una sola, la cantidad en palabras con varias, nada sin ninguna:
 * mismo criterio que el resto de la ficha, nunca "0 carreras medidas".
 */
export function describeMeasuredCareers(
  measuredCareers: readonly { careerName: string }[],
): string | null {
  if (measuredCareers.length === 0) return null;
  if (measuredCareers.length === 1) {
    return `Una carrera medida: la ${measuredCareers[0].careerName}.`;
  }

  const word = numberInWords(measuredCareers.length);
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} carreras medidas.`;
}
