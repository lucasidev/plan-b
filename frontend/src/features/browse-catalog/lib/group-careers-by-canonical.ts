import type { CareerCoverage } from '../types';

/** Un grupo de carrera canónica (US-195) dictado en dos o más instituciones distintas. */
export type CanonicalCareerGroup = {
  canonicalGroupName: string;
  /** Alfabético por institución (US-171): nunca por voces ni por cobertura. */
  offerings: CareerCoverage[];
};

export type CareersByCanonical = {
  /** Grupos con dos o más `universityId` distintos, alfabético por nombre canónico. */
  multiInstitution: CanonicalCareerGroup[];
  /** El resto: sin grupo canónico, o agrupadas con una sola institución. Alfabético por carrera. */
  singleInstitution: CareerCoverage[];
};

/**
 * Agrupa el catálogo de carreras por su carrera canónica, para la lente de Carreras de Explorar
 * (US-222, ADR-0096): lo que se dicta en más de una institución se compara lado a lado, lo que no,
 * queda en una lista aparte. Alfabético en todo (US-171): nunca por voces ni por cobertura.
 */
export function groupCareersByCanonical(careers: readonly CareerCoverage[]): CareersByCanonical {
  const byGroupName = new Map<string, CareerCoverage[]>();
  const withoutGroup: CareerCoverage[] = [];

  for (const career of careers) {
    if (!career.canonicalGroupName) {
      withoutGroup.push(career);
      continue;
    }
    const offerings = byGroupName.get(career.canonicalGroupName);
    if (offerings) {
      offerings.push(career);
    } else {
      byGroupName.set(career.canonicalGroupName, [career]);
    }
  }

  const multiInstitution: CanonicalCareerGroup[] = [];
  const fromSmallGroups: CareerCoverage[] = [];

  for (const [canonicalGroupName, offerings] of byGroupName) {
    const distinctUniversities = new Set(offerings.map((offering) => offering.universityId)).size;
    if (distinctUniversities >= 2) {
      multiInstitution.push({
        canonicalGroupName,
        offerings: [...offerings].sort((a, b) =>
          a.universityName.localeCompare(b.universityName, 'es'),
        ),
      });
    } else {
      fromSmallGroups.push(...offerings);
    }
  }

  return {
    multiInstitution: multiInstitution.sort((a, b) =>
      a.canonicalGroupName.localeCompare(b.canonicalGroupName, 'es'),
    ),
    singleInstitution: [...withoutGroup, ...fromSmallGroups].sort((a, b) =>
      a.careerName.localeCompare(b.careerName, 'es'),
    ),
  };
}
