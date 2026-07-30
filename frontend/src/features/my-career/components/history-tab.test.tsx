import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TranscriptEntry, TranscriptPeriod } from '@/features/my-career/types';
import { HistoryTab } from './history-tab';

// Mismo placeholder de "sin nota" que renderea la card, armado sin repetir el
// carácter directamente en el archivo.
const NO_GRADE = String.fromCharCode(8212);

const entry = (
  subjectCode: string,
  status: TranscriptEntry['status'] = 'Passed',
  grade: number | null = status === 'Passed' ? 8 : null,
  teacherLastName: string | null = 'Test',
): TranscriptEntry => ({
  subjectCode,
  subjectName: `${subjectCode} fixture`,
  status,
  approvalMethod: null,
  grade,
  teacherLastName,
});

const fixturePeriods: TranscriptPeriod[] = [
  {
    label: '2025-C2',
    year: 2025,
    number: 2,
    average: 8.0,
    items: [entry('ISW301', 'Passed', 8), entry('BD301', 'Passed', 8)],
  },
  {
    label: '2024-C1',
    year: 2024,
    number: 1,
    average: 7.5,
    items: [entry('MAT101', 'Passed', 7), entry('PRG101', 'Failed', null)],
  },
];

describe('HistoryTab', () => {
  it('renderea 4 KPIs con valores computados del mock', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText('materias aprobadas')).toBeInTheDocument();
    expect(screen.getByText('promedio general')).toBeInTheDocument();
    expect(screen.getByText('períodos cursados')).toBeInTheDocument();
    expect(screen.getByText('primer cuatri')).toBeInTheDocument();

    // 3 aprobadas (2 del primer período + 1 del segundo; el cuarto es Failed).
    expect(screen.getByText('3')).toBeInTheDocument();
    // Promedio simple = (8 + 8 + 7) / 3 = 7.7
    expect(screen.getByText('7.7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Mar 2024')).toBeInTheDocument();
  });

  it('renderea una card por período', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText('2025-C2')).toBeInTheDocument();
    expect(screen.getByText('2024-C1')).toBeInTheDocument();
  });

  it('renderea las entradas con sus datos y chips de estado', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    expect(screen.getByText('ISW301')).toBeInTheDocument();
    expect(screen.getByText('ISW301 fixture')).toBeInTheDocument();
    expect(screen.getAllByText('aprobada').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('reprobada')).toBeInTheDocument();
  });

  it('muestra el placeholder de nota cuando el status es Failed', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    // PRG101 es Failed con grade null
    const row = screen.getByText('PRG101').closest('div')?.parentElement;
    expect(row).toHaveTextContent(NO_GRADE);
  });

  it('renderea acciones: Importar PDF + Materia rendida', () => {
    render(<HistoryTab periods={fixturePeriods} />);
    const importar = screen.getByText('Importar PDF');
    const agregar = screen.getByText('+ Materia rendida');
    expect(importar.closest('a')).toHaveAttribute('href', '/my-career/transcript/import');
    expect(agregar.closest('a')).toHaveAttribute('href', '/my-career/transcript/add');
  });

  it('renderea empty state cuando no hay períodos (default sin override)', () => {
    render(<HistoryTab />);
    expect(screen.getByText(/Tu historial está vacío/)).toBeInTheDocument();
    // CTA visible también en empty state
    expect(screen.getByText('+ Materia rendida').closest('a')).toHaveAttribute(
      'href',
      '/my-career/transcript/add',
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

describe('HistoryTab, los cinco estados y los nulls del contrato real (US-045-e)', () => {
  it('renderea la palabra de cada uno de los cinco estados', () => {
    const periods: TranscriptPeriod[] = [
      {
        label: '2026-C1',
        year: 2026,
        number: 1,
        average: 8,
        items: [
          entry('A', 'Passed', 8),
          entry('B', 'Regularized', 7),
          entry('C', 'InProgress', null),
          entry('D', 'Failed', null),
          entry('E', 'Dropped', null),
        ],
      },
    ];
    render(<HistoryTab periods={periods} />);
    expect(screen.getByText('aprobada')).toBeInTheDocument();
    expect(screen.getByText('regular')).toBeInTheDocument();
    expect(screen.getByText('cursando')).toBeInTheDocument();
    expect(screen.getByText('reprobada')).toBeInTheDocument();
    expect(screen.getByText('abandonada')).toBeInTheDocument();
  });

  it('muestra "Sin período" cuando el grupo no tiene label (equivalencias)', () => {
    const periods: TranscriptPeriod[] = [
      { label: null, year: null, number: null, average: 7, items: [entry('F', 'Passed', 7)] },
    ];
    render(<HistoryTab periods={periods} />);
    expect(screen.getByText('Sin período')).toBeInTheDocument();
  });

  it('omite "· promedio" en el subtítulo cuando el promedio del período es null', () => {
    const periods: TranscriptPeriod[] = [
      {
        label: '2026-C1',
        year: 2026,
        number: 1,
        average: null,
        items: [entry('G', 'InProgress', null)],
      },
    ];
    render(<HistoryTab periods={periods} />);
    expect(screen.getByText('1 materia')).toBeInTheDocument();
    // No confundir con el KPI "promedio general", que siempre está: lo que no tiene
    // que aparecer es el fragmento "· promedio" del subtítulo de la card.
    expect(screen.queryByText(/· promedio/)).not.toBeInTheDocument();
  });

  it('deja la celda de docente vacía cuando teacherLastName es null', () => {
    const periods: TranscriptPeriod[] = [
      {
        label: '2026-C1',
        year: 2026,
        number: 1,
        average: 8,
        items: [entry('H', 'Passed', 8, null)],
      },
    ];
    render(<HistoryTab periods={periods} />);
    const row = screen.getByText('H').closest('div')?.parentElement;
    const teacherCell = row?.children[2];
    expect(teacherCell?.textContent).toBe('');
  });
});
