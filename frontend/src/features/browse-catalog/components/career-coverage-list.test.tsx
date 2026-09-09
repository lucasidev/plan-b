import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CareerCoverage } from '../types';
import { CareerCoverageList } from './career-coverage-list';

/**
 * US-222 (browse-catalog/stories/US-222-browse-what-there-is-to-study/scenarios.md) y la ficha de
 * SC-003: la lente de Carreras de Explorar. Capaz de fallar con el código roto: cada assertion
 * mira el DOM real, no repite lo que el componente ya sabe.
 */

function career(overrides: Partial<CareerCoverage>): CareerCoverage {
  return {
    careerId: 'career-id',
    careerName: 'Carrera',
    universityId: 'uni-id',
    universityName: 'Universidad',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    totalSubjects: 0,
    coveredSubjects: 0,
    ...overrides,
  };
}

describe('CareerCoverageList', () => {
  /** US-222 E2: cada entrada trae el nombre, sus voces y su cobertura, nunca un puntaje ni una escala 1 a 5. */
  it('E2: muestra nombre, voces y cobertura, sin puntaje ni porcentaje', () => {
    render(
      <CareerCoverageList
        careers={[
          career({
            careerId: 'unt',
            careerName: 'Ingeniería en Sistemas',
            voiceCount: 412,
            totalSubjects: 51,
            coveredSubjects: 23,
          }),
        ]}
      />,
    );

    const row = screen.getByRole('link', { name: /ingeniería en sistemas/i });
    expect(within(row).getByText('412 voces · 23 de 51 materias')).toBeInTheDocument();
    expect(row).not.toHaveTextContent('%');
    expect(row).not.toHaveTextContent(/[1-5]\s*\/\s*5/);
  });

  /**
   * "Cómo sé que está bien": una carrera sin datos ni voces sigue en la lista y dice que no tiene
   * nada, nunca desaparece.
   */
  it('una carrera sin datos ni voces sigue en la lista y dice que no tiene nada', () => {
    render(
      <CareerCoverageList
        careers={[career({ careerId: 'vacia', careerName: 'Contador Público' })]}
      />,
    );

    const row = screen.getByRole('link', { name: /contador público/i });
    expect(within(row).getByText('Todavía no tenemos nada para leer.')).toBeInTheDocument();
  });

  it('una carrera crowdsourced lleva el badge "No oficial"', () => {
    render(<CareerCoverageList careers={[career({ isOfficial: false })]} />);

    expect(screen.getByText('No oficial')).toBeInTheDocument();
  });

  it('una carrera oficial no lleva el badge', () => {
    render(<CareerCoverageList careers={[career({ isOfficial: true })]} />);

    expect(screen.queryByText('No oficial')).not.toBeInTheDocument();
  });

  it('sin carreras, dice que la universidad todavía no tiene carreras cargadas', () => {
    render(<CareerCoverageList careers={[]} />);

    expect(
      screen.getByText('Esta universidad todavía no tiene carreras cargadas.'),
    ).toBeInTheDocument();
  });

  /** No hay ningún orden por cobertura ni nada que se lea como ranking: el componente no reordena su input. */
  it('no reordena las carreras que recibe (el orden lo decide quien arma la pantalla)', () => {
    render(
      <CareerCoverageList
        careers={[
          career({ careerId: 'segunda', careerName: 'Zoología', voiceCount: 1 }),
          career({ careerId: 'primera', careerName: 'Agronomía', voiceCount: 999 }),
        ]}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('Zoología'),
      expect.stringContaining('Agronomía'),
    ]);
  });
});
