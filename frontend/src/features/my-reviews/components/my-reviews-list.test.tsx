import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { myReviewsQueries } from '../api';
import type { MyReview, MyReviewsResponse } from '../types';
import { MyReviewsList } from './my-reviews-list';

// DeleteReviewModal no es lo que este test cubre (gating de Editar + explicación de la
// cuarentena); se stubea para no arrastrar su useRouter() + server action real.
vi.mock('@/features/delete-review', () => ({
  DeleteReviewModal: () => null,
}));

function review(overrides: Partial<MyReview> = {}): MyReview {
  return {
    id: 'rev-1',
    enrollmentId: 'enr-1',
    subjectId: 'sub-1',
    subjectCode: 'ISW301',
    subjectName: 'Ingeniería de Software I',
    status: 'Published',
    underReviewReason: null,
    difficultyRating: 3,
    subjectText: 'Una reseña de prueba.',
    finalGrade: null,
    createdAt: '2026-07-20T00:00:00Z',
    ...overrides,
  };
}

/**
 * Renderea la lista con `items` ya sentados en el cache (equivalente a lo que hidrataría la
 * RSC de /reviews). `staleTime: Infinity` evita que useSuspenseQuery dispare un refetch de
 * fondo contra `fetch`, que no existe en jsdom sin mockear.
 */
function renderList(items: MyReview[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const data: MyReviewsResponse = {
    items,
    stats: {
      totalCount: items.length,
      publishedCount: items.filter((i) => i.status === 'Published').length,
      underReviewCount: items.filter((i) => i.status === 'UnderReview').length,
      removedCount: items.filter((i) => i.status === 'Removed').length,
    },
  };
  queryClient.setQueryData(myReviewsQueries.list().queryKey, data);

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(<MyReviewsList />, { wrapper });
}

describe('MyReviewsList: edición desde cuarentena (ADR-0012, revisión 2026-07-29)', () => {
  it('habilita Editar solo para ContentFilter y EnrollmentChanged, no para Reports, y explica cada una', () => {
    renderList([
      review({ id: 'rev-filter', status: 'UnderReview', underReviewReason: 'ContentFilter' }),
      review({
        id: 'rev-enrollment',
        status: 'UnderReview',
        underReviewReason: 'EnrollmentChanged',
      }),
      review({ id: 'rev-reports', status: 'UnderReview', underReviewReason: 'Reports' }),
    ]);

    const editLinks = screen.getAllByRole('link', { name: /^editar$/i });
    expect(editLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/reviews/edit/rev-filter',
      '/reviews/edit/rev-enrollment',
    ]);

    expect(
      screen.getByText(/el filtro de contenido la retuvo antes de publicarla/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/la cursada que respalda esta reseña cambió/i)).toBeInTheDocument();
    expect(screen.getByText(/la reportaron y un moderador la va a resolver/i)).toBeInTheDocument();

    // La tercera (Reports) no tiene link: solo el estado "No editable" con su motivo en el tooltip.
    const nonEditable = screen.getByText('No editable');
    expect(nonEditable).toHaveAttribute(
      'title',
      'La reportaron y un moderador la va a resolver. No podés editarla hasta que eso pase.',
    );
  });

  it('una reseña Removed no es editable y el tooltip dice que la removió un moderador', () => {
    renderList([review({ id: 'rev-removed', status: 'Removed', underReviewReason: null })]);

    expect(screen.queryByRole('link', { name: /^editar$/i })).not.toBeInTheDocument();
    expect(screen.getByText('No editable')).toHaveAttribute(
      'title',
      'La removió un moderador: no se puede editar.',
    );
  });

  it('una reseña Published sigue siendo editable sin ninguna nota de cuarentena', () => {
    renderList([review({ id: 'rev-published', status: 'Published' })]);

    expect(screen.getByRole('link', { name: /^editar$/i })).toHaveAttribute(
      'href',
      '/reviews/edit/rev-published',
    );
    expect(screen.queryByText(/moderador/i)).not.toBeInTheDocument();
  });
});
