import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Teacher } from '@/features/my-career/data/teachers';
import { TeacherList } from './teacher-list';

const teacher = (id: string, name: string, overrides: Partial<Teacher> = {}): Teacher => ({
  id,
  name,
  subjects: ['SUB101'],
  tags: [],
  ...overrides,
});

const fixture: Teacher[] = [
  teacher('brandt', 'Brandt, Carlos', { subjects: ['ISW301', 'ISW302'] }),
  teacher('iturralde', 'Iturralde, Eduardo', { subjects: ['INT302'] }),
  teacher('castro', 'Castro, Mariana'),
];

describe('TeacherList', () => {
  it('renderea todos los docentes por default', () => {
    render(<TeacherList teachers={fixture} />);
    expect(screen.getByText('Brandt, Carlos')).toBeInTheDocument();
    expect(screen.getByText('Iturralde, Eduardo')).toBeInTheDocument();
    expect(screen.getByText('Castro, Mariana')).toBeInTheDocument();
  });

  it('cada card es link a /my-career/teacher/[id]', () => {
    render(<TeacherList teachers={fixture} />);
    expect(screen.getByText('Brandt, Carlos').closest('a')).toHaveAttribute(
      'href',
      '/my-career/teacher/brandt',
    );
  });

  it('filtra por nombre (case insensitive)', async () => {
    const user = userEvent.setup();
    render(<TeacherList teachers={fixture} />);
    await user.type(screen.getByLabelText('Buscar docente'), 'brandt');
    expect(screen.getByText('Brandt, Carlos')).toBeInTheDocument();
    expect(screen.queryByText('Castro, Mariana')).not.toBeInTheDocument();
  });

  it('muestra empty state cuando no hay matches', async () => {
    const user = userEvent.setup();
    render(<TeacherList teachers={fixture} />);
    await user.type(screen.getByLabelText('Buscar docente'), 'xyz');
    expect(screen.getByText(/No encontramos docentes/)).toBeInTheDocument();
  });
});
