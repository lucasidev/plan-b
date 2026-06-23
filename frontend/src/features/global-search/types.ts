/**
 * DTOs de la búsqueda global de catálogo (US-004). Espejan el body de GET /api/search.
 *
 * `type` discrimina el tipo de resultado: hoy solo `subject`. La rama `teacher` se injerta cuando
 * aterrice US-063 (no hay entidad Teacher todavía); sumarla acá es additiva (un literal más en la
 * unión + su rama en `hrefFor`).
 */
export type SearchResultType = 'subject';

export type SearchResultItem = {
  type: SearchResultType;
  id: string;
  label: string;
  sublabel: string;
};

export type SearchResponse = {
  items: SearchResultItem[];
};
