import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { simulationEvaluationQueries } from '../api';
import type { SimulationEvaluation } from '../types';
import { SimulatorEvaluationPanel } from './stats-grid';

function evaluation(overrides: Partial<SimulationEvaluation> = {}): SimulationEvaluation {
  return {
    isValid: true,
    blockedSubjects: [],
    totalWeeklyHours: 12,
    totalHours: 96,
    weightedDifficulty: 3.5,
    combinationStats: { sampleSize: 8, passRate: 62, dropoutRate: 10 },
    ...overrides,
  };
}

/**
 * Renderea el panel con la respuesta ya sentada en el cache (mismo patrón que
 * subject-picker-drawer.test.tsx): `simulationEvaluationQueries.forSubjects` ordena los ids
 * adentro, así que sembrar con la misma función garantiza la key exacta que el componente pide.
 * `response` en `undefined` deja el cache vacío (para el caso sin materias elegidas, donde el
 * query ni se dispara).
 */
function renderPanel(subjectIds: string[], response: SimulationEvaluation | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  if (response) {
    queryClient.setQueryData(
      simulationEvaluationQueries.forSubjects(subjectIds).queryKey,
      response,
    );
  }

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(<SimulatorEvaluationPanel subjectIds={subjectIds} />, { wrapper });
}

describe('SimulatorEvaluationPanel (US-016)', () => {
  it('sin materias elegidas no llama al endpoint y muestra el estado vacío', () => {
    renderPanel([], undefined);

    expect(
      screen.getByText('Sumá materias a tu simulación para ver las métricas de la combinación.'),
    ).toBeInTheDocument();
  });

  it('muestra las métricas cuando la combinación es válida y la muestra alcanza', () => {
    renderPanel(['sub-1', 'sub-2'], evaluation());

    expect(screen.getByText('12h')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('dificultad null muestra "sin reseñas todavía", nunca un 0', () => {
    renderPanel(['sub-1'], evaluation({ weightedDifficulty: null }));

    expect(screen.getByText('s/d')).toBeInTheDocument();
    expect(screen.getByText('sin reseñas todavía')).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('muestra insuficiente (ADR-0047): muestra el sampleSize, nunca la tasa', () => {
    renderPanel(
      ['sub-1'],
      evaluation({ combinationStats: { sampleSize: 2, passRate: null, dropoutRate: null } }),
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('alumnos, pocos datos')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('combinación inválida lista las materias bloqueadas con su motivo, no un error genérico', () => {
    renderPanel(
      ['sub-1', 'sub-2'],
      evaluation({
        isValid: false,
        blockedSubjects: [
          {
            id: 'sub-2',
            code: 'ISW402',
            name: 'Ingeniería de Software III',
            blockedBy: [{ id: 'req-1', code: 'MAT101', name: 'Análisis Matemático I' }],
          },
        ],
        totalWeeklyHours: 0,
        totalHours: 0,
        weightedDifficulty: null,
        combinationStats: { sampleSize: 0, passRate: null, dropoutRate: null },
      }),
    );

    expect(screen.getByText('ISW402 · Ingeniería de Software III')).toBeInTheDocument();
    expect(
      screen.getByText('Te falta aprobar o regularizar: MAT101 Análisis Matemático I'),
    ).toBeInTheDocument();
  });
});
