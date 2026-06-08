import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportReviewModal } from './report-review-modal';

const reportMock = vi.fn();
vi.mock('../actions', () => ({
  reportReviewAction: (...args: unknown[]) => reportMock(...args),
}));

const REVIEW = { id: 'rev-1' };

describe('ReportReviewModal', () => {
  beforeEach(() => {
    reportMock.mockReset();
  });

  it('no muestra el modal hasta hacer click en Reportar', () => {
    render(<ReportReviewModal review={REVIEW} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre el modal con las 5 razones', async () => {
    const user = userEvent.setup();
    render(<ReportReviewModal review={REVIEW} />);

    await user.click(screen.getByRole('button', { name: /reportar/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/¿por qué reportás esta reseña\?/i)).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('deshabilita Enviar hasta elegir un motivo', async () => {
    const user = userEvent.setup();
    render(<ReportReviewModal review={REVIEW} />);

    await user.click(screen.getByRole('button', { name: /reportar/i }));

    const submit = screen.getByRole('button', { name: /enviar reporte/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /datos personales/i }));
    expect(submit).toBeEnabled();
  });

  it('cierra sin llamar al action al cancelar', async () => {
    const user = userEvent.setup();
    render(<ReportReviewModal review={REVIEW} />);

    await user.click(screen.getByRole('button', { name: /reportar/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(reportMock).not.toHaveBeenCalled();
  });
});
