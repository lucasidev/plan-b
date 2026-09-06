import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminTeacherRow, ToggleResult } from '../types';
import { TeacherTable } from './teacher-table';

/**
 * Component tests de la baja/reactivación de docentes (US-063 admin): la fila tiene que
 * reflejar la respuesta del action apenas llega, sin depender de que el refresh de
 * router.refresh() commitee (ese refetch puede abortarse en test/CI y dejaba la transición
 * pendiente para siempre, con la fila trabada en ACTIVO y el botón deshabilitado).
 */

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

vi.mock('../actions', () => ({
  deactivateTeacherAction: vi.fn(),
  reactivateTeacherAction: vi.fn(),
}));

import { deactivateTeacherAction } from '../actions';

const deactivateMock = vi.mocked(deactivateTeacherAction);

function activeTeacher(over: Partial<AdminTeacherRow> = {}): AdminTeacherRow {
  return {
    id: 'teacher-1',
    universityId: 'uni-1',
    universityName: 'UNSTA',
    firstName: 'Elio',
    lastName: 'Copas',
    title: 'Profesor titular',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.confirm = vi.fn(() => true);
});

describe('TeacherTable: baja de un docente', () => {
  it('dar de baja refleja la respuesta del action en la fila y pide el refresh', async () => {
    deactivateMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<TeacherTable teachers={[activeTeacher()]} />);

    expect(screen.getByText('ACTIVO')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(await screen.findByText('INACTIVO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reactivar' })).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('mientras el action está en vuelo el botón queda deshabilitado y después vuelve', async () => {
    let resolveAction: (value: ToggleResult) => void = () => {};
    deactivateMock.mockReturnValue(
      new Promise<ToggleResult>((resolve) => {
        resolveAction = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<TeacherTable teachers={[activeTeacher()]} />);

    const button = screen.getByRole('button', { name: 'Desactivar' });
    await user.click(button);

    expect(button).toBeDisabled();

    await act(async () => {
      resolveAction({ ok: true });
    });

    expect(button).toBeEnabled();
  });

  it('un action que falla deja la fila como estaba y muestra el mensaje', async () => {
    deactivateMock.mockResolvedValue({
      ok: false,
      message: 'No pudimos cambiar el estado. Probá de nuevo.',
    });
    const user = userEvent.setup();
    render(<TeacherTable teachers={[activeTeacher()]} />);

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(
      await screen.findByText('No pudimos cambiar el estado. Probá de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('ACTIVO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
