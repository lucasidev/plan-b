/**
 * El copy de cobertura del catálogo (US-222, ficha de SC-003): lo mínimo honesto de una carrera
 * (datos oficiales, voces, cobertura) sin que se lea como puntaje ni ranking. Vive acá y no en el
 * componente porque son funciones puras, testeables sin montar nada (mismo criterio que
 * `group-subjects.ts`).
 */

export type CareerCoverageMeta = {
  hasOfficialData: boolean;
  /** Ya respeta el piso de publicación: nunca el conteo crudo de una cátedra que no lo cruzó. */
  voiceCount: number;
  /** Hay reseñas cargadas que todavía no cruzan el piso de alguna cátedra: no dice cuántas. */
  hasReviewsBelowFloor: boolean;
  totalSubjects: number;
  coveredSubjects: number;
};

/**
 * Si hay algo para leer antes de entrar: un dato oficial o al menos una voz publicada. Ninguna de
 * las dos cuenta como "nada" aunque la otra esté vacía (una carrera puede tener duración oficial
 * sin que nadie la haya reseñado todavía). Reseñas bajo el piso no cuentan: existen, pero todavía
 * no hay nada que leer de ellas.
 */
export function hasSomethingToRead(career: CareerCoverageMeta): boolean {
  return career.hasOfficialData || career.voiceCount > 0;
}

/** "sin voces todavía" salvo que ya haya reseñas cargándose sin cruzar el piso: ese caso se nombra aparte, nunca con el número. */
function noVoicesYetLabel(career: CareerCoverageMeta): string {
  return career.hasReviewsBelowFloor ? 'todavía sin datos publicables' : 'sin voces todavía';
}

/**
 * La línea de meta de una entrada. Nunca un porcentaje ni un orden implícito: "X de Y materias"
 * dice cuánto se midió sin sonar a nota. El vacío se dice con palabras, nunca con un cero solo.
 */
export function describeCareerCoverage(career: CareerCoverageMeta): string {
  if (!hasSomethingToRead(career)) {
    return career.hasReviewsBelowFloor
      ? 'Hay reseñas cargándose: todavía sin datos publicables.'
      : 'Todavía no tenemos nada para leer.';
  }

  const parts: string[] = [];
  if (career.hasOfficialData) {
    parts.push('Datos oficiales');
  }

  if (career.voiceCount > 0) {
    const voices = `${career.voiceCount} ${career.voiceCount === 1 ? 'voz' : 'voces'}`;
    parts.push(
      career.totalSubjects > 0
        ? `${voices} · ${career.coveredSubjects} de ${career.totalSubjects} ${
            career.totalSubjects === 1 ? 'materia' : 'materias'
          }`
        : voices,
    );
  } else {
    parts.push(noVoicesYetLabel(career));
  }

  return parts.join(' · ');
}

/** Lo que junta una materia del plan (US-134, SC-018): cuántas cátedras y reseñas, o ninguna
 * todavía. Ausente en vez de cero cuando la materia no tiene ninguna reseña con cátedra. */
export type SubjectCoverageMeta = {
  reviewCount: number;
  chairCount: number;
};

/**
 * La línea de meta de una materia en la grilla del plan: "28 reseñas en 3 cátedras" o "sin
 * reseñas". Misma forma que usa la ficha de materia (que lista TODAS sus cátedras, publiquen o
 * no): "N cátedras" a secas se leía como el total de cátedras de la materia, y acá es solo las
 * que tienen al menos una reseña.
 */
export function describeSubjectCoverage(coverage?: SubjectCoverageMeta): string {
  if (!coverage || coverage.reviewCount === 0) {
    return 'sin reseñas';
  }

  const reviews = `${coverage.reviewCount} ${coverage.reviewCount === 1 ? 'reseña' : 'reseñas'}`;
  const chairs = `${coverage.chairCount} ${coverage.chairCount === 1 ? 'cátedra' : 'cátedras'}`;
  return `${reviews} en ${chairs}`;
}

/** La línea de meta de una institución: cuántas carreras tiene y cuántas de esas tienen algo para leer. */
export function describeUniversityCoverage(
  careerCount: number,
  withSomethingToRead: number,
): string {
  if (careerCount === 0) {
    return 'Todavía sin carreras cargadas.';
  }

  const careers = `${careerCount} ${careerCount === 1 ? 'carrera' : 'carreras'}`;
  return `${careers} · ${withSomethingToRead} con algo para leer`;
}
