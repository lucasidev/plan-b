import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchResultItem } from '../types';
import { GlobalSearch } from './global-search';

/**
 * Component tests de `GlobalSearch`, escritos desde los escenarios de US-132 (hallazgo V04: "el
 * buscador no devuelve carreras ni universidades"), no desde el código: cada test nombra lo que la
 * story promete y verifica lo que Valentina ve, no una función interna.
 *
 * Lo que NO testeamos acá (ya cubierto o vive en otro lado):
 * - materia, docente y cátedra en sí (regresión pre-existente al feature; entran acá solo como
 *   parte de la mezcla, para probar que career/institution suman tipos y no los reemplazan).
 * - el estado "sin resultados" y su explicación de dos causas (US-139, Backlog: no construido).
 * - navegación por teclado y el atajo ⌘K (sin cambios en este diff).
 */

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const UNSTA = {
  id: 'uni-unsta',
  slug: 'unsta',
  name: 'Universidad del Norte Santo Tomás de Aquino',
};
const UNT = { id: 'uni-unt', slug: 'unt', name: 'Universidad Nacional de Tucumán' };

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

/** Responde `/api/search` con `items` fijo y `/api/academic/universities` con el directorio dado. */
function stubSearch(
  items: SearchResultItem[],
  universities: Array<{ id: string; slug: string; name: string }> = [],
) {
  fetchMock.mockImplementation((url: string) => {
    if (String(url).startsWith('/api/search')) {
      return Promise.resolve(jsonResponse({ items }));
    }
    if (String(url).includes('/api/academic/universities')) {
      return Promise.resolve(jsonResponse(universities));
    }
    return Promise.resolve({ ok: false, status: 404 } as Response);
  });
}

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <GlobalSearch />
    </QueryClientProvider>,
  );
}

/** Escribe un término y espera a que el dropdown esté abierto con al menos un resultado. */
async function search(user: ReturnType<typeof userEvent.setup>, term: string) {
  const input = screen.getByRole('combobox', { name: /buscar materia, carrera o docente/i });
  await user.type(input, term);
  await waitFor(
    () => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    },
    { timeout: 3000 },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GlobalSearch: US-132, carrera e institución suman tipos de resultado', () => {
  it('muestra el tipo de cada resultado para saber a dónde va antes de clickear', async () => {
    const user = userEvent.setup();
    stubSearch([
      { type: 'subject', id: 'sub-1', label: 'Fundamentos de Control de Calidad', sublabel: '211' },
      {
        type: 'chair',
        id: 'chair-1',
        label: 'Cátedra Pérez',
        sublabel: 'Fundamentos de Control de Calidad',
      },
      {
        type: 'career',
        id: 'career-1',
        label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
        sublabel: UNSTA.name,
      },
      { type: 'institution', id: UNSTA.id, label: UNSTA.name, sublabel: '' },
    ]);
    renderSearch();

    await search(user, 'desarrollo');

    expect(screen.getByText('Materia')).toBeInTheDocument();
    expect(screen.getByText('Cátedra')).toBeInTheDocument();
    expect(screen.getByText('Carrera')).toBeInTheDocument();
    expect(screen.getByText('Institución')).toBeInTheDocument();
  });

  it('un resultado de carrera lleva a la ficha de esa carrera', async () => {
    const user = userEvent.setup();
    stubSearch([
      {
        type: 'career',
        id: 'career-tudcs',
        label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
        sublabel: UNSTA.name,
      },
    ]);
    renderSearch();

    await search(user, 'desarrollo y calidad');
    await user.click(screen.getByRole('option', { name: /desarrollo y calidad de software/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/careers/career-tudcs');
    });
  });

  it('un resultado de institución resuelve su slug contra el directorio y lleva a su chasis', async () => {
    const user = userEvent.setup();
    stubSearch([{ type: 'institution', id: UNSTA.id, label: UNSTA.name, sublabel: '' }], [UNSTA]);
    renderSearch();

    await search(user, 'unsta');

    // El directorio de universidades pega recién porque este resultado es `institution`; hay que
    // dejarlo resolver antes de clickear, o el fallback sin slug ganaría la carrera.
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([u]) => String(u).includes('/api/academic/universities')),
      ).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /universidad del norte/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('option', { name: /universidad del norte/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/universities/unsta/careers');
    });
  });

  it('la misma carrera en dos instituciones aparece como dos resultados separados, cada uno con su institución', async () => {
    const user = userEvent.setup();
    stubSearch([
      {
        type: 'career',
        id: 'career-unsta',
        label: 'Ingeniería en Informática',
        sublabel: UNSTA.name,
      },
      { type: 'career', id: 'career-unt', label: 'Ingeniería en Informática', sublabel: UNT.name },
    ]);
    renderSearch();

    await search(user, 'ingeniería en informática');

    expect(
      screen.getByRole('option', { name: /ingeniería en informática.*tomás/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /ingeniería en informática.*tucumán/i }),
    ).toBeInTheDocument();
  });

  it('el placeholder dice que ahora también se puede buscar por carrera', () => {
    stubSearch([]);
    renderSearch();

    expect(
      screen.getByRole('combobox', { name: /buscar materia, carrera o docente/i }),
    ).toBeInTheDocument();
  });
});
