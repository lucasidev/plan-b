import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorialNoteForm } from './editorial-note-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../actions', () => ({
  publishEditorialNoteAction: vi.fn(),
}));

describe('EditorialNoteForm', () => {
  /**
   * ADR-0084: las notas editoriales van a nivel carrera o institución, nunca de una cátedra
   * puntual (ahí el docente es identificable). El formulario nunca ofrece ese nivel.
   */
  it('nunca ofrece nivel cátedra, solo universidad y carrera', () => {
    render(
      <EditorialNoteForm
        universities={[{ id: 'uni-1', name: 'UNSTA' }]}
        careers={[{ id: 'career-1', name: 'Ingeniería en Sistemas' }]}
        selectedUniversityId="uni-1"
      />,
    );

    expect(screen.getByLabelText('Universidad')).toBeInTheDocument();
    expect(screen.getByLabelText('Carrera')).toBeInTheDocument();
    expect(screen.queryByLabelText(/cátedra/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /va a nivel carrera y nunca de una cátedra: ahí el docente es identificable/i,
      ),
    ).toBeInTheDocument();
  });
});
