/**
 * La ficha de una carrera tal como baja del backend (US-127, US-134, ADR-0085).
 *
 * Espeja `GetCareerFactsResponse`. Alcance acotado a lo que tiene fuente real hoy: identidad,
 * cuánto dura en el papel (`durationYears`, la otra mitad de US-127 todavía no tiene relevamiento
 * propio) y la cobertura (US-134). "Qué frena la cursada" y la nota de curaduría necesitan un
 * corpus de reseñas que hoy es cero y no viajan acá.
 */
export interface CareerFacts {
  careerId: string;
  careerName: string;
  universityName: string;
  durationYears: number | null;
  totalSubjects: number;
  coveredSubjects: number;
  coveragePercent: number;
}
