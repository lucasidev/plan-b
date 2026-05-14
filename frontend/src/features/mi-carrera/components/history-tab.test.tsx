import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HistorialEntry, HistorialPeriod } from '@/features/mi-carrera/data/historial';
import { HistoryTab } from './history-tab';

const entry = (
  code: string,
  state: 'aprob' | 'recurso' = 'aprob',
  grade: number | null = state === 'aprob' ? 8 : null,
): HistorialEntry => ({
  code,
  name: `${code} fixture`,
  state,
  grade,
  teacher: 'Test',
});

const fixturePeriods: HistorialPeriod[] = [
  {
    period: '2025·2c',
    avg: 8.0,
    items: [entry('ISW301', 'aprob', 8), entry('BD301', 'aprob', 8)],
  },
  {
    period: '2024·1c',
    avg: 7.5,
    items: [entry('MAT101', 'aprob', 7), entry('PRG101', 'recurso', null)],
  },
];

describe('HistoryTab', () => {
  it('renderea 4 KPIs con valores computados del mock', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText('materias aprobadas')).toBeInTheDocument();
    expect(screen.getByText('promedio general')).toBeInTheDocument();
    expect(screen.getByText('períodos cursados')).toBeInTheDocument();
    expect(screen.getByText('primer cuatri')).toBeInTheDocument();

    // 3 aprobadas (2 del primer período + 1 del segundo; el cuarto es recurso).
    expect(screen.getByText('3')).toBeInTheDocument();
    // Promedio simple = (8 + 8 + 7) / 3 = 7.7
    expect(screen.getByText('7.7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Mar 2024')).toBeInTheDocument();
  });

  it('renderea una card por período', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText('2025·2c')).toBeInTheDocument();
    expect(screen.getByText('2024·1c')).toBeInTheDocument();
  });

  it('renderea las entradas con sus datos y chips de estado', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText('ISW301')).toBeInTheDocument();
    expect(screen.getByText('ISW301 fixture')).toBeInTheDocument();
    expect(screen.getAllByText('aprob').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('recurso')).toBeInTheDocument();
  });

  it('muestra "—" en la nota cuando el state es recurso', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    // PRG101 es recurso con nota null
    const row = screen.getByText('PRG101').closest('div')?.parentElement;
    expect(row).toHaveTextContent('—');
  });

  it('renderea acciones: Importar PDF + Materia rendida', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    const importar = screen.getByText('Importar PDF');
    const agregar = screen.getByText('+ Materia rendida');
    expect(importar.closest('a')).toHaveAttribute('href', '/mi-carrera/historial/importar');
    expect(agregar.closest('a')).toHaveAttribute('href', '/mi-carrera/historial/agregar');
  });

  it('renderea empty state cuando no hay períodos', () => {
    render(<HistoryTab periods={[]} />);
    expect(screen.getByText(/Tu historial está vacío/)).toBeInTheDocument();
    // CTAs visibles también en empty state
    expect(screen.getByText('Importar PDF').closest('a')).toHaveAttribute(
      'href',
      '/mi-carrera/historial/importar',
    );
    // No hay KPIs en empty state
    expect(screen.queryByText('materias aprobadas')).not.toBeInTheDocument();
  });

  it('header de cada card incluye conteo + promedio', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText(/2 materias · promedio 8.0/)).toBeInTheDocument();
    expect(screen.getByText(/2 materias · promedio 7.5/)).toBeInTheDocument();
  });
});
