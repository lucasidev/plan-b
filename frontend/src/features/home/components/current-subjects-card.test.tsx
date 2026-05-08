import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ActiveSubject } from '../data/active-subjects';
import { CurrentSubjectsCard } from './current-subjects-card';

const baseSubject: ActiveSubject = {
  code: 'ISW302',
  name: 'Ingeniería de Software II',
  mod: '1c',
  com: 'A',
  prof: 'Brandt',
  diff: 4,
  week: 8,
  weeks: 16,
  next: 'Parcial · 12 may',
  attendance: 0.92,
  note: null,
};

describe('CurrentSubjectsCard', () => {
  it('muestra el conteo de materias en el header', () => {
    render(<CurrentSubjectsCard subjects={[baseSubject, { ...baseSubject, code: 'INT302' }]} />);
    expect(screen.getByText('2 materias')).toBeInTheDocument();
  });

  it('renderea code, name, prof + next por cada materia', () => {
    render(<CurrentSubjectsCard subjects={[baseSubject]} />);
    expect(screen.getByText('ISW302')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería de Software II')).toBeInTheDocument();
    expect(screen.getByText(/Brandt · Parcial · 12 may/)).toBeInTheDocument();
  });

  it('muestra "sin notas" cuando note es null', () => {
    render(<CurrentSubjectsCard subjects={[baseSubject]} />);
    expect(screen.getByText('sin notas')).toBeInTheDocument();
  });

  it('muestra la nota parcial cuando note tiene valor', () => {
    render(<CurrentSubjectsCard subjects={[{ ...baseSubject, note: 8 }]} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('nota parcial')).toBeInTheDocument();
  });

  it('muestra el porcentaje de asistencia formateado', () => {
    render(<CurrentSubjectsCard subjects={[{ ...baseSubject, attendance: 0.92 }]} />);
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('muestra guion "-" cuando attendance es null', () => {
    render(<CurrentSubjectsCard subjects={[{ ...baseSubject, attendance: null }]} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay materias', () => {
    render(<CurrentSubjectsCard subjects={[]} />);
    expect(screen.getByText(/Cuando empieces a cursar/)).toBeInTheDocument();
  });

  it('muestra el progreso "sem week/weeks"', () => {
    render(<CurrentSubjectsCard subjects={[{ ...baseSubject, week: 8, weeks: 16 }]} />);
    expect(screen.getByText('sem 8/16')).toBeInTheDocument();
  });
});
