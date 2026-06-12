import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/'),
}));

import { MOCK_ENROLLMENT_CONTEXT } from '../data/mocks';
import { PUBLISH_REVIEW_INITIAL_STATE } from '../types';
import { ReviewEditor } from './review-editor';

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

const noop = vi.fn().mockResolvedValue(PUBLISH_REVIEW_INITIAL_STATE);

describe('ReviewEditor (US-049)', () => {
  it('renderea los 6 campos numerados y el preview lateral', () => {
    render(
      <ReviewEditor
        ctx={MOCK_ENROLLMENT_CONTEXT}
        enrollmentId="enrollment-test-001"
        submitAction={noop}
        submitInitialState={PUBLISH_REVIEW_INITIAL_STATE}
      />,
      { wrapper },
    );

    expect(screen.getByText(/cómo te pareció la cursada/i)).toBeInTheDocument();
    expect(screen.getByText(/qué tan difícil/i)).toBeInTheDocument();
    expect(screen.getByText(/cuántas horas estudiabas/i)).toBeInTheDocument();
    expect(screen.getByText(/etiquetá la cursada/i)).toBeInTheDocument();
    expect(screen.getByText(/contá tu experiencia/i)).toBeInTheDocument();
    expect(screen.getByText(/dos preguntas rápidas/i)).toBeInTheDocument();

    expect(screen.getByRole('radio', { name: /1 estrella$/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /claro explicando/i })).toBeInTheDocument();
    expect(screen.getByText('VERIFICADO QUE CURSÓ', { exact: true })).toBeInTheDocument();
  });

  it('el boton Publicar arranca disabled (rating y difficulty en 0)', () => {
    render(
      <ReviewEditor
        ctx={MOCK_ENROLLMENT_CONTEXT}
        enrollmentId="enrollment-test-001"
        submitAction={noop}
        submitInitialState={PUBLISH_REVIEW_INITIAL_STATE}
      />,
      { wrapper },
    );

    expect(screen.getByRole('button', { name: /publicar reseña/i })).toBeDisabled();
  });

  it('elegir rating y difficulty habilita el boton de publicar', async () => {
    const user = userEvent.setup();
    render(
      <ReviewEditor
        ctx={MOCK_ENROLLMENT_CONTEXT}
        enrollmentId="enrollment-test-001"
        submitAction={noop}
        submitInitialState={PUBLISH_REVIEW_INITIAL_STATE}
      />,
      { wrapper },
    );

    const publish = screen.getByRole('button', { name: /publicar reseña/i });
    expect(publish).toBeDisabled();

    await user.click(
      document.querySelector('label:has(input[name="field-rating-radio"][value="4"])') as Element,
    );
    expect(publish).toBeDisabled();

    await user.click(
      document.querySelector(
        'label:has(input[name="field-difficulty-radio"][value="3"])',
      ) as Element,
    );
    expect(publish).toBeEnabled();
  });
});
