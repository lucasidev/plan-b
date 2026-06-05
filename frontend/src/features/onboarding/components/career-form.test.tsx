import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Component tests del `CareerForm` foco en el state restore via URL params (US-088).
 *
 * Mockeamos: actions (no queremos disparar submit real), `useSearchParams` y `useRouter` de
 * Next, y los fetchers de cascadas para que TanStack Query resuelva sync con datos preset.
 *
 * Lo que NO testeamos acá (vive en otros tests / E2E):
 * - submit happy path (action test)
 * - keyboard a11y (e2e onboarding)
 * - reset de cascadas al cambiar parent (lo cubre el flow manual + tipos)
 */

vi.mock('../actions', () => ({
  submitCareerAction: vi.fn(async () => ({ status: 'idle' })),
}));

const mockSearchParams = vi.fn(() => new ReadonlyURLSearchParams(new URLSearchParams()));
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    useSearchParams: () => mockSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  };
});

// Mock fetch global para las cascadas. Cada test pone su propio dataset.
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { CareerForm } from './career-form';

const UNI_ID = '11111111-1111-1111-1111-111111111111';
const OFFICIAL_CAREER = '22222222-2222-2222-2222-222222222221';
const CROWD_CAREER = '22222222-2222-2222-2222-222222222222';
const OFFICIAL_PLAN = '33333333-3333-3333-3333-333333333331';
const CROWD_PLAN = '33333333-3333-3333-3333-333333333332';

function renderWith(qc?: QueryClient) {
  const client =
    qc ??
    new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  return render(
    <QueryClientProvider client={client}>
      <CareerForm />
    </QueryClientProvider>,
  );
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default fetch handler: route por URL.
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/api/academic/universities')) {
      return Promise.resolve(jsonResponse([{ id: UNI_ID, name: 'UNSTA', slug: 'unsta' }]));
    }
    if (url.includes('/api/academic/careers')) {
      return Promise.resolve(
        jsonResponse([
          {
            id: OFFICIAL_CAREER,
            universityId: UNI_ID,
            name: 'TUDCS',
            slug: 'tudcs',
            isOfficial: true,
          },
          {
            id: CROWD_CAREER,
            universityId: UNI_ID,
            name: 'Ingeniería en Sistemas',
            slug: 'ingenieria-en-sistemas',
            isOfficial: false,
          },
        ]),
      );
    }
    if (url.includes('/api/academic/career-plans')) {
      return Promise.resolve(
        jsonResponse([
          {
            id: OFFICIAL_PLAN,
            careerId: OFFICIAL_CAREER,
            year: 2024,
            status: 'Active',
            isOfficial: true,
          },
          {
            id: CROWD_PLAN,
            careerId: CROWD_CAREER,
            year: 2024,
            status: 'Active',
            isOfficial: false,
          },
        ]),
      );
    }
    return Promise.resolve({ ok: false, status: 404 } as Response);
  });
});

describe('CareerForm state restore', () => {
  it('sin search params arranca con todos los dropdowns vacíos', async () => {
    mockSearchParams.mockReturnValue(new ReadonlyURLSearchParams(new URLSearchParams()));
    renderWith();

    await waitFor(() => {
      expect(screen.getByLabelText(/universidad/i)).toHaveValue('');
    });
    expect(screen.getByLabelText(/carrera/i)).toBeDisabled();
    expect(screen.getByLabelText(/plan de estudios/i)).toBeDisabled();
  });

  it('con universityId + careerId + planId restaura los 3 dropdowns', async () => {
    mockSearchParams.mockReturnValue(
      new ReadonlyURLSearchParams(
        new URLSearchParams({
          universityId: UNI_ID,
          careerId: CROWD_CAREER,
          planId: CROWD_PLAN,
          enrollmentYear: '2024',
        }),
      ),
    );

    renderWith();

    // Universidad arranca seleccionada (state inicial).
    await waitFor(() => {
      expect(screen.getByLabelText(/universidad/i)).toHaveValue(UNI_ID);
    });

    // Career too (no need to wait for careers to load; it comes from the param).
    await waitFor(() => {
      expect(screen.getByLabelText(/carrera/i)).toHaveValue(CROWD_CAREER);
    });

    // Plan is selected when plans.data loads (effect).
    await waitFor(() => {
      expect(screen.getByLabelText(/plan de estudios/i)).toHaveValue(CROWD_PLAN);
    });

    // The enrollment year from the param populates the input.
    expect(screen.getByLabelText(/año de ingreso/i)).toHaveValue(2024);
  });

  it('marca los planes no oficiales en el select option label', async () => {
    mockSearchParams.mockReturnValue(
      new ReadonlyURLSearchParams(
        new URLSearchParams({
          universityId: UNI_ID,
          careerId: CROWD_CAREER,
        }),
      ),
    );
    renderWith();

    await waitFor(() => {
      const planSelect = screen.getByLabelText(/plan de estudios/i);
      expect(planSelect).not.toBeDisabled();
    });

    // Una de las options dice "Plan 2024 · No oficial".
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /plan 2024 · no oficial/i })).toBeInTheDocument();
    });
  });

  it('muestra link "Mi plan no aparece" cuando hay universityId seleccionada', async () => {
    mockSearchParams.mockReturnValue(
      new ReadonlyURLSearchParams(new URLSearchParams({ universityId: UNI_ID })),
    );
    renderWith();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /mi plan no aparece/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        expect.stringContaining(`/onboarding/career/plan-import?universityId=${UNI_ID}`),
      );
    });
  });

  it('muestra la nota explicativa cuando el plan seleccionado es no oficial', async () => {
    mockSearchParams.mockReturnValue(
      new ReadonlyURLSearchParams(
        new URLSearchParams({
          universityId: UNI_ID,
          careerId: CROWD_CAREER,
          planId: CROWD_PLAN,
        }),
      ),
    );
    renderWith();

    await waitFor(() => {
      expect(screen.getByText(/este plan fue subido por un alumno/i)).toBeInTheDocument();
    });
  });
});
