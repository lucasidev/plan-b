import { describe, expect, it } from 'vitest';
import { breadcrumbsForPath, memberRoutes } from './member-shell';

describe('memberRoutes', () => {
  it('Explorar declara los activePrefixes de las dos lentes del catálogo', () => {
    const explore = memberRoutes.find((r) => r.path === '/universities');
    expect(explore?.activePrefixes).toEqual([
      '/universities',
      '/careers',
      '/subjects',
      '/chairs',
      '/teachers',
      '/plans',
    ]);
  });

  it('Mis aportes pide sesión, Explorar no', () => {
    const contributions = memberRoutes.find((r) => r.path === '/reviews/mine');
    const explore = memberRoutes.find((r) => r.path === '/universities');
    expect(contributions?.requiresSession).toBe(true);
    expect(explore?.requiresSession).toBeUndefined();
  });

  it('Ajustes se gatea para quien no es member, Explorar no', () => {
    const settings = memberRoutes.find((r) => r.path === '/settings');
    const explore = memberRoutes.find((r) => r.path === '/universities');
    expect(settings?.gateWhenAnonymous).toBe(true);
    expect(explore?.gateWhenAnonymous).toBeUndefined();
  });
});

describe('breadcrumbsForPath', () => {
  it.each([
    ['/universities', ['Explorar', 'Universidades']],
    ['/careers', ['Explorar', 'Carreras']],
    ['/universities/unsta/careers', ['Explorar', 'Universidad']],
    ['/careers/career-1', ['Explorar', 'Carrera']],
    ['/careers/career-1/plans', ['Explorar', 'Planes de estudio']],
    ['/plans/plan-1/subjects', ['Explorar', 'Plan']],
    ['/careers/career-1/where-to-study', ['Explorar', 'Dónde estudiarla']],
    ['/subjects/subject-1', ['Explorar', 'Materia']],
    ['/chairs/chair-1', ['Explorar', 'Cátedra']],
    ['/teachers/teacher-1', ['Explorar', 'Docente']],
    ['/method', ['Método']],
    ['/about', ['Sobre plan-b']],
    ['/reviews/mine', ['Mis aportes']],
    ['/reviews/new', ['Reseñar una cursada']],
    ['/settings', ['Otros', 'Ajustes']],
    ['/help', ['Otros', 'Ayuda']],
  ])('%s -> %j', (pathname, expected) => {
    expect(breadcrumbsForPath(pathname)).toEqual(expected);
  });
});
