import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../actions', () => ({
  updateSettingsAction: vi.fn(),
}));

import { updateSettingsAction } from '../actions';
import { ToggleSetting } from './toggle-setting';

const updateSettingsActionMock = vi.mocked(updateSettingsAction);

describe('ToggleSetting', () => {
  it('persiste el nuevo valor cuando el action devuelve success', async () => {
    updateSettingsActionMock.mockResolvedValue({
      status: 'success',
      patch: { notificationsInApp: true },
    });
    const user = userEvent.setup();

    render(
      <ToggleSetting field="notificationsInApp" initialValue={false} label="Notificaciones" />,
    );

    const toggle = screen.getByRole('switch', { name: 'Notificaciones' });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitFor(() => expect(toggle).toBeChecked());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hace rollback y muestra el error cuando el action devuelve error', async () => {
    updateSettingsActionMock.mockResolvedValue({
      status: 'error',
      message: 'No pudimos guardar el cambio. Probá de nuevo.',
    });
    const user = userEvent.setup();

    render(
      <ToggleSetting field="notificationsInApp" initialValue={false} label="Notificaciones" />,
    );

    const toggle = screen.getByRole('switch', { name: 'Notificaciones' });

    await user.click(toggle);

    // Rollback: el toggle vuelve al valor previo (false) tras el error.
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(
      await screen.findByText('No pudimos guardar el cambio. Probá de nuevo.'),
    ).toBeInTheDocument();
  });
});
