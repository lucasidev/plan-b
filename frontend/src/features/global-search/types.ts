/**
 * DTOs de la búsqueda global de catálogo (US-004, US-132). Espejan el body de GET /api/search.
 *
 * `type` discrimina el tipo de resultado: `subject` (materia), `teacher` (docente), `chair`
 * (cátedra), `career` (carrera en una institución) o `institution` (institución). El front deriva
 * el href y el label del badge del par (type, id).
 *
 * La cátedra está porque es el sujeto de lo que el producto publica: buscar un apellido tiene que
 * poder llevar a lo que se dice de cursar con esa cátedra, no solo a la persona.
 */
export type SearchResultType = 'subject' | 'teacher' | 'chair' | 'career' | 'institution';

export type SearchResultItem = {
  type: SearchResultType;
  id: string;
  label: string;
  sublabel: string;
};

export type SearchResponse = {
  items: SearchResultItem[];
};

/**
 * Directorio mínimo de universidades (US-132). Un resultado `institution` no tiene id de ruta
 * propio: su chasis de hoy (`/universities/[slug]/careers`, ver SC-005) resuelve por slug, no por
 * id, así que el front necesita este mapeo para armar el href.
 */
export type UniversityDirectoryEntry = {
  id: string;
  slug: string;
};
