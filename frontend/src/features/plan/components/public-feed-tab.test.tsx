import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListPublicSimulationsResponse, PublicSimulationItem } from '../types';
import { PublicFeedTab } from './public-feed-tab';

/**
 * Tests de `PublicFeedTab` (US-027): el trato honesto de `averageDifficulty` null, el estado vacío
 * (con su CTA a Borradores) y la paginación por cursor ("Ver más" pide la página siguiente con el
 * cursor recibido y desaparece cuando no hay más). Mock de borde: `@/lib/api-client`
 * (`clientApiFetch`), solo hace falta para el click de "Ver más" (que dispara un fetch real de la
 * página siguiente); la página inicial se siembra directo en el cache, mismo criterio que
 * `subject-picker-drawer.test.tsx`.
 */

vi.mock('@/lib/api-client', () => ({
  clientApiFetch: vi.fn(),
}));

import { clientApiFetch } from '@/lib/api-client';
import { publicSimulationsQueries } from '../api';

const clientApiFetchMock = vi.mocked(clientApiFetch);

const PLAN_ID = 'plan-1';
const TERM_ID = 'term-1';

function item(overrides: Partial<PublicSimulationItem> = {}): PublicSimulationItem {
  return {
    id: 'sim-1',
    label: 'Combo liviano',
    termId: TERM_ID,
    items: [
      {
        subjectId: 'sub-1',
        subjectCode: '121',
        subjectName: 'Base de datos',
        commissionId: 'com-a',
        commissionName: 'A',
      },
    ],
    totalWeeklyHours: 6,
    averageDifficulty: 3.2,
    ...overrides,
  };
}

function jsonResponse(body: ListPublicSimulationsResponse): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderSeeded(pages: ListPublicSimulationsResponse[], onGoToDrafts = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  queryClient.setQueryData(publicSimulationsQueries.feed(PLAN_ID, TERM_ID).queryKey, {
    pages,
    pageParams: pages.map((_, i) => (i === 0 ? null : 'seeded-cursor')),
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(
    <PublicFeedTab careerPlanId={PLAN_ID} termId={TERM_ID} onGoToDrafts={onGoToDrafts} />,
    { wrapper },
  );
}

beforeEach(() => {
  clientApiFetchMock.mockReset();
});

describe('PublicFeedTab (US-027)', () => {
  it('sin perfil de alumno, lo dice explícito sin pedir nada al backend', () => {
    render(<PublicFeedTab careerPlanId={null} termId={TERM_ID} onGoToDrafts={vi.fn()} />);

    expect(screen.getByText(/no encontramos tu perfil de alumno/i)).toBeInTheDocument();
    expect(clientApiFetchMock).not.toHaveBeenCalled();
  });

  it('sin período elegido, invita a elegir uno sin pedir nada al backend', () => {
    render(<PublicFeedTab careerPlanId={PLAN_ID} termId={null} onGoToDrafts={vi.fn()} />);

    expect(screen.getByText(/eleg[ií].*per[ií]odo/i)).toBeInTheDocument();
    expect(clientApiFetchMock).not.toHaveBeenCalled();
  });

  it('estado vacío honesto cuando nadie compartió nada, con CTA a Borradores', async () => {
    const onGoToDrafts = vi.fn();
    const user = userEvent.setup();
    renderSeeded([{ items: [], nextCursor: null }], onGoToDrafts);

    expect(screen.getByText(/todav[ií]a nadie compartió una simulación/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ir a borradores/i }));
    expect(onGoToDrafts).toHaveBeenCalled();
  });

  it('sin reseñas todavía, la dificultad promedio muestra "sin datos", nunca 0', () => {
    renderSeeded([{ items: [item({ averageDifficulty: null })], nextCursor: null }]);

    expect(screen.getByText('sin datos')).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('con reseñas, muestra la dificultad promedio con un decimal', () => {
    renderSeeded([{ items: [item({ averageDifficulty: 3.25 })], nextCursor: null }]);

    expect(screen.getByText('3.3')).toBeInTheDocument();
  });

  it('muestra la materia con su comisión y la carga horaria total', () => {
    renderSeeded([{ items: [item({ totalWeeklyHours: 8 })], nextCursor: null }]);

    expect(screen.getByText('Combo liviano')).toBeInTheDocument();
    expect(screen.getByText('Base de datos')).toBeInTheDocument();
    expect(screen.getByText('com A')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('sin label propio, cae a un fallback honesto en vez de inventar un nombre', () => {
    renderSeeded([{ items: [item({ label: null })], nextCursor: null }]);

    expect(screen.getByText('Simulación sin nombre')).toBeInTheDocument();
  });

  it('sin nextCursor, no muestra "Ver más"', () => {
    renderSeeded([{ items: [item()], nextCursor: null }]);

    expect(screen.queryByRole('button', { name: /ver más/i })).not.toBeInTheDocument();
  });

  it('con nextCursor, "Ver más" pide la página siguiente con el cursor recibido', async () => {
    clientApiFetchMock.mockResolvedValue(
      jsonResponse({ items: [item({ id: 'sim-2', label: 'Combo 2' })], nextCursor: null }),
    );
    const user = userEvent.setup();
    renderSeeded([{ items: [item()], nextCursor: 'cursor-abc' }]);

    await user.click(screen.getByRole('button', { name: /ver más/i }));

    await waitFor(() =>
      expect(clientApiFetchMock).toHaveBeenCalledWith(
        expect.stringContaining('cursor=cursor-abc'),
        expect.anything(),
      ),
    );
    expect(await screen.findByText('Combo 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver más/i })).not.toBeInTheDocument();
  });
});
