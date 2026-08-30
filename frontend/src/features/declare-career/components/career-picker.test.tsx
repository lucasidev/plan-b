import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareerPicker } from './career-picker';

/**
 * Component tests del `CareerPicker` (adaptado de
 * `features/onboarding/components/career-form.test.tsx`). El componente es
 * controlado (`value` + `onChange`) así que estos tests lo envuelven en `ControlledPicker`,
 * que sostiene el `careerPlanId` en `useState` para poder observar cómo el `<select>` "Plan
 * de estudios" refleja lo que el picker le pasa a `onChange` (auto-selección por precarga,
 * o el reset al cambiar de padre).
 *
 * A diferencia del `CareerForm` de onboarding, acá no hace falta mockear `next/navigation`:
 * `CareerPicker` no lee `useSearchParams()` por sí mismo, recibe los valores iniciales por
 * props (así lo puede montar cualquier consumidor, no solo uno que sepa de search params).
 *
 * Lo que NO testeamos acá (vive en otros tests / E2E):
 * - el picker montado adentro de un `<form>` real con submit (E2E de sign-up)
 * - keyboard a11y (e2e)
 */

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const UNI_ID = '11111111-1111-1111-1111-111111111111';
const OFFICIAL_CAREER = '22222222-2222-2222-2222-222222222221';
const CROWD_CAREER = '22222222-2222-2222-2222-222222222222';
const OFFICIAL_PLAN = '33333333-3333-3333-3333-333333333331';
const CROWD_PLAN = '33333333-3333-3333-3333-333333333332';

type PickerProps = Omit<React.ComponentProps<typeof CareerPicker>, 'value' | 'onChange'>;

/** Wrapper controlado: sostiene el `careerPlanId` para poder observar el resultado de los
 * `onChange` que dispara `CareerPicker` (elegir un plan, reset de cascada). */
function ControlledPicker(props: PickerProps) {
  const [value, setValue] = useState('');
  return <CareerPicker value={value} onChange={setValue} {...props} />;
}

function renderWith(props: PickerProps = {}, qc?: QueryClient) {
  const client =
    qc ??
    new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  return render(
    <QueryClientProvider client={client}>
      <ControlledPicker {...props} />
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
      // Filtramos por careerId (a diferencia de universities/careers arriba) porque el test
      // de reset de cascada depende de que cambiar de carrera traiga una lista sin el plan
      // viejo: con las dos listas mezcladas, el plan elegido seguiría siendo una option
      // válida y el reset no se vería.
      if (url.includes(CROWD_CAREER)) {
        return Promise.resolve(
          jsonResponse([
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
      if (url.includes(OFFICIAL_CAREER)) {
        return Promise.resolve(
          jsonResponse([
            {
              id: OFFICIAL_PLAN,
              careerId: OFFICIAL_CAREER,
              year: 2024,
              status: 'Active',
              isOfficial: true,
            },
          ]),
        );
      }
      return Promise.resolve(jsonResponse([]));
    }
    return Promise.resolve({ ok: false, status: 404 } as Response);
  });
});

/** Recorre la cascada como la recorre una persona. Antes estos tests saltaban al estado
 * profundo con props `initial*`; se fueron con la precarga, que no tenía quien la produjera. */
async function walkCascade(
  user: ReturnType<typeof userEvent.setup>,
  careerId: string,
  planId?: string,
) {
  await waitFor(() => {
    expect(screen.getByLabelText(/universidad/i)).not.toBeDisabled();
  });
  await user.selectOptions(screen.getByLabelText(/universidad/i), UNI_ID);

  await waitFor(() => {
    expect(screen.getByLabelText(/carrera/i)).not.toBeDisabled();
  });
  await user.selectOptions(screen.getByLabelText(/carrera/i), careerId);

  if (planId === undefined) return;
  await waitFor(() => {
    expect(screen.getByLabelText(/plan de estudios/i)).not.toBeDisabled();
  });
  await user.selectOptions(screen.getByLabelText(/plan de estudios/i), planId);
}

describe('CareerPicker cascada y reset', () => {
  it('sin valores iniciales arranca con todos los dropdowns vacíos (disabled encadenado)', async () => {
    renderWith();

    await waitFor(() => {
      expect(screen.getByLabelText(/universidad/i)).toHaveValue('');
    });
    expect(screen.getByLabelText(/carrera/i)).toBeDisabled();
    expect(screen.getByLabelText(/plan de estudios/i)).toBeDisabled();
  });

  it('elegir universidad y carrera habilita el plan con sus options', async () => {
    const user = userEvent.setup();
    renderWith();
    await walkCascade(user, CROWD_CAREER, CROWD_PLAN);

    await waitFor(() => {
      expect(screen.getByLabelText(/plan de estudios/i)).toHaveValue(CROWD_PLAN);
    });
  });

  it('marca los planes no oficiales en el select option label', async () => {
    const user = userEvent.setup();
    renderWith();
    await walkCascade(user, CROWD_CAREER);

    await waitFor(() => {
      const planSelect = screen.getByLabelText(/plan de estudios/i);
      expect(planSelect).not.toBeDisabled();
    });

    // Una de las options dice "Plan 2024 · No oficial".
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /plan 2024 · no oficial/i })).toBeInTheDocument();
    });
  });

  it('muestra la nota explicativa cuando el plan seleccionado es no oficial', async () => {
    const user = userEvent.setup();
    renderWith();
    await walkCascade(user, CROWD_CAREER, CROWD_PLAN);

    await waitFor(() => {
      expect(screen.getByText(/este plan fue subido por un alumno/i)).toBeInTheDocument();
    });
  });

  it('cambiar de carrera resetea el plan elegido (reset de la cascada)', async () => {
    const user = userEvent.setup();
    renderWith();
    await walkCascade(user, CROWD_CAREER, CROWD_PLAN);

    await waitFor(() => {
      expect(screen.getByLabelText(/plan de estudios/i)).toHaveValue(CROWD_PLAN);
    });

    await user.selectOptions(screen.getByLabelText(/carrera/i), OFFICIAL_CAREER);

    await waitFor(() => {
      expect(screen.getByLabelText(/plan de estudios/i)).toHaveValue('');
    });
  });
});

describe('CareerPicker estados vacío y error por nivel', () => {
  const EMPTY_CAREER = '22222222-2222-2222-2222-222222222299';

  async function selectUniversity(user: ReturnType<typeof userEvent.setup>) {
    await waitFor(() => {
      expect(screen.getByLabelText(/universidad/i)).not.toBeDisabled();
    });
    await user.selectOptions(screen.getByLabelText(/universidad/i), UNI_ID);
  }

  it('la carrera muestra mensaje cuando la universidad no tiene carreras cargadas', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/academic/universities')) {
        return Promise.resolve(jsonResponse([{ id: UNI_ID, name: 'UNSTA', slug: 'unsta' }]));
      }
      if (url.includes('/api/academic/careers')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const user = userEvent.setup();
    renderWith();
    await selectUniversity(user);

    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: /esta universidad todavía no tiene carreras cargadas/i,
        }),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/carrera/i)).toBeDisabled();
  });

  it('la carrera muestra error y permite reintentar cuando falla la carga', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/academic/universities')) {
        return Promise.resolve(jsonResponse([{ id: UNI_ID, name: 'UNSTA', slug: 'unsta' }]));
      }
      if (url.includes('/api/academic/careers')) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const user = userEvent.setup();
    renderWith();
    await selectUniversity(user);

    // Regex con el punto final para no matchear también el texto (más corto, sin punto) de
    // la option placeholder del select.
    await waitFor(() => {
      expect(screen.getByText(/no pudimos cargar las carreras\. prob/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/carrera/i)).toBeDisabled();

    const callsBefore = fetchMock.mock.calls.filter(([u]) =>
      String(u).includes('/api/academic/careers'),
    ).length;
    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => {
      const callsAfter = fetchMock.mock.calls.filter(([u]) =>
        String(u).includes('/api/academic/careers'),
      ).length;
      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });

  it('el plan muestra mensaje cuando la carrera no tiene planes cargados', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/academic/universities')) {
        return Promise.resolve(jsonResponse([{ id: UNI_ID, name: 'UNSTA', slug: 'unsta' }]));
      }
      if (url.includes('/api/academic/careers')) {
        return Promise.resolve(
          jsonResponse([
            {
              id: EMPTY_CAREER,
              universityId: UNI_ID,
              name: 'Carrera sin planes',
              slug: 'carrera-sin-planes',
              isOfficial: true,
            },
          ]),
        );
      }
      if (url.includes('/api/academic/career-plans')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const user = userEvent.setup();
    renderWith();
    await selectUniversity(user);
    await waitFor(() => {
      expect(screen.getByLabelText(/carrera/i)).not.toBeDisabled();
    });
    await user.selectOptions(screen.getByLabelText(/carrera/i), EMPTY_CAREER);

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /esta carrera todavía no tiene planes cargados/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/plan de estudios/i)).toBeDisabled();
  });

  it('el plan muestra error y permite reintentar cuando falla la carga', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/academic/universities')) {
        return Promise.resolve(jsonResponse([{ id: UNI_ID, name: 'UNSTA', slug: 'unsta' }]));
      }
      if (url.includes('/api/academic/careers')) {
        return Promise.resolve(
          jsonResponse([
            {
              id: EMPTY_CAREER,
              universityId: UNI_ID,
              name: 'Carrera con planes rotos',
              slug: 'carrera-con-planes-rotos',
              isOfficial: true,
            },
          ]),
        );
      }
      if (url.includes('/api/academic/career-plans')) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const user = userEvent.setup();
    renderWith();
    await selectUniversity(user);
    await waitFor(() => {
      expect(screen.getByLabelText(/carrera/i)).not.toBeDisabled();
    });
    await user.selectOptions(screen.getByLabelText(/carrera/i), EMPTY_CAREER);

    // Regex con el punto final para no matchear también el texto (más corto, sin punto) de
    // la option placeholder del select.
    await waitFor(() => {
      expect(screen.getByText(/no pudimos cargar los planes\. prob/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/plan de estudios/i)).toBeDisabled();

    const callsBefore = fetchMock.mock.calls.filter(([u]) =>
      String(u).includes('/api/academic/career-plans'),
    ).length;
    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => {
      const callsAfter = fetchMock.mock.calls.filter(([u]) =>
        String(u).includes('/api/academic/career-plans'),
      ).length;
      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });
});
