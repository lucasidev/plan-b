import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import { InstitutionNumbers } from './institution-numbers';

function fact(
  overrides: Partial<OfficialFact> & Pick<OfficialFact, 'id' | 'field' | 'status'>,
): OfficialFact {
  return {
    subjectId: 'institution-1',
    value: null,
    unit: null,
    period: null,
    sourceName: 'SPU, Anuario de Estadísticas Universitarias',
    sourceUrl: 'https://spu.example/anuario',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
    ...overrides,
  };
}

describe('InstitutionNumbers', () => {
  it('muestra estudiantes y egresados publicados, con su período', () => {
    render(
      <InstitutionNumbers
        facts={[
          fact({
            id: 'f1',
            field: 'students',
            status: 'Published',
            value: '7660',
            unit: 'count',
            period: '2023',
          }),
          fact({
            id: 'f2',
            field: 'graduates',
            status: 'Published',
            value: '488',
            unit: 'count',
            period: '2023',
          }),
        ]}
        totalCareers={0}
        careersWithReviews={0}
      />,
    );

    expect(screen.getByText('Estudiantes')).toBeInTheDocument();
    expect(screen.getByText('7.660')).toBeInTheDocument();
    expect(screen.getByText('Egresados')).toBeInTheDocument();
    expect(screen.getByText('488')).toBeInTheDocument();
  });

  /** K07: una privada que no informa estudiantes lo dice, nunca "No informa" (no está en el glosario). */
  it('estudiantes no publicado dice "No publicado", no "No informa"', () => {
    render(
      <InstitutionNumbers
        facts={[
          fact({
            id: 'f1',
            field: 'students',
            status: 'NotPublished',
            note: 'La institución no informó al anuario.',
          }),
        ]}
        totalCareers={0}
        careersWithReviews={0}
      />,
    );

    expect(screen.getByText('No publicado')).toBeInTheDocument();
    expect(screen.queryByText(/no informa/i)).not.toBeInTheDocument();
  });

  /** ADR-0090: un derivado nunca toma la forma de un publicado, tampoco en esta tira. */
  it('estudiantes derivado muestra el chip "derivado" con su link a Método', () => {
    render(
      <InstitutionNumbers
        facts={[
          fact({
            id: 'f1',
            field: 'students',
            status: 'Derived',
            value: '7660',
            unit: 'count',
            derivationRuleId: 'some-rule',
          }),
        ]}
        totalCareers={0}
        careersWithReviews={0}
      />,
    );

    expect(screen.getByRole('link', { name: 'derivado' })).toHaveAttribute(
      'href',
      '/method#some-rule',
    );
  });

  it('carreras con reseñas: con denominador 0, la celda no se dibuja', () => {
    render(<InstitutionNumbers facts={[]} totalCareers={0} careersWithReviews={0} />);

    expect(screen.queryByText(/carreras con reseñas/i)).not.toBeInTheDocument();
  });

  it('carreras con reseñas: con carreras cargadas, muestra "N de M"', () => {
    render(<InstitutionNumbers facts={[]} totalCareers={12} careersWithReviews={3} />);

    expect(screen.getByText('3 de 12')).toBeInTheDocument();
  });

  it('transparencia publicada: sin ningún campo del checklist cargado, la celda no se dibuja', () => {
    render(<InstitutionNumbers facts={[]} totalCareers={5} careersWithReviews={2} />);

    expect(screen.queryByText(/transparencia publicada/i)).not.toBeInTheDocument();
  });

  /**
   * El denominador cuenta los campos del checklist efectivamente cargados, no siempre los seis
   * posibles: con dos campos cargados (uno publicado, uno no), la tira dice "1 de 2", no "1 de 6".
   */
  it('transparencia publicada cuenta contra los campos cargados, no contra el total posible', () => {
    render(
      <InstitutionNumbers
        facts={[
          fact({ id: 'f1', field: 'minutes_published', status: 'Published', value: 'Publicado' }),
          fact({
            id: 'f2',
            field: 'budget_published',
            status: 'NotPublished',
            note: 'No publica presupuesto.',
          }),
        ]}
        totalCareers={5}
        careersWithReviews={2}
      />,
    );

    expect(screen.getByText('1 de 2')).toBeInTheDocument();
  });
});
