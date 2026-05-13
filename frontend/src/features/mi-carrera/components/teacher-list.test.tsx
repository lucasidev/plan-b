import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Teacher } from '@/features/mi-carrera/data/teachers';
import { TeacherList } from './teacher-list';

const teacher = (id: string, name: string, overrides: Partial<Teacher> = {}): Teacher => ({
  id,
  name,
  subjects: ['SUB101'],
  rating: { overall: 4.2, reviewCount: 30 },
  metrics: { claridad: 4.5, exigencia: 4.0, buenaonda: 4.0, responde: 3.5 },
  tags: [],
  ...overrides,
});

const fixture: Teacher[] = [
  teacher('brandt', 'Brandt, Carlos', { subjects: ['ISW301', 'ISW302'] }),
  teacher('iturralde', 'Iturralde, Eduardo', { subjects: ['INT302'] }),
  teacher('castro', 'Castro, Mariana', { rating: { overall: 3.4, reviewCount: 12 } }),
];

describe('TeacherList', () => {
  it('renderea todos los docentes por default', () => {
    render(<TeacherList teachers={fixture} />);
    expect(screen.getByText('Brandt, Carlos')).toBeInTheDocument();
    expect(screen.getByText('Iturralde, Eduardo')).toBeInTheDocument();
    expect(screen.getByText('Castro, Mariana')).toBeInTheDocument();
  });

  it('cada card es link a /mi-carrera/docente/[id]', () => {
    render(<TeacherList teachers={fixture} />);
    expect(screen.getByText('Brandt, Carlos').closest('a')).toHaveAttribute(
      'href',
      '/mi-carrera/docente/brandt',
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

  it('muestra el rating + count de reseñas por docente', () => {
    render(<TeacherList teachers={fixture} />);
    // 2 teachers tienen rating 4.2 en el fixture (brandt + iturralde).
    expect(screen.getAllByText('4.2')).toHaveLength(2);
    expect(screen.getByText('3.4')).toBeInTheDocument();
    expect(screen.getAllByText(/30 reseñas/)).toHaveLength(2);
    expect(screen.getByText(/12 reseñas/)).toBeInTheDocument();
  });

  it('renderea una progressbar a11y por docente', () => {
    render(<TeacherList teachers={fixture} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute('aria-valuemax', '5');
  });
});
