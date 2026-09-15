import 'server-only';

import type { Crumb } from '@/components/layout/breadcrumbs';
import { universityShortName } from '@/features/browse-catalog';
import { fetchUniversitiesServer } from '@/features/browse-catalog/api.server';

/**
 * La miga de universidad (nombre corto, link a su ficha) a partir del nombre completo que la
 * ficha de carrera, materia o cátedra ya trae. Esas rutas no exponen el slug de la universidad, así
 * que se resuelve contra el listado completo (MVP, pocas instituciones). `null` si no matchea
 * ninguna: quien llama cae a las migas genéricas en vez de armar una cadena rota.
 */
export async function universityCrumb(universityName: string): Promise<Crumb | null> {
  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.name === universityName);
  if (!university) return null;

  return {
    label: universityShortName(university),
    href: `/universities/${university.slug}/careers`,
  };
}
