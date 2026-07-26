import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcademicTerm, SimulationDraft } from '../types';
import { DraftList } from './draft-list';

/**
 * Tests de `DraftList` (US-023 + US-024 compartir): fallback de label con el período, materias +
 * comisión, y el cableado de las acciones (Editar/Borrar/Compartir/Dejar de compartir/Publicar) a
 * los server actions reales. Mocks de borde: `../actions` (las seis mutaciones) y `next/navigation`
 * (que usa `PublishPlanModal` para navegar a "En curso" tras publicar).
 */

const deleteMock = vi.fn();
const updateMock = vi.fn();
const promoteMock = vi.fn();
const shareMock = vi.fn();
const unshareMock = vi.fn();
vi.mock('../actions', () => ({
  deleteSimulationDraftAction: (...args: unknown[]) => deleteMock(...args),
  updateSimulationDraftAction: (...args: unknown[]) => updateMock(...args),
  promoteSimulationDraftAction: (...args: unknown[]) => promoteMock(...args),
  shareSimulationDraftAction: (...args: unknown[]) => shareMock(...args),
  unshareSimulationDraftAction: (...args: unknown[]) => unshareMock(...args),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const TERM_2027_1C: AcademicTerm = {
  id: 'term-2027-1c',
  universityId: 'uni-1',
  year: 2027,
  number: 1,
  kind: 'FourMonth',
  label: '2027-C1',
  startDate: '2027-03-01',
  endDate: '2027-07-01',
};

function draft(overrides: Partial<SimulationDraft> = {}): SimulationDraft {
  return {
    id: 'draft-1',
    termId: TERM_2027_1C.id,
    label: null,
    status: 'Draft',
    visibility: 'Private',
    items: [
      {
        subjectId: 'sub-1',
        subjectCode: '121',
        subjectName: 'Base de datos',
        commissionId: 'com-a',
        commissionName: 'A',
      },
      {
        subjectId: 'sub-2',
        subjectCode: '133',
        subjectName: 'Redes',
        commissionId: null,
        commissionName: null,
      },
    ],
    createdAt: '2026-07-26T03:00:00Z',
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  deleteMock.mockReset();
  updateMock.mockReset();
  promoteMock.mockReset();
  shareMock.mockReset();
  unshareMock.mockReset();
  pushMock.mockReset();
  vi.spyOn(window, 'confirm');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DraftList (US-023)', () => {
  it('sin borradores, muestra el estado vacío y "Crear borrador" dispara onCreate', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<DraftList drafts={[]} terms={[TERM_2027_1C]} onCreate={onCreate} />, { wrapper });

    expect(screen.getByText('No tenés borradores')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /crear borrador/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('muestra el label propio del borrador cuando lo tiene', () => {
    render(
      <DraftList
        drafts={[draft({ label: 'Plan liviano' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByRole('heading', { name: 'Plan liviano' })).toBeInTheDocument();
  });

  it('sin label propio, cae al fallback con el período formateado canónicamente', () => {
    render(
      <DraftList drafts={[draft({ label: null })]} terms={[TERM_2027_1C]} onCreate={vi.fn()} />,
      {
        wrapper,
      },
    );

    expect(screen.getByRole('heading', { name: '2027 · 1er cuatrimestre' })).toBeInTheDocument();
  });

  it('sin label y sin el término en la lista, cae a un fallback neutro', () => {
    render(<DraftList drafts={[draft({ label: null })]} terms={[]} onCreate={vi.fn()} />, {
      wrapper,
    });

    expect(screen.getByRole('heading', { name: 'Borrador sin nombre' })).toBeInTheDocument();
  });

  it('lista las materias con su comisión, o "sin comisión" si no eligió ninguna', () => {
    render(<DraftList drafts={[draft()]} terms={[TERM_2027_1C]} onCreate={vi.fn()} />, { wrapper });

    expect(screen.getByText('Base de datos')).toBeInTheDocument();
    expect(screen.getByText('com A')).toBeInTheDocument();
    expect(screen.getByText('Redes')).toBeInTheDocument();
    expect(screen.getByText('sin comisión')).toBeInTheDocument();
  });

  it('borrar sin confirmar no llama al action', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ label: 'Plan liviano' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^borrar$/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('borrar confirmando llama a deleteSimulationDraftAction con el id', async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    deleteMock.mockResolvedValue({ status: 'success' });
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ id: 'draft-x', label: 'Plan liviano' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^borrar$/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('draft-x'));
  });

  it('borrar con error del backend muestra el mensaje inline', async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    deleteMock.mockResolvedValue({ status: 'error', message: 'Ese borrador no te pertenece.' });
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ label: 'Plan liviano' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^borrar$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no te pertenece/i);
  });

  it('"Editar" abre el modal de edición con las materias del borrador', async () => {
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ label: 'Plan liviano' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^editar$/i }));

    expect(screen.getByRole('heading', { name: /editar borrador/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Plan liviano')).toBeInTheDocument();
  });

  it('"Publicar" abre el modal de confirmación con el label resuelto', async () => {
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ label: 'Plan liviano' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^publicar$/i }));

    expect(
      screen.getByRole('heading', { name: /publicar "plan liviano" como tu período en curso/i }),
    ).toBeInTheDocument();
  });

  it('un borrador privado no muestra el chip "Compartido" y ofrece "Compartir"', () => {
    render(
      <DraftList
        drafts={[draft({ visibility: 'Private' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      {
        wrapper,
      },
    );

    expect(screen.queryByText('Compartido')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^compartir$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dejar de compartir/i })).not.toBeInTheDocument();
  });

  it('"Compartir" abre el modal de explicación (US-024), sin llamar al action todavía', async () => {
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ label: 'Plan liviano', visibility: 'Private' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^compartir$/i }));

    expect(
      screen.getByRole('heading', { name: /compartir "plan liviano" con la comunidad/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sin tu nombre/i)).toBeInTheDocument();
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('confirmar en el modal de compartir llama a shareSimulationDraftAction con el id', async () => {
    shareMock.mockResolvedValue({ status: 'success', visibility: 'Shared' });
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ id: 'draft-x', visibility: 'Private' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^compartir$/i }));
    await user.click(screen.getByRole('button', { name: /compartir borrador/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledWith('draft-x'));
  });

  it('un borrador compartido muestra el chip "Compartido" y ofrece "Dejar de compartir"', () => {
    render(
      <DraftList
        drafts={[draft({ visibility: 'Shared' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      {
        wrapper,
      },
    );

    expect(screen.getByText('Compartido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dejar de compartir/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^compartir$/i })).not.toBeInTheDocument();
  });

  it('"Dejar de compartir" llama directo a unshareSimulationDraftAction, sin modal', async () => {
    unshareMock.mockResolvedValue({ status: 'success', visibility: 'Private' });
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ id: 'draft-y', visibility: 'Shared' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /dejar de compartir/i }));

    await waitFor(() => expect(unshareMock).toHaveBeenCalledWith('draft-y'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('error al compartir se muestra inline en la fila', async () => {
    shareMock.mockResolvedValue({ status: 'error', message: 'Ese borrador no te pertenece.' });
    const user = userEvent.setup();
    render(
      <DraftList
        drafts={[draft({ visibility: 'Private' })]}
        terms={[TERM_2027_1C]}
        onCreate={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('button', { name: /^compartir$/i }));
    await user.click(screen.getByRole('button', { name: /compartir borrador/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no te pertenece/i);
  });
});
