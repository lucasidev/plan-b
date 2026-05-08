import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PeriodSnapshot } from '../data/period';
import { PeriodProgressCard } from './period-progress-card';

const fixture: PeriodSnapshot = {
  year: 2026,
  weekOfYear: 18,
  weeksInYear: 32,
  label: '2026 · en curso',
  secondHalfStartWeek: 17,
  startLabel: 'mar 2026',
  endLabel: 'nov 2026',
};

describe('PeriodProgressCard', () => {
  it('renderea eyebrow + heading mono con el período', () => {
    render(<PeriodProgressCard period={fixture} />);
    expect(screen.getByText('Período 2026')).toBeInTheDocument();
    expect(screen.getByText('sem 18')).toBeInTheDocument();
    expect(screen.getByText('/32')).toBeInTheDocument();
  });

  it('muestra los 3 labels equiespaciados (mes inicio, marker 2c, mes fin)', () => {
    render(<PeriodProgressCard period={fixture} />);
    expect(screen.getByText('mar 2026')).toBeInTheDocument();
    expect(screen.getByText('2c arranca · sem 17')).toBeInTheDocument();
    expect(screen.getByText('nov 2026')).toBeInTheDocument();
  });

  it('muestra el botón Editar período disabled (TODO de US futura)', () => {
    render(<PeriodProgressCard period={fixture} />);
    const button = screen.getByRole('button', { name: /editar período/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Próximamente');
  });

  it('no crashea con weeksInYear=0 (caso defensivo, ProgressBar lo cubre)', () => {
    const broken: PeriodSnapshot = { ...fixture, weeksInYear: 0 };
    render(<PeriodProgressCard period={broken} />);
    expect(screen.getByText('sem 18')).toBeInTheDocument();
    expect(screen.getByText('/0')).toBeInTheDocument();
  });
});
