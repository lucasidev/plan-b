import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CareerCoverage } from '@/features/browse-catalog';
import { CareersStartHere } from './careers-start-here';

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

describe('CareersStartHere', () => {
  it('lista las carreras con reseñas, de más a menos', () => {
    render(
      <CareersStartHere
        coverage={[
          coverage({ careerId: 'a', careerName: 'Abogacía', voiceCount: 94 }),
          coverage({ careerId: 'b', careerName: 'Ingeniería en Sistemas', voiceCount: 412 }),
          coverage({ careerId: 'c', careerName: 'Ingeniería Civil', voiceCount: 187 }),
        ]}
      />,
    );

    // La fila entera es el link (nombre + cobertura + flecha), como el resto de las fichas
    // portadas: el nombre solo ya no alcanza para distinguir las filas por accessible name.
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Ingeniería en Sistemas412 reseñas→',
      'Ingeniería Civil187 reseñas→',
      'Abogacía94 reseñas→',
    ]);
    expect(screen.getByText('412 reseñas')).toBeInTheDocument();
  });

  it('deja afuera las carreras sin voces publicadas, aunque tengan carga bajo el piso', () => {
    render(
      <CareersStartHere
        coverage={[
          coverage({
            careerId: 'a',
            careerName: 'Abogacía',
            voiceCount: 0,
            hasReviewsBelowFloor: true,
          }),
          coverage({ careerId: 'b', careerName: 'Ingeniería en Sistemas', voiceCount: 10 }),
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: /Ingeniería en Sistemas/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Abogacía/ })).not.toBeInTheDocument();
  });

  it('sin ninguna carrera con reseñas, la sección no se dibuja', () => {
    const { container } = render(
      <CareersStartHere
        coverage={[coverage({ careerId: 'a', voiceCount: 0, hasReviewsBelowFloor: true })]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  /** Maqueta aprobada (V.university().aside línea 495): con una sola carrera medida en toda la institución. */
  it('con una sola carrera con reseñas, dice "la única carrera con reseñas por ahora" y sus materias', () => {
    render(
      <CareersStartHere
        coverage={[
          coverage({
            careerId: 'a',
            careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
            voiceCount: 137,
            totalSubjects: 21,
            coveredSubjects: 4,
          }),
        ]}
      />,
    );

    expect(
      screen.getByText('la única carrera con reseñas por ahora · 4 de 21 materias'),
    ).toBeInTheDocument();
  });

  it('con varias carreras con reseñas, cada una dice su propio conteo y sus materias', () => {
    render(
      <CareersStartHere
        coverage={[
          coverage({
            careerId: 'a',
            careerName: 'Abogacía',
            voiceCount: 67,
            totalSubjects: 21,
            coveredSubjects: 4,
          }),
          coverage({
            careerId: 'b',
            careerName: 'Ingeniería en Sistemas',
            voiceCount: 412,
            totalSubjects: 30,
            coveredSubjects: 10,
          }),
        ]}
      />,
    );

    expect(screen.getByText('67 reseñas · 4 de 21 materias')).toBeInTheDocument();
    expect(screen.getByText('412 reseñas · 10 de 30 materias')).toBeInTheDocument();
  });

  it('con totalSubjects 0, la línea no suma la parte de materias', () => {
    render(
      <CareersStartHere
        coverage={[
          coverage({
            careerId: 'a',
            careerName: 'Carrera sin plan cargado',
            voiceCount: 5,
            totalSubjects: 0,
          }),
        ]}
      />,
    );

    expect(screen.getByText('la única carrera con reseñas por ahora')).toBeInTheDocument();
    expect(screen.queryByText(/de \d+ materias/)).not.toBeInTheDocument();
  });
});
