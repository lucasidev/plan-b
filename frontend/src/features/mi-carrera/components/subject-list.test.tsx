import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PlannedSubject, PlanYear } from '@/features/mi-carrera/data/plan';
import { SubjectList } from './subject-list';

const subject = (
  code: string,
  name: string,
  overrides: Partial<PlannedSubject> = {},
): PlannedSubject => ({
  code,
  name,
  modality: '1c',
  state: 'PD',
  grade: null,
  correlativas: [],
  ...overrides,
});

const planFixture: PlanYear[] = [
  {
    year: 1,
    subjects: [
      subject('PRG101', 'Programación I', { state: 'AP', grade: 9 }),
      subject('PRG102', 'Programación II', { modality: '2c', state: 'AP', grade: 8 }),
    ],
  },
  {
    year: 4,
    subjects: [
      subject('ISW302', 'Ingeniería de Software II', { state: 'CU' }),
      subject('INT302', 'Inteligencia Artificial', { state: 'CU' }),
    ],
  },
];

describe('SubjectList', () => {
  it('renderea todas las materias del plan por default', () => {
    render(<SubjectList plan={planFixture} />);
    expect(screen.getByText('Programación I')).toBeInTheDocument();
    expect(screen.getByText('Programación II')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería de Software II')).toBeInTheDocument();
    expect(screen.getByText('Inteligencia Artificial')).toBeInTheDocument();
  });

  it('cada card es link al drawer /mi-carrera/materia/[code]', () => {
    render(<SubjectList plan={planFixture} />);
    expect(screen.getByText('Programación I').closest('a')).toHaveAttribute(
      'href',
      '/mi-carrera/materia/PRG101',
    );
  });

  it('filtra por texto del buscador', async () => {
    const user = userEvent.setup();
    render(<SubjectList plan={planFixture} />);
    const search = screen.getByLabelText('Buscar materia');
    await user.type(search, 'Programación');
    expect(screen.getByText('Programación I')).toBeInTheDocument();
    expect(screen.getByText('Programación II')).toBeInTheDocument();
    expect(screen.queryByText('Ingeniería de Software II')).not.toBeInTheDocument();
  });

  it('filtra por año', async () => {
    const user = userEvent.setup();
    render(<SubjectList plan={planFixture} />);
    await user.selectOptions(screen.getByLabelText('Filtrar por año'), '4');
    expect(screen.queryByText('Programación I')).not.toBeInTheDocument();
    expect(screen.getByText('Ingeniería de Software II')).toBeInTheDocument();
  });

  it('filtra por estado', async () => {
    const user = userEvent.setup();
    render(<SubjectList plan={planFixture} />);
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'CU');
    expect(screen.queryByText('Programación I')).not.toBeInTheDocument();
    expect(screen.getByText('Ingeniería de Software II')).toBeInTheDocument();
  });

  it('muestra empty state cuando ningún filtro matchea', async () => {
    const user = userEvent.setup();
    render(<SubjectList plan={planFixture} />);
    await user.type(screen.getByLabelText('Buscar materia'), 'XYZ inexistente');
    expect(screen.getByText(/No encontramos materias con esos filtros/)).toBeInTheDocument();
  });

  it('el select de año solo lista años presentes en el plan', () => {
    render(<SubjectList plan={planFixture} />);
    const yearSelect = screen.getByLabelText('Filtrar por año');
    expect(yearSelect).toHaveTextContent('1° año');
    expect(yearSelect).toHaveTextContent('4° año');
    expect(yearSelect).not.toHaveTextContent('2° año');
  });
});
