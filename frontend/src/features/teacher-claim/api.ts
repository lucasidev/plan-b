import { clientApiFetch } from '@/lib/api-client';

/** Mínimo de chars para disparar la búsqueda (espeja el AC del backend: 400 si es menor). */
export const MIN_TEACHER_SEARCH_LENGTH = 2;

export type TeacherSearchResult = {
  id: string;
  name: string;
  title: string;
};

// Shape del body de GET /api/search (contrato público discriminado por `type`). Lo declaramos
// inline en vez de importar el type de global-search para no acoplar features.
type RawSearchItem = { type: string; id: string; label: string; sublabel: string };
type RawSearchResponse = { items: RawSearchItem[] };

/**
 * Busca docentes para el picker del claim (US-030). Reusa `GET /api/search` (US-004) y filtra a
 * `type: 'teacher'` del lado cliente: el flow de claim solo aplica a docentes, no a materias.
 */
export async function searchTeachers(term: string): Promise<TeacherSearchResult[]> {
  const response = await clientApiFetch(`/api/search?q=${encodeURIComponent(term)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Teacher search failed: ${response.status}`);
  }
  const body = (await response.json()) as RawSearchResponse;
  return body.items
    .filter((item) => item.type === 'teacher')
    .map((item) => ({ id: item.id, name: item.label, title: item.sublabel }));
}
