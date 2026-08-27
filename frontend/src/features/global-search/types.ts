/**
 * DTOs de la búsqueda global de catálogo (US-004, US-132). Espejan el body de GET /api/search.
 *
 * `type` discrimina el tipo de resultado: `subject` (materia), `teacher` (docente) o `chair`
 * (cátedra). El front deriva el href y el label del badge del par (type, id).
 *
 * La cátedra está porque es el sujeto de lo que el producto publica: buscar un apellido tiene que
 * poder llevar a lo que se dice de cursar con esa cátedra, no solo a la persona.
 */
export type SearchResultType = 'subject' | 'teacher' | 'chair';

export type SearchResultItem = {
  type: SearchResultType;
  id: string;
  label: string;
  sublabel: string;
};

export type SearchResponse = {
  items: SearchResultItem[];
};
