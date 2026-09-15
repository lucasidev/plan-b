import 'server-only';

import type { Crumb } from '@/components/layout/breadcrumbs';
import { universityShortName } from '@/features/browse-catalog';
import {
  fetchCatalogCoverageServer,
  fetchPlanServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';

/**
 * La miga de universidad (nombre corto, link a su ficha) a partir de su id. Se resuelve por id y
 * no por nombre: el nombre no es único entre instituciones, el id sí (`UniversityConfiguration.cs`).
 * `null` si no matchea ninguna o si el pedido falla: quien llama cae a las migas genéricas en vez
 * de armar una cadena rota o tirar la página entera.
 */
async function universityCrumbById(universityId: string): Promise<Crumb | null> {
  try {
    const universities = await fetchUniversitiesServer();
    const university = universities.find((u) => u.id === universityId);
    if (!university) return null;

    return {
      label: universityShortName(university),
      href: `/universities/${university.slug}/careers`,
    };
  } catch {
    return null;
  }
}

/**
 * Miga de universidad para la ficha de materia o de cátedra, a partir del plan de carrera
 * (`CareerPlanSummary.universityId`): las dos ya traen `careerPlanId`. `null` ante cualquier
 * fallo, incluido el plan que no existe.
 */
export async function universityCrumbByPlan(careerPlanId: string): Promise<Crumb | null> {
  try {
    const plan = await fetchPlanServer(careerPlanId);
    if (!plan) return null;
    return universityCrumbById(plan.universityId);
  } catch {
    return null;
  }
}

/**
 * Miga de universidad para la ficha de carrera, a partir de la cobertura del catálogo entero
 * (`CareerCoverage.universityId`): la ficha de carrera no trae `careerPlanId` propio. `null` ante
 * cualquier fallo, incluida una carrera que no aparece en la cobertura.
 */
export async function universityCrumbByCareer(careerId: string): Promise<Crumb | null> {
  try {
    const coverage = await fetchCatalogCoverageServer();
    const entry = coverage.find((c) => c.careerId === careerId);
    if (!entry) return null;
    return universityCrumbById(entry.universityId);
  } catch {
    return null;
  }
}
