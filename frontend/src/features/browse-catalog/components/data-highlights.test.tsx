import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DataHighlight } from '../lib/data-highlights';
import { DataHighlights } from './data-highlights';

/**
 * ADR-0096: "Lo que los datos dicen" nunca infiere de la posición en el array quién es el
 * "ganador": el tier lo decide la función que arma el highlight, no el componente.
 */

describe('DataHighlights', () => {
  it('dos hechos empatados (tier primary) se ven igual, sin importar su posición', () => {
    const highlight: DataHighlight = {
      id: 'most-offered-career',
      label: 'La carrera más ofrecida',
      facts: [
        {
          text: 'Abogacía: en',
          href: null,
          tier: 'primary',
          links: [{ label: 'UNSTA', href: '/careers/a' }],
        },
        {
          text: 'Medicina: en',
          href: null,
          tier: 'primary',
          links: [{ label: 'UNT', href: '/careers/b' }],
        },
      ],
    };

    render(<DataHighlights highlights={[highlight]} />);

    const abogacia = screen.getByText('Abogacía: en', { exact: false });
    const medicina = screen.getByText('Medicina: en', { exact: false });
    expect(abogacia.className).toBe(medicina.className);
  });

  it('una línea secundaria muestra su período (o su nota) debajo, chico', () => {
    const highlight: DataHighlight = {
      id: 'best-graduation-rate',
      label: 'La carrera con mejor tiempo de salida',
      facts: [
        { text: 'Ganadora', href: '/careers/x', tier: 'primary' },
        {
          text: '16 de cada 100 en UTN-FRT',
          href: '/careers/y',
          tier: 'secondary',
          period: 'egresados 2022 sobre nuevos inscriptos 2019',
        },
      ],
    };

    render(<DataHighlights highlights={[highlight]} />);

    expect(screen.getByText('egresados 2022 sobre nuevos inscriptos 2019')).toBeInTheDocument();
  });

  it('la fuente se muestra por línea, no una sola vez por highlight (instituciones con fuentes distintas)', () => {
    const highlight: DataHighlight = {
      id: 'institutional-evaluation',
      label: 'La evaluación de la entidad auditora',
      facts: [
        {
          text: 'UNSTA (2020)',
          href: '/universities/unsta/careers',
          tier: 'primary',
          sourceName: 'Portal de transparencia UNSTA',
        },
        {
          text: 'UNT (2021)',
          href: '/universities/unt/careers',
          tier: 'primary',
          sourceName: 'Portal de transparencia UNT',
        },
      ],
    };

    render(<DataHighlights highlights={[highlight]} />);

    expect(screen.getByText('Portal de transparencia UNSTA')).toBeInTheDocument();
    expect(screen.getByText('Portal de transparencia UNT')).toBeInTheDocument();
  });

  it('un hecho derivado muestra su etiqueta como link aparte, a la regla en Método', () => {
    const highlight: DataHighlight = {
      id: 'best-graduation-rate',
      label: 'La carrera con mejor tiempo de salida',
      facts: [
        {
          text: 'Ganadora',
          href: '/careers/x',
          tier: 'primary',
          derivedTag: {
            label: 'egreso por cohorte, derivado de la institución entera',
            href: '/method#graduation-flow-proxy',
          },
        },
      ],
    };

    render(<DataHighlights highlights={[highlight]} />);

    const link = screen.getByRole('link', {
      name: /egreso por cohorte, derivado de la institución entera/i,
    });
    expect(link).toHaveAttribute('href', '/method#graduation-flow-proxy');
  });
});
