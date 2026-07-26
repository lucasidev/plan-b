import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AvailableSubject, CommissionSelection } from '../types';
import { CommissionPicker } from './commission-picker';

function subject(overrides: Partial<AvailableSubject> = {}): AvailableSubject {
  return {
    id: 'sub-1',
    code: '111',
    name: 'Desarrollo de Software',
    yearInPlan: 1,
    termInYear: 1,
    termKind: 'Cuatrimestral',
    weeklyHours: 3,
    totalHours: 42,
    status: 'Available',
    blockedBy: [],
    commissions: [],
    ...overrides,
  };
}

describe('CommissionPicker (US-096)', () => {
  it('sin oferta cargada para la materia, lo dice explícito', () => {
    const selections: CommissionSelection[] = [{ subjectId: 'sub-1', commissionId: null }];
    render(
      <CommissionPicker
        selections={selections}
        subjectsById={new Map([['sub-1', subject({ commissions: [] })]])}
        onSelectCommission={vi.fn()}
      />,
    );

    expect(screen.getByText('Sin oferta cargada para este período.')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('con oferta cargada, lista las comisiones en el select y avisa el cambio', async () => {
    const user = userEvent.setup();
    const onSelectCommission = vi.fn();
    const selections: CommissionSelection[] = [{ subjectId: 'sub-1', commissionId: null }];
    const subjectWithCommissions = subject({
      commissions: [
        {
          id: 'com-a',
          name: 'A',
          modality: 'Presencial',
          capacity: 40,
          teacherNames: ['Brandt, Carlos'],
          schedule: [{ day: 'Monday', start: '18:00', end: '22:00' }],
        },
        {
          id: 'com-b',
          name: 'B',
          modality: 'Virtual',
          capacity: null,
          teacherNames: [],
          schedule: [],
        },
      ],
    });

    render(
      <CommissionPicker
        selections={selections}
        subjectsById={new Map([['sub-1', subjectWithCommissions]])}
        onSelectCommission={onSelectCommission}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Comisión de Desarrollo de Software' });
    await user.selectOptions(select, 'com-a');

    expect(onSelectCommission).toHaveBeenCalledWith('sub-1', 'com-a');
  });

  it('con una comisión ya elegida, muestra su detalle (docentes + horario)', () => {
    const selections: CommissionSelection[] = [{ subjectId: 'sub-1', commissionId: 'com-a' }];
    const subjectWithCommissions = subject({
      commissions: [
        {
          id: 'com-a',
          name: 'A',
          modality: 'Presencial',
          capacity: 40,
          teacherNames: ['Brandt, Carlos'],
          schedule: [{ day: 'Monday', start: '18:00', end: '22:00' }],
        },
      ],
    });

    render(
      <CommissionPicker
        selections={selections}
        subjectsById={new Map([['sub-1', subjectWithCommissions]])}
        onSelectCommission={vi.fn()}
      />,
    );

    expect(screen.getByText(/Brandt, Carlos/)).toBeInTheDocument();
    expect(screen.getByText(/Lu 18-22/)).toBeInTheDocument();
  });

  it('no renderea nada para una selección cuya materia no está en el catálogo', () => {
    const selections: CommissionSelection[] = [{ subjectId: 'sub-ausente', commissionId: null }];
    render(
      <CommissionPicker
        selections={selections}
        subjectsById={new Map()}
        onSelectCommission={vi.fn()}
      />,
    );

    expect(screen.getByText('Comisión por materia')).toBeInTheDocument();
    expect(screen.queryByText('Sin oferta cargada para este período.')).not.toBeInTheDocument();
  });
});
