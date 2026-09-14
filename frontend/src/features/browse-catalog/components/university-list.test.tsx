import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UniversityList, type UniversityListItem } from './university-list';

/**
 * US-222 y la ficha de SC-003, lente de Universidades (ADR-0096): dos líneas por fila (nombre, y
 * tipo institucional + cantidad de carreras), más una pill con cuántas de esas carreras ya tienen
 * reseñas.
 */

function university(overrides: Partial<UniversityListItem>): UniversityListItem {
  return {
    id: 'uni-id',
    name: 'Universidad',
    slug: 'universidad',
    careerCount: 0,
    careersWithReviews: 0,
    institutionType: null,
    ...overrides,
  };
}

describe('UniversityList', () => {
  it('dos líneas: el nombre arriba, el tipo institucional y la cantidad de carreras debajo', () => {
    render(
      <UniversityList
        universities={[
          university({
            name: 'UNSTA',
            careerCount: 56,
            careersWithReviews: 1,
            institutionType: 'Privada',
          }),
        ]}
      />,
    );

    const row = screen.getByRole('link', { name: /unsta/i });
    expect(within(row).getByText('UNSTA')).toBeInTheDocument();
    expect(within(row).getByText('Privada · 56 carreras')).toBeInTheDocument();
  });

  it('sin tipo institucional relevado, solo dice la cantidad de carreras', () => {
    render(
      <UniversityList
        universities={[university({ name: 'UTN-FRT', careerCount: 12, institutionType: null })]}
      />,
    );

    const row = screen.getByRole('link', { name: /utn-frt/i });
    expect(within(row).getByText('12 carreras')).toBeInTheDocument();
  });

  it('con carreras que tienen reseñas, la pill dice cuántas', () => {
    render(
      <UniversityList
        universities={[university({ name: 'UNT', careerCount: 4, careersWithReviews: 1 })]}
      />,
    );

    const row = screen.getByRole('link', { name: /unt/i });
    expect(within(row).getByText('1 carrera con reseñas')).toBeInTheDocument();
  });

  it('sin ninguna carrera con reseñas todavía, la pill lo dice con palabras', () => {
    render(
      <UniversityList
        universities={[university({ name: 'San Pablo-T', careerCount: 3, careersWithReviews: 0 })]}
      />,
    );

    const row = screen.getByRole('link', { name: /san pablo-t/i });
    expect(within(row).getByText('sin reseñas todavía')).toBeInTheDocument();
  });

  it('una institución sin carreras cargadas sigue en la lista y lo dice con palabras', () => {
    render(
      <UniversityList
        universities={[
          university({ name: 'Siglo 21', careerCount: 0, institutionType: 'Privada' }),
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
          university({ id: 'z', name: 'Zoo University', careerCount: 1 }),
          university({ id: 'a', name: 'Agro University', careerCount: 50 }),
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
