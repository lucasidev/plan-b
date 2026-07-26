import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { availableSubjectsQueries } from '../api';
import {
  formatBlockedReason,
  formatSubjectPeriod,
  selectVisibleSubjects,
} from '../lib/available-subjects';
import type { AvailableSubject } from '../types';
import { SubjectPickerDrawer } from './subject-picker-drawer';

function subject(overrides: Partial<AvailableSubject> = {}): AvailableSubject {
  return {
    id: 'sub-1',
    code: 'ISW401',
    name: 'Arquitectura de Software',
    yearInPlan: 4,
    termInYear: 1,
    termKind: 'Cuatrimestral',
    weeklyHours: 6,
    totalHours: 96,
    status: 'Available',
    blockedBy: [],
    commissions: [],
    ...overrides,
  };
}

/**
 * Renderea el drawer con `items` ya sentados en el cache (equivalente a lo que hidrataría la RSC
 * de /plan). `staleTime: Infinity` evita que useSuspenseQuery dispare un refetch de fondo contra
 * `fetch`, que no existe en jsdom sin mockear. `termId: null` por default: no afecta lo que se
 * renderea, solo tiene que coincidir entre la key sembrada y la que pide el componente.
 */
function renderDrawer(
  items: AvailableSubject[],
  overrides: {
    open?: boolean;
    onClose?: () => void;
    onPick?: (s: AvailableSubject) => void;
    termId?: string | null;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const termId = overrides.termId ?? null;
  queryClient.setQueryData(availableSubjectsQueries.list(termId).queryKey, { items });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const open = overrides.open ?? true;
  const onClose = overrides.onClose ?? vi.fn();
  const onPick = overrides.onPick ?? vi.fn();
  const rendered = render(
    <SubjectPickerDrawer open={open} onClose={onClose} onPick={onPick} termId={termId} />,
    { wrapper },
  );
  return { ...rendered, onClose, onPick };
}

describe('SubjectPickerDrawer (US-016)', () => {
  it('lista las materias disponibles y permite sumarlas', async () => {
    const user = userEvent.setup();
    const available = subject();
    const { onPick } = renderDrawer([available]);

    expect(screen.getByText('Arquitectura de Software')).toBeInTheDocument();
    expect(screen.getByText('Año 4 · Cuatrimestral 1')).toBeInTheDocument();
    expect(screen.getByText('6 hs/sem')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ISW401/i }));
    expect(onPick).toHaveBeenCalledWith(available);
  });

  it('muestra una materia bloqueada con el motivo, sin poder sumarla', () => {
    const blocked = subject({
      id: 'sub-2',
      code: 'ISW402',
      name: 'Ingeniería de Software III',
      status: 'Blocked',
      blockedBy: [{ id: 'req-1', code: 'MAT101', name: 'Análisis Matemático I' }],
    });
    renderDrawer([blocked]);

    expect(
      screen.getByText('Te falta aprobar o regularizar: MAT101 Análisis Matemático I'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ISW402/i })).not.toBeInTheDocument();
  });

  it('no lista las materias ya aprobadas, regularizadas o en curso', () => {
    renderDrawer([
      subject({ id: 'a', code: 'MAT101', status: 'AlreadyPassed' }),
      subject({ id: 'b', code: 'MAT102', status: 'AlreadyRegularized' }),
      subject({ id: 'c', code: 'MAT103', status: 'InProgress' }),
    ]);

    expect(screen.queryByText('MAT101')).not.toBeInTheDocument();
    expect(screen.queryByText('MAT102')).not.toBeInTheDocument();
    expect(screen.queryByText('MAT103')).not.toBeInTheDocument();
    expect(
      screen.getByText('No tenés materias disponibles para el próximo cuatrimestre.'),
    ).toBeInTheDocument();
  });

  it('empty state honesto cuando no hay ninguna materia', () => {
    renderDrawer([]);
    expect(
      screen.getByText('No tenés materias disponibles para el próximo cuatrimestre.'),
    ).toBeInTheDocument();
  });

  it('no renderea nada mientras está cerrado', () => {
    renderDrawer([subject()], { open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sin oferta cargada para el período, lo dice explícito (US-096)', () => {
    renderDrawer([subject({ commissions: [] })]);
    expect(screen.getByText('Sin oferta cargada para este período.')).toBeInTheDocument();
  });

  it('con oferta cargada, muestra comisión, modalidad y docentes (US-096)', () => {
    renderDrawer([
      subject({
        commissions: [
          {
            id: 'com-1',
            name: 'A',
            modality: 'Presencial',
            capacity: 40,
            teacherNames: ['Brandt, Carlos', 'Sosa, Diego'],
            schedule: [{ day: 'Monday', start: '18:00', end: '22:00' }],
          },
        ],
      }),
    ]);

    expect(screen.getByText(/Presencial/)).toBeInTheDocument();
    expect(screen.getByText(/Brandt, Carlos, Sosa, Diego/)).toBeInTheDocument();
    expect(screen.getByText(/Lu 18-22/)).toBeInTheDocument();
    expect(screen.queryByText('Sin oferta cargada para este período.')).not.toBeInTheDocument();
  });
});

describe('formatSubjectPeriod', () => {
  it('formatea un cuatrimestre con número', () => {
    expect(formatSubjectPeriod(2, 1, 'Cuatrimestral')).toBe('Año 2 · Cuatrimestral 1');
  });

  it('formatea anual sin número de término', () => {
    expect(formatSubjectPeriod(1, null, 'Anual')).toBe('Año 1 · Anual');
  });
});

describe('formatBlockedReason', () => {
  it('junta varias correlativas faltantes separadas por coma', () => {
    expect(
      formatBlockedReason([
        { id: '1', code: 'MAT101', name: 'Análisis Matemático I' },
        { id: '2', code: 'FIS101', name: 'Física I' },
      ]),
    ).toBe('Te falta aprobar o regularizar: MAT101 Análisis Matemático I, FIS101 Física I');
  });
});

describe('selectVisibleSubjects', () => {
  it('deja pasar Available y Blocked, filtra el resto de los estados', () => {
    const items = [
      subject({ status: 'Available' }),
      subject({ status: 'Blocked' }),
      subject({ status: 'AlreadyPassed' }),
      subject({ status: 'AlreadyRegularized' }),
      subject({ status: 'InProgress' }),
    ];
    expect(selectVisibleSubjects(items)).toHaveLength(2);
  });
});
