import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { formatCommissionSchedule, formatTeacherNames } from '../lib/commission-format';
import type {
  CommissionScheduleBlock,
  CommissionTeacherAssignment,
  TermCommissionRow,
} from '../types';
import { CommissionTable } from './commission-table';

// CommissionRow usa useRouter (refresh tras el toggle) y llama a los actions: se mockean los dos para
// que el render corra en jsdom sin un App Router real ni un fetch real (mismo patrón que
// delete-review-modal.test.tsx).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  deactivateCommissionAction: vi.fn(),
  reactivateCommissionAction: vi.fn(),
}));

/**
 * `formatCommissionSchedule`/`formatTeacherNames` son la lógica no trivial de formateo de esta tabla
 * (ADR-0036, "component test si tiene lógica no trivial de formateo, ej. el horario"): agrupar bloques
 * por rango horario y juntar días abreviados es lo que arma "Lu/Mi 18-21" a partir de dos filas
 * separadas que devuelve el backend. El resto del archivo cubre el render (vacío, chips de
 * advertencia, fila inactiva).
 */
describe('formatCommissionSchedule', () => {
  function block(overrides: Partial<CommissionScheduleBlock>): CommissionScheduleBlock {
    return { day: 'Monday', start: '18:00', end: '21:00', ...overrides };
  }

  it('devuelve un guion cuando no hay bloques', () => {
    expect(formatCommissionSchedule([])).toBe('-');
  });

  it('formatea un solo bloque en punto sin minutos', () => {
    const result = formatCommissionSchedule([
      block({ day: 'Monday', start: '18:00', end: '21:00' }),
    ]);
    expect(result).toBe('Lu 18-21');
  });

  it('agrupa dos dias con el mismo rango horario en un solo grupo', () => {
    const result = formatCommissionSchedule([
      block({ day: 'Monday', start: '18:00', end: '21:00' }),
      block({ day: 'Wednesday', start: '18:00', end: '21:00' }),
    ]);
    expect(result).toBe('Lu/Mi 18-21');
  });

  it('agrupa dias no consecutivos con el mismo rango (lunes y viernes)', () => {
    const result = formatCommissionSchedule([
      block({ day: 'Friday', start: '09:00', end: '12:00' }),
      block({ day: 'Monday', start: '09:00', end: '12:00' }),
    ]);
    expect(result).toBe('Lu/Vi 9-12');
  });

  it('separa con coma grupos de horarios distintos', () => {
    const result = formatCommissionSchedule([
      block({ day: 'Monday', start: '08:00', end: '10:00' }),
      block({ day: 'Wednesday', start: '14:00', end: '16:00' }),
    ]);
    expect(result).toBe('Lu 8-10, Mi 14-16');
  });

  it('conserva los minutos cuando no son en punto', () => {
    const result = formatCommissionSchedule([
      block({ day: 'Tuesday', start: '18:30', end: '20:15' }),
    ]);
    expect(result).toBe('Ma 18:30-20:15');
  });

  it('ordena por dia sin importar el orden de entrada', () => {
    const result = formatCommissionSchedule([
      block({ day: 'Saturday', start: '09:00', end: '13:00' }),
      block({ day: 'Monday', start: '18:00', end: '21:00' }),
    ]);
    expect(result).toBe('Lu 18-21, Sá 9-13');
  });
});

describe('formatTeacherNames', () => {
  function teacher(overrides: Partial<CommissionTeacherAssignment>): CommissionTeacherAssignment {
    return {
      teacherId: 'teacher-id',
      firstName: 'Grace',
      lastName: 'Hopper',
      role: 'Lead',
      ...overrides,
    };
  }

  it('devuelve null cuando no hay docentes', () => {
    expect(formatTeacherNames([])).toBeNull();
  });

  it('formatea un solo docente como "Apellido, Nombre"', () => {
    expect(formatTeacherNames([teacher({})])).toBe('Hopper, Grace');
  });

  it('junta varios docentes con punto medio', () => {
    const result = formatTeacherNames([
      teacher({ firstName: 'Grace', lastName: 'Hopper' }),
      teacher({ firstName: 'Ada', lastName: 'Lovelace' }),
    ]);
    expect(result).toBe('Hopper, Grace · Lovelace, Ada');
  });
});

function commissionRow(overrides: Partial<TermCommissionRow>): TermCommissionRow {
  return {
    commissionId: 'commission-id',
    subjectId: 'subject-id',
    subjectCode: '121',
    subjectName: 'Base de datos',
    name: 'A',
    modality: 'Presencial',
    capacity: 40,
    isActive: true,
    teachers: [],
    schedule: [],
    ...overrides,
  };
}

describe('CommissionTable', () => {
  it('muestra el estado vacío cuando no hay comisiones', () => {
    render(<CommissionTable universityId="uni-1" termId="term-1" commissions={[]} />);
    expect(screen.getByText(/todavía no hay comisiones cargadas/i)).toBeInTheDocument();
  });

  it('muestra el chip "sin docente" cuando la lista de docentes viene vacía', () => {
    render(
      <CommissionTable
        universityId="uni-1"
        termId="term-1"
        commissions={[commissionRow({ teachers: [] })]}
      />,
    );
    expect(screen.getByText('sin docente')).toBeInTheDocument();
  });

  it('muestra el chip "sin horario" cuando la lista de horario viene vacía', () => {
    render(
      <CommissionTable
        universityId="uni-1"
        termId="term-1"
        commissions={[commissionRow({ schedule: [] })]}
      />,
    );
    expect(screen.getByText('sin horario')).toBeInTheDocument();
  });

  it('no muestra chips de advertencia cuando la comisión tiene docente y horario', () => {
    render(
      <CommissionTable
        universityId="uni-1"
        termId="term-1"
        commissions={[
          commissionRow({
            teachers: [{ teacherId: 't-1', firstName: 'Grace', lastName: 'Hopper', role: 'Lead' }],
            schedule: [{ day: 'Monday', start: '18:00', end: '21:00' }],
          }),
        ]}
      />,
    );
    expect(screen.queryByText('sin docente')).not.toBeInTheDocument();
    expect(screen.queryByText('sin horario')).not.toBeInTheDocument();
  });

  it('muestra "sin cupo" cuando capacity es null', () => {
    render(
      <CommissionTable
        universityId="uni-1"
        termId="term-1"
        commissions={[commissionRow({ capacity: null })]}
      />,
    );
    expect(screen.getByText('sin cupo')).toBeInTheDocument();
  });

  it('una comisión inactiva muestra el chip INACTIVA y el botón Reactivar, no Editar', () => {
    render(
      <CommissionTable
        universityId="uni-1"
        termId="term-1"
        commissions={[commissionRow({ isActive: false })]}
      />,
    );
    expect(screen.getByText('INACTIVA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reactivar/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument();
  });

  it('una comisión activa ofrece Editar y Desactivar', () => {
    render(
      <CommissionTable
        universityId="uni-1"
        termId="term-1"
        commissions={[commissionRow({ isActive: true })]}
      />,
    );
    expect(screen.getByRole('link', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desactivar/i })).toBeInTheDocument();
  });
});
