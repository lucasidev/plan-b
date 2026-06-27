/**
 * DTOs de la búsqueda global de catálogo (US-004). Espejan el body de GET /api/search.
 *
 * `type` discrimina el tipo de resultado: `subject` (materia) o `teacher` (docente). El front deriva
 * el href y el label del badge del par (type, id).
 */
export type SearchResultType = 'subject' | 'teacher';

export type SearchResultItem = {
  type: SearchResultType;
  id: string;
  label: string;
  sublabel: string;
};

export type SearchResponse = {
  items: SearchResultItem[];
};
