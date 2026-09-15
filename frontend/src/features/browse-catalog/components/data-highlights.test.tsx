import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DataHighlight } from '../lib/data-highlights';
import { DataHighlights } from './data-highlights';

/**
 * ADR-0096, maqueta aprobada: "Lo que los datos dicen" es una tira compacta `kv`, una línea por
 * highlight. El componente solo renderiza `summary` (más el link a la regla de un derivado, que
 * vive en `facts`): la lógica de qué gana y cómo se arma el nombre corto vive en
 * `lib/data-highlights.ts`, con sus propios tests.
 */

function highlight(overrides: Partial<DataHighlight>): DataHighlight {
  return {
    id: 'most-chosen-university',
    label: 'La universidad más elegida',
    facts: [],
    summary: { name: 'UNT', href: '/universities/unt/careers', annotation: '', source: '' },
    ...overrides,
  };
}

describe('DataHighlights', () => {
  it('la etiqueta, el nombre como link y la aclaración atenuada al lado', () => {
    render(
      <DataHighlights
        highlights={[
          highlight({
            summary: {
              name: 'UNT',
              href: '/universities/unt/careers',
              annotation: '78.964 estudiantes en 2023',
              source: '',
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText('La universidad más elegida')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'UNT' });
    expect(link).toHaveAttribute('href', '/universities/unt/careers');
    expect(screen.getByText('78.964 estudiantes en 2023')).toBeInTheDocument();
  });

  it('sin href (varias ganadoras empatadas), el nombre se muestra sin link', () => {
    render(
      <DataHighlights
        highlights={[
          highlight({
            id: 'most-offered-career',
            label: 'La carrera más ofrecida',
            summary: {
              name: 'Abogacía, Medicina y Tecnicatura o técnico en programación',
              href: null,
              annotation: 'en 3 instituciones cada una',
              source: 'Guía de carreras universitarias (SIU)',
            },
          }),
        ]}
      />,
    );

    expect(
      screen.getByText('Abogacía, Medicina y Tecnicatura o técnico en programación'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('la fuente y lo secundario ya vienen unidos: una sola línea chica', () => {
    render(
      <DataHighlights
        highlights={[
          highlight({
            summary: {
              name: 'UNT',
              href: '/universities/unt/careers',
              annotation: '78.964 estudiantes en 2023',
              source:
                'SPU, anuario 2023 · UTN suma 108.986 pero es el total nacional de sus regionales',
            },
          }),
        ]}
      />,
    );

    expect(
      screen.getByText(
        'SPU, anuario 2023 · UTN suma 108.986 pero es el total nacional de sus regionales',
      ),
    ).toBeInTheDocument();
  });

  it('un hecho derivado agrega, al final de la línea de fuente, un link a la regla en Método', () => {
    render(
      <DataHighlights
        highlights={[
          highlight({
            id: 'best-graduation-rate',
            label: 'La carrera con mejor tiempo de salida',
            facts: [
              {
                text: 'texto interno, no se renderiza',
                href: '/careers/x',
                tier: 'primary',
                derivedTag: {
                  label: 'egreso por cohorte, derivado',
                  href: '/method#graduation-flow-proxy',
                },
              },
            ],
            summary: {
              name: 'Tecnicatura en Desarrollo y Calidad de Software, UNSTA',
              href: '/careers/x',
              annotation: 'egresan 21 de cada 100',
              source: 'SPU, Anuario 2022',
            },
          }),
        ]}
      />,
    );

    const derivedLink = screen.getByRole('link', { name: 'egreso por cohorte, derivado' });
    expect(derivedLink).toHaveAttribute('href', '/method#graduation-flow-proxy');
  });

  it('sin fuente ni secundario ni derivado, no agrega una línea vacía', () => {
    render(
      <DataHighlights
        highlights={[
          highlight({
            summary: { name: 'UNT', href: '/universities/unt/careers', annotation: '', source: '' },
          }),
        ]}
      />,
    );

    // Solo un link (el del nombre): ninguna línea de fuente/derivado que agregar sin contenido.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
