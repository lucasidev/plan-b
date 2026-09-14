import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import { InstitutionIdentity } from './institution-identity';

/** SC-005: la cabecera de identidad. Item 11 del relevamiento de campos (ADR-0090). */
describe('InstitutionIdentity', () => {
  const IDENTITY: OfficialFact = {
    id: 'fact-institution-type',
    subjectId: 'institution-1',
    field: 'institution_type',
    status: 'Published',
    value: 'Privada · Tucumán · 7 facultades · 7.660 estudiantes',
    unit: null,
    period: '2023',
    sourceName: 'Anuario de Estadísticas Universitarias (SPU)',
    sourceUrl: 'https://spu.example/anuario',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
  };

  it('muestra siempre el nombre de la institución', () => {
    render(
      <InstitutionIdentity
        name="Universidad Nacional de Tucumán"
        facts={[]}
        academicUnitCount={0}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Universidad Nacional de Tucumán' }),
    ).toBeInTheDocument();
  });

  /** K07: "no informado" también se dice con fecha, nunca un espacio en blanco ni un cero. */
  it('con el dato de identidad relevado, lo muestra con su fuente', () => {
    render(
      <InstitutionIdentity
        name="Universidad Nacional de Tucumán"
        facts={[IDENTITY]}
        academicUnitCount={0}
      />,
    );

    expect(
      screen.getByText('Privada · Tucumán · 7 facultades · 7.660 estudiantes'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Anuario de Estadísticas Universitarias (SPU) · 2023'),
    ).toBeInTheDocument();
  });

  it('sin relevamiento todavía, no dibuja un bloque de identidad vacío', () => {
    const { container } = render(
      <InstitutionIdentity
        name="Universidad Nacional de Tucumán"
        facts={[]}
        academicUnitCount={0}
      />,
    );

    expect(container.querySelector('.rounded-xl')).not.toBeInTheDocument();
  });

  /**
   * El eyebrow toma el tipo de institución del primer segmento de `institution_type` (los
   * demás datos van separados por "; ", ver `OfficialFactSeedData.cs`), en minúscula.
   */
  it('el eyebrow muestra el tipo de institución cuando está relevado', () => {
    render(
      <InstitutionIdentity
        name="Universidad del Norte Santo Tomás de Aquino"
        facts={[
          {
            ...IDENTITY,
            value: 'Privada; 7660 estudiantes en 2023; 401 egresados en 2022',
          },
        ]}
        academicUnitCount={0}
      />,
    );

    expect(screen.getByText('Universidad · privada')).toBeInTheDocument();
  });

  it('sin institution_type relevado, el eyebrow dice solo "Universidad"', () => {
    render(
      <InstitutionIdentity
        name="Universidad del Norte Santo Tomás de Aquino"
        facts={[]}
        academicUnitCount={0}
      />,
    );

    expect(screen.getByText('Universidad')).toBeInTheDocument();
  });

  /**
   * "Unidades académicas" y no "facultades": el catálogo agrupa carreras bajo tipos distintos de
   * unidad (facultades, sedes, centros regionales), y afirmar "facultad" para todas sería un dato
   * inventado.
   */
  it('muestra cuántas unidades académicas tiene, singular y plural', () => {
    const { rerender } = render(
      <InstitutionIdentity name="UNSTA" facts={[]} academicUnitCount={1} />,
    );
    expect(screen.getByText(/1\s*unidad académica\./)).toBeInTheDocument();

    rerender(<InstitutionIdentity name="UNSTA" facts={[]} academicUnitCount={7} />);
    expect(screen.getByText(/7\s*unidades académicas\./)).toBeInTheDocument();
  });

  it('sin unidades académicas resueltas todavía, no dice "0 unidades académicas"', () => {
    render(<InstitutionIdentity name="UNSTA" facts={[]} academicUnitCount={0} />);

    expect(screen.queryByText(/0\s*unidad/)).not.toBeInTheDocument();
  });
});
