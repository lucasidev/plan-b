import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Career, CareerCoverage } from '@/features/browse-catalog';
import { CareersByFaculty } from './careers-by-faculty';

function career(overrides: Partial<Career> & { id: string }): Career {
  return {
    universityId: 'unsta',
    name: 'Carrera',
    slug: 'carrera',
    isOfficial: true,
    academicUnitName: 'Facultad de Ingeniería',
    ...overrides,
  };
}

function coverage(overrides: Partial<CareerCoverage> & { careerId: string }): CareerCoverage {
  return {
    careerName: 'Carrera',
    universityId: 'unsta',
    universityName: 'UNSTA',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: null,
    ...overrides,
  };
}

describe('CareersByFaculty', () => {
  it('con voces publicadas, dice cuántas reseñas', () => {
    render(
      <CareersByFaculty
        careers={[career({ id: 'a', name: 'Ingeniería en Sistemas' })]}
        coverage={[coverage({ careerId: 'a', voiceCount: 412 })]}
      />,
    );

    expect(screen.getByText('412 reseñas')).toBeInTheDocument();
  });

  it('sin voces publicadas pero con carga bajo el piso, dice "con reseñas"', () => {
    render(
      <CareersByFaculty
        careers={[career({ id: 'a', name: 'Ingeniería en Sistemas' })]}
        coverage={[coverage({ careerId: 'a', voiceCount: 0, hasReviewsBelowFloor: true })]}
      />,
    );

    expect(screen.getByText('con reseñas')).toBeInTheDocument();
  });

  it('sin ninguna señal, no dice nada al lado de la carrera', () => {
    render(
      <CareersByFaculty
        careers={[career({ id: 'a', name: 'Ingeniería en Sistemas' })]}
        coverage={[coverage({ careerId: 'a', voiceCount: 0, hasReviewsBelowFloor: false })]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ingeniería en Sistemas' })).toBeInTheDocument();
    expect(screen.queryByText('con reseñas')).not.toBeInTheDocument();
    expect(screen.queryByText(/reseñas$/)).not.toBeInTheDocument();
  });

  it('sin cobertura para esa carrera, tampoco dice nada', () => {
    render(<CareersByFaculty careers={[career({ id: 'a', name: 'Abogacía' })]} coverage={[]} />);

    expect(screen.getByRole('link', { name: 'Abogacía' })).toBeInTheDocument();
  });

  it('sin ninguna carrera cargada, dice el vacío', () => {
    render(<CareersByFaculty careers={[]} coverage={[]} />);

    expect(
      screen.getByText('Esta universidad todavía no tiene carreras cargadas.'),
    ).toBeInTheDocument();
  });
});
