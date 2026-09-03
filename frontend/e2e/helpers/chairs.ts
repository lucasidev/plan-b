import type { APIRequestContext, APIResponse } from '@playwright/test';
import { ADMIN } from './personas';

/**
 * Crea una cátedra descartable (con su propia materia y plan de estudios, también descartables)
 * para los specs que necesitan una cátedra que arranque sin una sola voz.
 *
 * Por qué existe: publicar contra Pérez, González o Ruiz (las tres cátedras del seed) ata entre sí
 * a cualquier spec que lo haga, porque el conteo que uno deja es el punto de partida que ve el
 * siguiente. Una cátedra nueva por corrida no depende de nadie ni deja nada para el que viene.
 *
 * Por qué también una materia y un plan nuevos, y no solo la cátedra sobre la materia 211 del
 * seed: el buscador de "Buscá la materia que cursaste" en /reviews/new filtra por el plan
 * DECLARADO del alumno (`fetchPlanSubjectsServer(profile.careerPlanId)`), así que una cátedra
 * colgada de la 211 sería invisible para un alumno de un plan distinto. `createStudent` acepta
 * `careerPlanId` para declarar la carrera de esta corrida al registrar al alumno que va a
 * reseñar por la pantalla real.
 *
 * Los períodos NO son descartables: son de la universidad, no de la materia ni del plan, así que
 * los sembrados (`00000005-...`) sirven igual para una materia nueva.
 */
export interface CreatedChair {
  careerId: string;
  planId: string;
  subjectId: string;
  subjectName: string;
  chairId: string;
  chairName: string;
}

export interface CreateChairOptions {
  /** Prefijo legible del tag random, para identificar de qué spec salió al debuggear. */
  label?: string;
}

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';

function randomTag(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

async function ensureOk(response: APIResponse, step: string): Promise<void> {
  if (response.ok()) return;
  const body = await response.text().catch(() => '<no body>');
  throw new Error(`createChair: ${step} failed with ${response.status()}: ${body}`);
}

export async function createChair(
  request: APIRequestContext,
  opts: CreateChairOptions = {},
): Promise<CreatedChair> {
  const tag = randomTag();
  const label = opts.label ?? 'E2E';

  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  await ensureOk(signIn, 'admin sign-in');

  const careerResp = await request.post(`/api/academic/universities/${UNSTA_ID}/careers`, {
    data: { name: `Carrera ${label} ${tag}`, slug: `carrera-${label}-${tag}`.toLowerCase() },
  });
  await ensureOk(careerResp, 'create career');
  const careerId = ((await careerResp.json()) as { id: string }).id;

  const planResp = await request.post(`/api/academic/careers/${careerId}/plans`, {
    data: { year: new Date().getFullYear(), label: `plan-${label}-${tag}`.toLowerCase() },
  });
  await ensureOk(planResp, 'create plan');
  const planId = ((await planResp.json()) as { id: string }).id;

  const subjectName = `Materia ${label} ${tag}`;
  const subjectResp = await request.post(`/api/academic/career-plans/${planId}/subjects`, {
    data: {
      code: `${label}${tag}`.toUpperCase(),
      name: subjectName,
      yearInPlan: 1,
      termInYear: 1,
      termKind: 'FourMonth',
      weeklyHours: 6,
      totalHours: 96,
    },
  });
  await ensureOk(subjectResp, 'create subject');
  const subjectId = ((await subjectResp.json()) as { id: string }).id;

  // Sin el prefijo "Cátedra": las pantallas que la listan (ficha pública, backoffice, el picker de
  // /reviews/new) lo agregan ellas, así que el nombre crudo es lo que hay que buscar en cada una.
  const chairName = `${label} ${tag}`;
  const chairResp = await request.post(`/api/academic/subjects/${subjectId}/chairs`, {
    data: { name: chairName },
  });
  await ensureOk(chairResp, 'create chair');
  const chairId = ((await chairResp.json()) as { id: string }).id;

  return { careerId, planId, subjectId, subjectName, chairId, chairName };
}
