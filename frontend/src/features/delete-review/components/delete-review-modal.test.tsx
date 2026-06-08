import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteReviewModal } from './delete-review-modal';

// Mock the server action so the component test stays in jsdom (no real fetch).
const deleteMock = vi.fn();
vi.mock('../actions', () => ({
  deleteReviewAction: (...args: unknown[]) => deleteMock(...args),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const REVIEW = {
  id: 'rev-1',
  subjectCode: 'ISW301',
  subjectName: 'Ingeniería de Software I',
  difficultyRating: 4,
  subjectText: 'Materia exigente pero bien estructurada, recomendable con tiempo.',
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('DeleteReviewModal', () => {
  beforeEach(() => {
    deleteMock.mockReset();
    pushMock.mockReset();
  });

  it('no muestra el modal hasta hacer click en Borrar', () => {
    render(<DeleteReviewModal review={REVIEW} />, { wrapper });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre el modal con el código de materia en el heading y el preview', async () => {
    const user = userEvent.setup();
    render(<DeleteReviewModal review={REVIEW} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /^borrar$/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/¿borrar tu reseña de ISW301\?/i)).toBeInTheDocument();
    // Preview shows the difficulty + subject + the (quoted) text snippet.
    expect(screen.getByText(/dificultad 4\/5/i)).toBeInTheDocument();
    expect(screen.getByText(/materia exigente pero bien estructurada/i)).toBeInTheDocument();
  });

  it('cierra el modal al cancelar sin llamar al action', async () => {
    const user = userEvent.setup();
    render(<DeleteReviewModal review={REVIEW} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /^borrar$/i }));
    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('ofrece un link para editar en vez de borrar', async () => {
    const user = userEvent.setup();
    render(<DeleteReviewModal review={REVIEW} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /^borrar$/i }));

    const editLink = screen.getByRole('link', { name: /editala/i });
    expect(editLink).toHaveAttribute('href', '/reviews/edit/rev-1');
  });
});
