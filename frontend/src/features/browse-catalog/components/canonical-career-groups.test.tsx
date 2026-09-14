import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalCareerGroup } from '../lib/group-careers-by-canonical';
import type { CareerCoverage } from '../types';
import { CanonicalCareerGroups } from './canonical-career-groups';

/**
 * "En más de una institución" (US-222, ADR-0096, maqueta aprobada): una fila por carrera
 * canónica, nunca una tarjeta por oferta.
 */

function offering(overrides: Partial<CareerCoverage>): CareerCoverage {
  return {
    careerId: 'career-id',
    careerName: 'Carrera',
    universityId: 'uni-id',
    universityName: 'Universidad',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: 'Carrera',
    ...overrides,
  };
}

function group(overrides: Partial<CanonicalCareerGroup>): CanonicalCareerGroup {
  return {
    canonicalGroupName: 'Tecnicatura o técnico en programación',
    offerings: [
      offering({ careerId: 'unsta-tudcs', universityId: 'unsta', universityName: 'UNSTA' }),
      offering({ careerId: 'unt-prog', universityId: 'unt', universityName: 'UNT' }),
    ],
    ...overrides,
  };
}

describe('CanonicalCareerGroups', () => {
  it('el nombre canónico arriba, las instituciones abajo como links a su propia oferta', () => {
    render(<CanonicalCareerGroups groups={[group({})]} universityShortNames={new Map()} />);

    expect(screen.getByText('Tecnicatura o técnico en programación')).toBeInTheDocument();
    const unstaLink = screen.getByRole('link', { name: 'UNSTA' });
    expect(unstaLink).toHaveAttribute('href', '/careers/unsta-tudcs');
    const untLink = screen.getByRole('link', { name: 'UNT' });
    expect(untLink).toHaveAttribute('href', '/careers/unt-prog');
  });

  it('usa el nombre corto del mapa cuando lo tiene; si no, cae al nombre de la oferta', () => {
    render(
      <CanonicalCareerGroups
        groups={[
          group({
            offerings: [
              offering({
                careerId: 'unsta-tudcs',
                universityId: 'unsta',
                universityName: 'Universidad del Norte Santo Tomás de Aquino',
              }),
            ],
          }),
        ]}
        universityShortNames={new Map([['unsta', 'UNSTA']])}
      />,
    );

    expect(screen.getByRole('link', { name: 'UNSTA' })).toBeInTheDocument();
    expect(
      screen.queryByText('Universidad del Norte Santo Tomás de Aquino'),
    ).not.toBeInTheDocument();
  });

  it('cae al nombre de la oferta si el mapa no tiene esa institución', () => {
    render(
      <CanonicalCareerGroups
        groups={[
          group({
            offerings: [offering({ universityId: 'unse', universityName: 'UNSE' })],
          }),
        ]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.getByRole('link', { name: 'UNSE' })).toBeInTheDocument();
  });

  it('con alguna oferta con reseñas, muestra la pill oscura "con reseñas" además de la de instituciones', () => {
    render(
      <CanonicalCareerGroups
        groups={[
          group({
            offerings: [
              offering({ careerId: 'a', voiceCount: 12 }),
              offering({ careerId: 'b', voiceCount: 0, hasReviewsBelowFloor: false }),
            ],
          }),
        ]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.getByText('con reseñas')).toBeInTheDocument();
    expect(screen.getByText('2 instituciones')).toBeInTheDocument();
  });

  it('sin ninguna oferta con reseñas, no muestra la pill oscura', () => {
    render(
      <CanonicalCareerGroups
        groups={[
          group({
            offerings: [
              offering({ careerId: 'a', voiceCount: 0, hasReviewsBelowFloor: false }),
              offering({ careerId: 'b', voiceCount: 0, hasReviewsBelowFloor: false }),
            ],
          }),
        ]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.queryByText('con reseñas')).not.toBeInTheDocument();
    expect(screen.getByText('2 instituciones')).toBeInTheDocument();
  });

  it('una reseña bajo el piso también prende la pill "con reseñas" (privacidad: sin decir cuántas)', () => {
    render(
      <CanonicalCareerGroups
        groups={[
          group({
            offerings: [offering({ careerId: 'a', voiceCount: 0, hasReviewsBelowFloor: true })],
          }),
        ]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.getByText('con reseñas')).toBeInTheDocument();
  });

  it('el orden de la maqueta: primero con reseñas, después más instituciones, a igual cantidad alfabético', () => {
    const noReviewsThree = group({
      canonicalGroupName: 'Sin reseñas, tres instituciones',
      offerings: [
        offering({ careerId: 'a1', universityId: 'u1' }),
        offering({ careerId: 'a2', universityId: 'u2' }),
        offering({ careerId: 'a3', universityId: 'u3' }),
      ],
    });
    const reviewsTwo = group({
      canonicalGroupName: 'Con reseñas, dos instituciones',
      offerings: [
        offering({ careerId: 'b1', universityId: 'u1', voiceCount: 5 }),
        offering({ careerId: 'b2', universityId: 'u2' }),
      ],
    });
    const noReviewsTwoZ = group({
      canonicalGroupName: 'Zoología',
      offerings: [
        offering({ careerId: 'c1', universityId: 'u1' }),
        offering({ careerId: 'c2', universityId: 'u2' }),
      ],
    });
    const noReviewsTwoA = group({
      canonicalGroupName: 'Agronomía',
      offerings: [
        offering({ careerId: 'd1', universityId: 'u1' }),
        offering({ careerId: 'd2', universityId: 'u2' }),
      ],
    });

    render(
      <CanonicalCareerGroups
        groups={[noReviewsThree, reviewsTwo, noReviewsTwoZ, noReviewsTwoA]}
        universityShortNames={new Map()}
      />,
    );

    const names = screen.getAllByText(
      /Sin reseñas, tres instituciones|Con reseñas, dos instituciones|Zoología|Agronomía/,
    );
    expect(names.map((el) => el.textContent)).toEqual([
      'Con reseñas, dos instituciones',
      'Sin reseñas, tres instituciones',
      'Agronomía',
      'Zoología',
    ]);
  });

  it('sin grupos, no renderiza nada', () => {
    const { container } = render(
      <CanonicalCareerGroups groups={[]} universityShortNames={new Map()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('cada grupo es su propia fila: el nombre no es un link (no hay una única oferta a la que ir)', () => {
    render(<CanonicalCareerGroups groups={[group({})]} universityShortNames={new Map()} />);

    const row = screen.getByText('Tecnicatura o técnico en programación').closest('li');
    expect(row).not.toBeNull();
    if (row) {
      const heading = within(row).getByText('Tecnicatura o técnico en programación');
      expect(heading.tagName.toLowerCase()).not.toBe('a');
    }
  });
});
