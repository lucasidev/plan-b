import 'server-only';

import {
  fetchCareerPlansServer,
  fetchCareersByUniversityServer,
} from '@/features/manage-careers/api.server';
import { fetchSubjectsByPlanServer } from '@/features/manage-subjects/api.server';
import type { AdminTeacherRow } from '@/features/manage-teachers';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type {
  CommissionSubjectOption,
  CommissionTeacherOption,
  SubjectCommissionRow,
  TermCommissionRow,
} from './types';

/**
 * Listado global de comisiones de un término, cross-materia (US-093, pantalla principal). GET
 * /api/academic/terms/{termId}/commissions, gateado a rol admin. Trae activas + inactivas. Un termId
 * con formato válido pero inexistente devuelve `items: []` (no 404): el reader del backend no
 * distingue ese caso.
 */
export async function fetchTermCommissionsServer(termId: string): Promise<TermCommissionRow[]> {
  const res = await apiFetchAuthenticated(`/api/academic/terms/${termId}/commissions`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`term commissions list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: TermCommissionRow[] };
  return data.items;
}

/**
 * Listado admin de las comisiones de una materia en un término. GET
 * /api/academic/subjects/{subjectId}/commissions/admin?termId= (admin). No hay GET de detalle de
 * comisión por id: el form de edición reconstruye el detalle de UNA comisión buscando acá por id (es
 * el único listado que expone `notes`).
 */
export async function fetchCommissionsBySubjectAndTermServer(
  subjectId: string,
  termId: string,
): Promise<SubjectCommissionRow[]> {
  const res = await apiFetchAuthenticated(
    `/api/academic/subjects/${subjectId}/commissions/admin?termId=${termId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    throw new Error(`subject commissions list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: SubjectCommissionRow[] };
  return data.items;
}

/**
 * Docentes de una universidad, para el selector de asignación del form (US-093). GET
 * /api/academic/teachers?universityId= (admin, mismo endpoint que `manage-teachers`, filtrado acá con
 * su query param opcional en vez de reusar el fetcher sin filtro de esa feature).
 */
export async function fetchTeachersByUniversityServer(
  universityId: string,
): Promise<CommissionTeacherOption[]> {
  const res = await apiFetchAuthenticated(`/api/academic/teachers?universityId=${universityId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`admin teachers list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AdminTeacherRow[] };
  return data.items.map((t) => ({ id: t.id, firstName: t.firstName, lastName: t.lastName }));
}

/**
 * Materias elegibles para crear una comisión nueva, de toda la universidad (US-093). No existe un
 * listado admin "materias por universidad" (el catálogo solo lista por plan,
 * `fetchSubjectsByPlanServer` de `manage-subjects`): se recorre universidad -> carreras activas ->
 * plan vigente de cada carrera -> materias activas de ese plan, y se aplana en una sola lista
 * rotulada con carrera/plan. El fan-out es acotado (backoffice de baja frecuencia, catálogo chico por
 * universidad) y corre en paralelo con Promise.all en cada nivel.
 */
export async function fetchCommissionSubjectOptionsServer(
  universityId: string,
): Promise<CommissionSubjectOption[]> {
  const careers = await fetchCareersByUniversityServer(universityId);
  const activeCareers = careers.filter((c) => c.isActive);

  const plansByCareer = await Promise.all(
    activeCareers.map((career) => fetchCareerPlansServer(career.id)),
  );

  const subjectGroups = await Promise.all(
    activeCareers.flatMap((career, i) =>
      plansByCareer[i]
        .filter((plan) => plan.status === 'Active')
        .map(async (plan) => ({
          career,
          plan,
          subjects: await fetchSubjectsByPlanServer(plan.id),
        })),
    ),
  );

  return subjectGroups
    .flatMap(({ career, plan, subjects }) =>
      subjects
        .filter((s) => s.isActive)
        .map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          termKind: s.termKind,
          careerName: career.name,
          planLabel: plan.label,
        })),
    )
    .sort((a, b) => a.careerName.localeCompare(b.careerName) || a.code.localeCompare(b.code));
}
