import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PlannedSubject, PlanYear } from '@/features/mi-carrera/data/plan';
import { PlanGrid } from './plan-grid';

const subject = (
  code: string,
  state: 'AP' | 'CU' | 'PD',
  overrides: Partial<PlannedSubject> = {},
): PlannedSubject => ({
  code,
  name: `${code} fixture`,
  modality: '1c',
  state,
  grade: state === 'AP' ? 8 : null,
  correlativas: [],
  ...overrides,
});

const planFixture: PlanYear[] = [
  {
    year: 1,
    subjects: [subject('A101', 'AP', { grade: 9 }), subject('A102', 'AP', { grade: 7 })],
  },
  {
    year: 2,
    subjects: [
      subject('B201', 'CU'),
      subject('B202', 'PD', { correlativas: ['Z999'] }),
      subject('B203', 'PD', { correlativas: ['A101'] }),
    ],
  },
];

describe('PlanGrid', () => {
  it('renderea una card por año con conteos correctos', () => {
    render(<PlanGrid plan={planFixture} />);
    expect(screen.getByText(/1° año/)).toBeInTheDocument();
    expect(screen.getByText(/2° año/)).toBeInTheDocument();
    expect(screen.getByText(/2 aprobadas · 0 cursando/)).toBeInTheDocument();
    expect(screen.getByText(/0 aprobadas · 1 cursando/)).toBeInTheDocument();
  });

  it('muestra leyenda con los 3 estados visuales', () => {
    render(<PlanGrid plan={planFixture} />);
    expect(screen.getByText('Leyenda')).toBeInTheDocument();
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.getByText('Cursando')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renderea cada materia con código + nombre + nota cuando AP', () => {
    render(<PlanGrid plan={planFixture} />);
    expect(screen.getByText('A101')).toBeInTheDocument();
    expect(screen.getByText('A101 fixture')).toBeInTheDocument();
    expect(screen.getByText('nota 9')).toBeInTheDocument();
  });

  it('no muestra nota cuando la materia no está aprobada', () => {
    render(<PlanGrid plan={planFixture} />);
    expect(screen.queryByText(/nota null/)).not.toBeInTheDocument();
    // B201 (CU) y B202 (PD) no deben tener celda con "nota"
    const coursingCell = screen.getByText('B201').closest('a');
    expect(coursingCell).not.toHaveTextContent(/nota/);
  });

  it('aplica data-state al link de cada celda para tests/CSS', () => {
    render(<PlanGrid plan={planFixture} />);
    expect(screen.getByText('A101').closest('a')).toHaveAttribute('data-state', 'AP');
    expect(screen.getByText('B201').closest('a')).toHaveAttribute('data-state', 'CU');
    expect(screen.getByText('B202').closest('a')).toHaveAttribute('data-state', 'PD');
  });

  it('marca data-unlocked=false cuando faltan correlativas', () => {
    render(<PlanGrid plan={planFixture} />);
    // B202 requiere Z999 (no existe en el plan, no está aprobada)
    expect(screen.getByText('B202').closest('a')).toHaveAttribute('data-unlocked', 'false');
    // B203 requiere A101 (aprobada en el fixture)
    expect(screen.getByText('B203').closest('a')).toHaveAttribute('data-unlocked', 'true');
  });

  it('incluye correlativas pendientes en el tooltip de bloqueadas', () => {
    render(<PlanGrid plan={planFixture} />);
    const bloqueada = screen.getByText('B202').closest('a');
    expect(bloqueada).toHaveAttribute('title', expect.stringContaining('Te faltan: Z999'));
  });

  it('cada celda es un link a /mi-carrera/materia/[code]', () => {
    render(<PlanGrid plan={planFixture} />);
    expect(screen.getByText('A101').closest('a')).toHaveAttribute(
      'href',
      '/mi-carrera/materia/A101',
    );
  });

  it('renderea empty state cuando el plan está vacío', () => {
    render(<PlanGrid plan={[]} />);
    expect(screen.getByText(/No hay materias en tu plan/)).toBeInTheDocument();
    expect(screen.queryByText('Leyenda')).not.toBeInTheDocument();
  });
});
