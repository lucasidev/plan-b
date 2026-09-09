import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import { InstitutionIdentity } from './institution-identity';

/** SC-005: la cabecera de identidad. Item 11 del relevamiento de campos (ADR-0090). */
describe('InstitutionIdentity', () => {
  const IDENTITY: OfficialFact = {
    id: 'fact-institution-type',
    field: 'institution_type',
    status: 'Published',
    value: 'Privada · Tucumán · 7 facultades · 7.660 estudiantes',
    unit: null,
    period: '2023',
    sourceName: 'Anuario de Estadísticas Universitarias (SPU)',
    sourceUrl: 'https://spu.example/anuario',
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
  };

  it('muestra siempre el nombre de la institución', () => {
    render(<InstitutionIdentity name="Universidad Nacional de Tucumán" facts={[]} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Universidad Nacional de Tucumán' }),
    ).toBeInTheDocument();
  });

  /** K07: "no informado" también se dice con fecha, nunca un espacio en blanco ni un cero. */
  it('con el dato de identidad relevado, lo muestra con su fuente', () => {
    render(<InstitutionIdentity name="Universidad Nacional de Tucumán" facts={[IDENTITY]} />);

    expect(
      screen.getByText('Privada · Tucumán · 7 facultades · 7.660 estudiantes'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Anuario de Estadísticas Universitarias (SPU) · 2023'),
    ).toBeInTheDocument();
  });

  it('sin relevamiento todavía, no dibuja un bloque de identidad vacío', () => {
    const { container } = render(
      <InstitutionIdentity name="Universidad Nacional de Tucumán" facts={[]} />,
    );

    expect(container.querySelector('.rounded-xl')).not.toBeInTheDocument();
  });
});
