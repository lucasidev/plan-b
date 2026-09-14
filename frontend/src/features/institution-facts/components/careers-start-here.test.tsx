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

    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Ingeniería en Sistemas',
      'Ingeniería Civil',
      'Abogacía',
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

    expect(screen.getByRole('link', { name: 'Ingeniería en Sistemas' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abogacía' })).not.toBeInTheDocument();
  });

  it('sin ninguna carrera con reseñas, la sección no se dibuja', () => {
    const { container } = render(
      <CareersStartHere
        coverage={[coverage({ careerId: 'a', voiceCount: 0, hasReviewsBelowFloor: true })]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
