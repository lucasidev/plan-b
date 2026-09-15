/**
 * La ficha de una carrera tal como baja del backend (US-127, US-134, ADR-0085).
 *
 * Espeja `GetCareerFactsResponse`. Alcance acotado a lo que tiene fuente real hoy: identidad, la
 * cobertura (US-134) y las notas del equipo (ADR-0084). Cuánto dura en el papel sale aparte, del
 * dato oficial `paper_duration` (ADR-0090): el backend lo releva como texto libre ("2 años y
 * medio"), no como un número que esta ficha pueda formatear. "Qué frena la cursada" necesita un
 * corpus de reseñas y todavía no viaja acá.
 */
export interface CareerFacts {
  careerId: string;
  careerName: string;
  universityName: string;
  /** La facultad o unidad que dicta la carrera. Null cuando el catálogo todavía no la vinculó. */
  academicUnitName: string | null;
  totalSubjects: number;
  coveredSubjects: number;
  coveragePercent: number;
  editorialNotes: EditorialNote[];
}

/**
 * Una nota del equipo sobre la carrera (ADR-0084): la síntesis de lo que se leyó en el campo libre.
 * Sin autor, porque la firma el equipo. La procedencia no viaja como dato: es siempre la misma y la
 * dice la ficha.
 */
export interface EditorialNote {
  id: string;
  text: string;
  publishedAt: string;
}
