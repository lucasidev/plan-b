import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { UniversityWithCoverage } from '../types';
import { UniversityList } from './university-list';

/**
 * US-222 y la ficha de SC-003, lente de Universidades: "cuántas carreras tiene, y cuántas de esas
 * tienen algo para leer" (Qué entra del hallazgo), antes de entrar.
 */

function university(overrides: Partial<UniversityWithCoverage>): UniversityWithCoverage {
  return {
    id: 'uni-id',
    name: 'Universidad',
    slug: 'universidad',
    careerCount: 0,
    careersWithSomethingToRead: 0,
    ...overrides,
  };
}

describe('UniversityList', () => {
  it('dice cuántas carreras tiene la institución y cuántas de esas tienen algo para leer', () => {
    render(
      <UniversityList
        universities={[
          university({ name: 'UNSTA', careerCount: 12, careersWithSomethingToRead: 4 }),
        ]}
      />,
    );

    const row = screen.getByRole('link', { name: /unsta/i });
    expect(within(row).getByText('12 carreras · 4 con algo para leer')).toBeInTheDocument();
  });

  it('una institución sin carreras cargadas sigue en la lista y lo dice con palabras', () => {
    render(
      <UniversityList
        universities={[
          university({ name: 'Siglo 21', careerCount: 0, careersWithSomethingToRead: 0 }),
        ]}
      />,
    );

    const row = screen.getByRole('link', { name: /siglo 21/i });
    expect(within(row).getByText('Todavía sin carreras cargadas.')).toBeInTheDocument();
  });

  it('sin universidades, dice que el catálogo no tiene ninguna cargada', () => {
    render(<UniversityList universities={[]} />);

    expect(
      screen.getByText('Todavía no hay universidades cargadas en el catálogo.'),
    ).toBeInTheDocument();
  });

  it('no reordena las instituciones que recibe', () => {
    render(
      <UniversityList
        universities={[
          university({
            id: 'z',
            name: 'Zoo University',
            careerCount: 1,
            careersWithSomethingToRead: 1,
          }),
          university({
            id: 'a',
            name: 'Agro University',
            careerCount: 50,
            careersWithSomethingToRead: 50,
          }),
        ]}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('Zoo University'),
      expect.stringContaining('Agro University'),
    ]);
  });
});
