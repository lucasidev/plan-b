import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommissionSelection } from '../types';
import { SaveDraftModal } from './save-draft-modal';

/**
 * Tests de `SaveDraftModal` (US-023, spec punto 3): "guardar la combinación actual como borrador"
 * es el flujo que le da sentido a todo lo demás en Planificar, así que se verifica el submit real
 * (label opcional viaja como escrito o como null, items tal cual llegan) y las dos ramas de
 * resultado. Mock de borde: `../actions` (createSimulationDraftAction).
 */

const createMock = vi.fn();
vi.mock('../actions', () => ({
  createSimulationDraftAction: (...args: unknown[]) => createMock(...args),
}));

const ITEMS: CommissionSelection[] = [{ subjectId: 'sub-1', commissionId: 'com-a' }];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  createMock.mockReset();
});

describe('SaveDraftModal (US-023)', () => {
  it('cerrado no renderea el dialog', () => {
    render(<SaveDraftModal open={false} onClose={vi.fn()} termId="term-1" items={ITEMS} />, {
      wrapper,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sin nombre, guarda con label null', async () => {
    createMock.mockResolvedValue({ status: 'success', id: 'draft-1' });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SaveDraftModal open onClose={onClose} termId="term-1" items={ITEMS} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /^guardar borrador$/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith('term-1', null, ITEMS));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('con nombre tipeado, lo manda trimeado', async () => {
    createMock.mockResolvedValue({ status: 'success', id: 'draft-1' });
    const user = userEvent.setup();
    render(<SaveDraftModal open onClose={vi.fn()} termId="term-1" items={ITEMS} />, { wrapper });

    await user.type(screen.getByLabelText(/nombre/i), '  Plan liviano  ');
    await user.click(screen.getByRole('button', { name: /^guardar borrador$/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith('term-1', 'Plan liviano', ITEMS));
  });

  it('error del backend se muestra inline y el modal sigue abierto', async () => {
    createMock.mockResolvedValue({
      status: 'error',
      message: 'Alcanzaste el límite de guardados por hora. Probá de nuevo más tarde.',
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SaveDraftModal open onClose={onClose} termId="term-1" items={ITEMS} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /^guardar borrador$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/límite de guardados por hora/i);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cancelar cierra sin llamar al action', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SaveDraftModal open onClose={onClose} termId="term-1" items={ITEMS} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(onClose).toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});
