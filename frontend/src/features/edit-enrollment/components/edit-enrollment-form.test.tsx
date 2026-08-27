import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnrollmentToEdit } from '../types';
import { EditEnrollmentForm } from './edit-enrollment-form';

const submitMock = vi.fn(async () => ({ status: 'success' as const }));
vi.mock('../actions', () => ({
  submitEditEnrollmentAction: (...args: unknown[]) => submitMock(...(args as [])),
}));

const navigateMock = vi.fn();
vi.mock('@/lib/navigate-after-mutation', () => ({
  navigateAfterMutation: (url: string) => navigateMock(url),
}));

// El catálogo se stubea acá: lo que se está testeando es la puerta de la edición destructiva, no
// las cascadas de materias y comisiones (que ya son las del alta).
const TERMS = [
  {
    id: 'term-1',
    universityId: 'uni-1',
    year: 2025,
    number: 2,
    kind: 'Semester',
    label: '2025-C2',
  },
];
vi.mock('@/features/add-enrollment/api', () => ({
  addEnrollmentQueries: {
    academicTerms: (universityId: string | null) => ({
      queryKey: ['terms', universityId],
      queryFn: async () => TERMS,
    }),
    commissions: (subjectId: string | null, termId: string | null) => ({
      queryKey: ['commissions', subjectId, termId],
      queryFn: async () => [],
    }),
  },
}));

const PASSED: EnrollmentToEdit = {
  id: 'enr-1',
  subjectId: 'sub-1',
  subjectCode: 'ISW301',
  subjectName: 'Ingeniería de Software I',
  commissionId: null,
  termId: 'term-1',
  status: 'Passed',
  approvalMethod: 'Coursework',
  grade: 8,
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderForm() {
  return render(<EditEnrollmentForm enrollment={PASSED} universityId="uni-1" />, { wrapper });
}

describe('EditEnrollmentForm', () => {
  beforeEach(() => {
    submitMock.mockClear();
    navigateMock.mockReset();
  });

  it('precarga la cursada guardada', async () => {
    renderForm();

    expect(await screen.findByRole('combobox', { name: /estado/i })).toHaveValue('Passed');
    expect(screen.getByRole('combobox', { name: /forma de aprobación/i })).toHaveValue(
      'Coursework',
    );
    expect(screen.getByRole('spinbutton', { name: /nota final/i })).toHaveValue(8);
    expect(screen.getByRole('combobox', { name: /cuatrimestre/i })).toHaveValue('term-1');
  });

  it('no ofrece cambiar la materia', async () => {
    renderForm();
    await screen.findByRole('combobox', { name: /estado/i });

    expect(screen.queryByRole('combobox', { name: /materia/i })).not.toBeInTheDocument();
    expect(screen.getByText(/la materia no se puede cambiar/i)).toBeInTheDocument();
  });

  it('guarda al volver la cursada a en curso, sin confirmación de por medio', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(
      await screen.findByRole('combobox', { name: /estado/i }),
      'InProgress',
    );
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // El diálogo que había acá advertía que la reseña iba a revisión, y existía porque la reseña
    // del modelo anterior colgaba de la cursada. La vigente se ancla a cuenta, materia y período,
    // así que este cambio no toca ninguna: no hay nada que confirmar.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/my-career?tab=transcript'));
  });
});
