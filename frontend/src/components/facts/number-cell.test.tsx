import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NumberCell, officialFactCellContent } from './number-cell';
import type { OfficialFact } from './types';

function fact(
  overrides: Partial<OfficialFact> & Pick<OfficialFact, 'id' | 'field' | 'status'>,
): OfficialFact {
  return {
    subjectId: 'career-1',
    value: null,
    unit: null,
    period: null,
    sourceName: 'Sitio UNSTA',
    sourceUrl: 'https://unsta.edu.ar',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
    ...overrides,
  };
}

describe('officialFactCellContent', () => {
  it('sin afirmación, dice "Sin relevar" (nadie lo relevó todavía, no que la institución no informa)', () => {
    expect(officialFactCellContent(undefined)).toEqual({
      value: 'Sin relevar',
      note: null,
      isDerived: false,
      derivationRuleId: null,
    });
  });

  it('publicado, muestra el valor formateado y el período como nota', () => {
    const result = officialFactCellContent(
      fact({
        id: 'f1',
        field: 'paper_duration',
        status: 'Published',
        value: '2.5',
        unit: 'years',
        period: 'plan vigente',
      }),
    );

    expect(result).toEqual({
      value: '2,5 años',
      note: 'plan vigente',
      isDerived: false,
      derivationRuleId: null,
    });
  });

  it('derivado, muestra el valor formateado, isDerived true y la regla citada', () => {
    const result = officialFactCellContent(
      fact({
        id: 'f2',
        field: 'cohort_graduation',
        status: 'Derived',
        value: '21.4',
        unit: 'percent',
        period: '2022',
        derivationRuleId: 'graduation-flow-proxy',
      }),
    );

    expect(result).toEqual({
      value: '21,4 %',
      note: '2022',
      isDerived: true,
      derivationRuleId: 'graduation-flow-proxy',
    });
  });

  it('no publicado, dice "No publicado" con la nota corta del hecho', () => {
    const result = officialFactCellContent(
      fact({
        id: 'f3',
        field: 'real_duration',
        status: 'NotPublished',
        note: 'Ninguna fuente lo releva por carrera.',
      }),
    );

    expect(result.value).toBe('No publicado');
    expect(result.note).toBe('Ninguna fuente lo releva por carrera.');
    expect(result.isDerived).toBe(false);
  });

  it('no aplica, dice "No aplica" con la nota corta del hecho', () => {
    const result = officialFactCellContent(
      fact({
        id: 'f4',
        field: 'accreditation',
        status: 'NotApplicable',
        note: 'Las tecnicaturas no se acreditan.',
      }),
    );

    expect(result.value).toBe('No aplica');
    expect(result.note).toBe('Las tecnicaturas no se acreditan.');
  });

  it('pedido, dice "Pedido" con la nota corta del hecho', () => {
    const result = officialFactCellContent(
      fact({
        id: 'f5',
        field: 'real_duration',
        status: 'Requested',
        note: 'Pedido de acceso a la información.',
      }),
    );

    expect(result.value).toBe('Pedido');
    expect(result.note).toBe('Pedido de acceso a la información.');
  });

  it('nunca dice "No informa": ese texto no existe en el glosario', () => {
    for (const status of ['NotPublished', 'NotApplicable', 'Requested'] as const) {
      const result = officialFactCellContent(
        fact({ id: `f-${status}`, field: 'real_duration', status }),
      );
      expect(result.value).not.toBe('No informa');
    }
  });
});

describe('NumberCell', () => {
  it('muestra la etiqueta, el valor y la nota', () => {
    render(<NumberCell label="Estudiantes" value="7.660" note="2023" />);

    expect(screen.getByText('Estudiantes')).toBeInTheDocument();
    expect(screen.getByText('7.660')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('sin isDerived, no dibuja el chip "derivado"', () => {
    render(<NumberCell label="Estudiantes" value="7.660" />);

    expect(screen.queryByText('derivado')).not.toBeInTheDocument();
  });

  /** ADR-0090: un derivado nunca toma la forma de un publicado, y su chip linkea a la regla en Método. */
  it('con isDerived, el chip "derivado" linkea al bloque de su regla en Método', () => {
    render(
      <NumberCell
        label="Egreso por cohorte"
        value="21,4 %"
        isDerived
        derivationRuleId="graduation-flow-proxy"
      />,
    );

    expect(screen.getByRole('link', { name: 'derivado' })).toHaveAttribute(
      'href',
      '/method#graduation-flow-proxy',
    );
  });

  it('con isDerived pero sin regla citada, el chip cae a Método a secas', () => {
    render(<NumberCell label="Egreso por cohorte" value="21,4 %" isDerived />);

    expect(screen.getByRole('link', { name: 'derivado' })).toHaveAttribute('href', '/method');
  });
});
