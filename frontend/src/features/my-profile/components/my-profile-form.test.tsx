import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyProfile } from '../types';
import { MyProfileForm } from './my-profile-form';

/**
 * Component tests del guardado de Mi perfil (US-047): el guardado tiene que esperar al
 * action y recién ahí cerrar el form y recargar, en la misma transición, para que la
 * vista nunca muestre el nombre viejo ni un guardado fallido cierre el form perdiendo lo
 * tipeado.
 */

const { reloadMock } = vi.hoisted(() => ({ reloadMock: vi.fn() }));

vi.mock('@/lib/reload-after-mutation', () => ({
  reloadAfterMutation: reloadMock,
}));

vi.mock('../actions', () => ({
  updateMyProfileAction: vi.fn(),
}));

import { updateMyProfileAction } from '../actions';

const actionMock = vi.mocked(updateMyProfileAction);

function profile(over: Partial<MyProfile> = {}): MyProfile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    careerId: 'career-1',
    careerPlanId: 'plan-1',
    enrollmentYear: 2023,
    status: 'Active',
    displayName: 'Lucía Mansilla',
    yearOfStudy: 2,
    legajo: '12345',
    regularStudent: true,
    updatedAt: null,
    email: 'lucia@unsta.edu.ar',
    memberSince: '2023-03-01T00:00:00Z',
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MyProfileForm: guardar', () => {
  it('espera al action y recién después cierra el form y recarga', async () => {
    let resolveAction: (value: { status: 'success' }) => void = () => {};
    actionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<MyProfileForm profile={profile()} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(reloadMock).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /editar datos académicos/i })).toBeInTheDocument();

    await act(async () => {
      resolveAction({ status: 'success' });
    });

    expect(await screen.findByRole('button', { name: /^editar$/i })).toBeInTheDocument();
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('heading', { name: /editar datos académicos/i }),
    ).not.toBeInTheDocument();
  });

  it('un guardado fallido deja el form abierto con lo tipeado y muestra el mensaje', async () => {
    actionMock.mockResolvedValue({
      status: 'error',
      message: 'No pudimos guardar los cambios. Probá de nuevo.',
    });
    const user = userEvent.setup();
    render(<MyProfileForm profile={profile()} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    const nameInput = screen.getByLabelText(/nombre para mostrar/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Lucía Nueva');

    await user.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(
      await screen.findByText('No pudimos guardar los cambios. Probá de nuevo.'),
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue('Lucía Nueva');
    expect(screen.getByRole('heading', { name: /editar datos académicos/i })).toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('el botón Guardar queda deshabilitado mientras el action está en vuelo', async () => {
    let resolveAction: (value: { status: 'success' }) => void = () => {};
    actionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<MyProfileForm profile={profile()} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    const submit = screen.getByRole('button', { name: /^guardar$/i });
    await user.click(submit);

    expect(submit).toBeDisabled();

    await act(async () => {
      resolveAction({ status: 'success' });
    });
  });
});
