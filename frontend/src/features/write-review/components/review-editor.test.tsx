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

// Un solo docente: el editor lo preselecciona, así el gate del picker no estorba a los tests que
// validan los otros campos. Los tests del picker en sí usan dos docentes.
const ONE_TEACHER = [
  { teacherId: 'tid-brandt', firstName: 'Carlos', lastName: 'Brandt', role: 'Lead' },
];
const TWO_TEACHERS = [
  ...ONE_TEACHER,
  { teacherId: 'tid-sosa', firstName: 'Diego', lastName: 'Sosa', role: 'PracticalLead' },
];

// El texto es obligatorio al publicar (mínimo 50 chars, alineado con ReviewText del backend).
const VALID_TEXT =
  'Cursada muy buena, el material es claro y los parciales fueron justos. La recomiendo.';

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
        teachers={ONE_TEACHER}
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
    // Falta el texto: el botón sigue disabled hasta cargarlo.
    expect(publish).toBeDisabled();

    await user.type(screen.getByLabelText(/contá tu experiencia/i), VALID_TEXT);
    expect(publish).toBeEnabled();
  });

  it('con varios docentes, el boton queda disabled hasta elegir uno', async () => {
    const user = userEvent.setup();
    render(
      <ReviewEditor
        ctx={MOCK_ENROLLMENT_CONTEXT}
        enrollmentId="enrollment-test-001"
        teachers={TWO_TEACHERS}
        submitAction={noop}
        submitInitialState={PUBLISH_REVIEW_INITIAL_STATE}
      />,
      { wrapper },
    );

    const publish = screen.getByRole('button', { name: /publicar reseña/i });

    // Rating + difficulty + texto listos, pero sin docente elegido el boton sigue disabled.
    await user.click(
      document.querySelector('label:has(input[name="field-rating-radio"][value="4"])') as Element,
    );
    await user.click(
      document.querySelector(
        'label:has(input[name="field-difficulty-radio"][value="3"])',
      ) as Element,
    );
    await user.type(screen.getByLabelText(/contá tu experiencia/i), VALID_TEXT);
    expect(publish).toBeDisabled();

    // Elegir el docente lo habilita.
    await user.click(screen.getByRole('radio', { name: /Diego Sosa/i }));
    expect(publish).toBeEnabled();
  });
});
