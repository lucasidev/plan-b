import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import type { AdminUserRow } from '../types';
import { UserTable } from './user-table';

const { changeAccess, refresh } = vi.hoisted(() => ({
  changeAccess: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('../actions', () => ({ changeUserAccessAction: changeAccess }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const account: AdminUserRow = {
  id: 'student-1',
  email: 'student@example.test',
  createdAt: '2026-09-01T00:00:00Z',
  emailVerifiedAt: '2026-09-01T00:00:00Z',
  disabledAt: null,
  disabledReason: null,
  displayName: null,
  careerId: null,
  careerName: null,
  universityName: null,
  enrollmentYear: null,
};

beforeEach(() => vi.resetAllMocks());

it('espera la confirmación y permite reactivar aunque el refresh no actualice las props', async () => {
  const user = userEvent.setup();
  let resolveAction!: (result: { ok: true }) => void;
  changeAccess.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
  );
  render(<UserTable users={[account]} />);
  await user.click(screen.getByRole('button', { name: 'Suspender acceso' }));
  await user.type(screen.getByLabelText('Motivo de la suspensión'), 'Revisión');
  await user.click(screen.getByRole('button', { name: 'Confirmar suspensión' }));
  expect(screen.getByText('Activa')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  await act(async () => resolveAction({ ok: true }));
  expect(screen.getByText('Suspendida')).toBeInTheDocument();
  expect(screen.getByText('Motivo: Revisión')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reactivar acceso' })).toBeEnabled();
  changeAccess.mockResolvedValueOnce({ ok: true });
  await user.click(screen.getByRole('button', { name: 'Reactivar acceso' }));
  expect(screen.getByText('Activa')).toBeInTheDocument();
  expect(changeAccess).toHaveBeenLastCalledWith({
    id: account.id,
    operation: 'restore',
    reason: '',
  });
});

it('conserva el motivo y el estado anterior cuando el servidor rechaza el cambio', async () => {
  const user = userEvent.setup();
  changeAccess.mockResolvedValue({ ok: false, message: 'El estado cambió.' });
  render(<UserTable users={[account]} />);
  await user.click(screen.getByRole('button', { name: 'Suspender acceso' }));
  await user.type(screen.getByLabelText('Motivo de la suspensión'), 'Revisión');
  await user.click(screen.getByRole('button', { name: 'Confirmar suspensión' }));
  expect(screen.getByRole('alert')).toHaveTextContent('El estado cambió.');
  expect(screen.getByLabelText('Motivo de la suspensión')).toHaveValue('Revisión');
  expect(screen.getByText('Activa')).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();
});

it('incorpora una lectura posterior y conserva el borrador de otra fila', async () => {
  const user = userEvent.setup();
  const other = { ...account, id: 'student-2', email: 'other@example.test' };
  const { rerender } = render(<UserTable users={[account, other]} />);
  const otherRow = within(screen.getByRole('row', { name: /other@example.test/ }));
  await user.click(otherRow.getByRole('button', { name: 'Suspender acceso' }));
  await user.type(otherRow.getByLabelText('Motivo de la suspensión'), 'Borrador pendiente');
  rerender(
    <UserTable
      users={[
        { ...account, disabledAt: '2026-09-18T00:00:00Z', disabledReason: 'Otro administrador' },
        { ...other },
      ]}
    />,
  );
  expect(screen.getByText('Suspendida')).toBeInTheDocument();
  expect(screen.getByText('Motivo: Otro administrador')).toBeInTheDocument();
  expect(otherRow.getByLabelText('Motivo de la suspensión')).toHaveValue('Borrador pendiente');
});
