import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SubjectFacts } from '../types';
import { SubjectFactsSheet } from './subject-facts-sheet';

// La ficha monta CatalogTopbar, que monta el buscador global: necesita router y QueryClient. Mismo
// criterio que chair-facts-sheet.test.tsx.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function facts(over: Partial<SubjectFacts> = {}): SubjectFacts {
  return {
    subjectId: 'subject-1',
    subjectCode: '211',
    subjectName: 'Análisis Matemático II',
    yearInPlan: 2,
    isPublished: true,
    totalVoices: 111,
    publishingChairs: 3,
    chairsBelowFloor: 0,
    span: { fromYear: 2023, toYear: 2026 },
    attempts: null,
    completion: null,
    enablesCount: 4,
    spread: [],
    shared: [],
    takenWith: [],
    chairs: [],
    ...over,
  };
}

function renderSheet(f: SubjectFacts) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SubjectFactsSheet facts={f} />
    </QueryClientProvider>,
  );
}

describe('SubjectFactsSheet', () => {
  /**
   * SC-007, estado "vacía" (US-136 aplicado a la ficha de materia): sin ninguna cátedra cargada,
   * la ficha dice que no hay nada publicado y por qué (no hay cátedras, no que la materia esté
   * rota).
   */
  it('estado "vacía": sin cátedras cargadas, dice que no hay nada publicado', () => {
    renderSheet(facts({ isPublished: false, totalVoices: 0, publishingChairs: 0, chairs: [] }));

    expect(screen.getByText('Todavía no hay nada publicado de esta materia.')).toBeInTheDocument();
    expect(screen.getByText('No tiene cátedras cargadas todavía.')).toBeInTheDocument();
  });

  /**
   * US-138 E3: la materia sigue vacía si tiene cátedras cargadas pero ninguna pasó el piso; el
   * dato existe (las reseñas están guardadas) pero no se publica todavía.
   */
  it('US-138 E3: vacía igual con cátedras bajo el piso, hasta que alguna publique', () => {
    renderSheet(
      facts({
        isPublished: false,
        totalVoices: 0,
        publishingChairs: 0,
        chairsBelowFloor: 1,
        chairs: [
          {
            chairId: 'chair-paz',
            chairName: 'Paz',
            reviewCount: 3,
            isPublished: false,
            reviewsMissingToPublish: 7,
            lastReviewedAt: null,
          },
        ],
      }),
    );

    expect(screen.getByText('Todavía no hay nada publicado de esta materia.')).toBeInTheDocument();
    expect(
      screen.getByText(/una cátedra publica sus conteos recién a las 10 reseñas/i),
    ).toBeInTheDocument();
  });

  /**
   * SC-007, estado "una sola cátedra": sin otra cátedra con qué contrastar, la sección "¿es la
   * materia o es una cátedra?" no tiene sentido y no aparece.
   */
  it('estado "una sola cátedra": sin otra con qué contrastar, no hay sección de dispersión', () => {
    renderSheet(facts({ spread: [], shared: [] }));

    expect(screen.queryByText('¿Es la materia o es una cátedra?')).not.toBeInTheDocument();
  });

  /**
   * US-131 (cada dato deriva de voces contables) y US-138 E1: la cuarta cátedra bajo el piso se
   * lista aparte, con su propia cuenta y cuánto le falta, y no suma a los números de la materia.
   */
  it('US-138 E1: la cátedra bajo el piso se lista aparte y no suma a los números de la materia', () => {
    renderSheet(
      facts({
        totalVoices: 111,
        publishingChairs: 3,
        chairsBelowFloor: 1,
        chairs: [
          {
            chairId: 'c1',
            chairName: 'Pérez',
            reviewCount: 50,
            isPublished: true,
            reviewsMissingToPublish: 0,
            lastReviewedAt: null,
          },
          {
            chairId: 'c4',
            chairName: 'Paz',
            reviewCount: 3,
            isPublished: false,
            reviewsMissingToPublish: 7,
            lastReviewedAt: null,
          },
        ],
      }),
    );

    // US-131: la identidad dice sobre cuántas voces y cátedras se calcula la materia.
    expect(screen.getByText(/111 voces en 3 cátedras/i)).toBeInTheDocument();

    const pazRow = screen.getByRole('link', { name: /paz/i });
    expect(pazRow).toHaveTextContent('3 reseñas · faltan 7');
    expect(pazRow).not.toHaveTextContent('voces');
  });

  /**
   * SC-007: "sus cátedras" dice, de cada una, sus voces y hace cuánto es la última. Sin esto, una
   * cátedra que dejó de sumar voces se lee igual que una que sigue activa.
   */
  it('SC-007: cada cátedra publicada dice hace cuánto es su última voz', () => {
    renderSheet(
      facts({
        chairs: [
          {
            chairId: 'c1',
            chairName: 'Pérez',
            reviewCount: 42,
            isPublished: true,
            reviewsMissingToPublish: 0,
            lastReviewedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      }),
    );

    const perezRow = screen.getByRole('link', { name: /pérez/i });
    expect(perezRow).toHaveTextContent('42 voces · última hace 2 meses');
  });

  /**
   * US-154 (de cada 10 que la cursan, cuántas llegan) y ficha SC-007 (cuánto habilita): los dos
   * números derivan de las cursadas reseñadas y del plan de la carrera, cada uno con su fuente.
   */
  it('US-154: la tasa de finalización y cuánto habilita, cada una con su fuente', () => {
    renderSheet(
      facts({
        completion: { outOfTen: 6, reaching: 62, total: 120 },
        enablesCount: 9,
      }),
    );

    expect(screen.getByText('6 de 10')).toBeInTheDocument();
    expect(screen.getByText(/sobre 120 cursadas reseñadas/i)).toBeInTheDocument();
    expect(screen.getByText('9 materias')).toBeInTheDocument();
    expect(screen.getByText(/según el plan de la carrera/i)).toBeInTheDocument();
  });

  /**
   * Ficha SC-007, bloque "los números que resumen la materia": los intentos se publican como la
   * moda con su cola dicha aparte, nunca como el promedio que el boceto pedía (la última opción es
   * abierta, así que promediarla subestima siempre).
   */
  it('los intentos se publican como moda y cola aparte, nunca como promedio', () => {
    renderSheet(
      facts({
        attempts: {
          code: 'ATTEMPTS',
          text: 'Cuántas veces la cursó antes de aprobarla',
          modeLabel: 'Una vez',
          modePercent: 62,
          total: 100,
          options: [
            { label: 'Una vez', percent: 62, isNegative: false },
            { label: 'Dos veces', percent: 28, isNegative: false },
            { label: 'Tres o más', percent: 10, isNegative: false },
          ],
          openEnded: { label: 'Tres o más', percent: 10, isNegative: false },
        },
      }),
    );

    expect(screen.getByText(/una vez, el 62 %/i)).toBeInTheDocument();
    expect(screen.getByText(/10 de cada 100/i)).toBeInTheDocument();
    expect(screen.getByText(/marcaron «tres o más»/i)).toBeInTheDocument();
    expect(screen.queryByText(/\bpromedio\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2,1/)).not.toBeInTheDocument();
  });

  /**
   * US-143 E1: con qué otra materia se llevó esta, publicada con cuántos la llevaron juntas y
   * cuántos dejaron alguna de las dos.
   */
  it('US-143 E1: co-cursada publicada, con sus voces y cuántos dejaron alguna', () => {
    renderSheet(
      facts({
        takenWith: [
          {
            subjectId: 'subject-2',
            subjectName: 'Álgebra I',
            subjectCode: '111',
            togetherCount: 23,
            droppedCount: 6,
            isPublished: true,
            missingToPublish: 0,
          },
        ],
      }),
    );

    expect(screen.getByText('Con qué se llevó')).toBeInTheDocument();
    expect(screen.getByText(/23 la llevaron junto con esta/i)).toBeInTheDocument();
    expect(screen.getByText(/6 dejaron alguna de las dos/i)).toBeInTheDocument();
  });

  /**
   * US-143 N1: el par bajo su propio piso (10 por par y período) dice cuánto le falta, sin
   * publicar ningún conteo todavía.
   */
  it('US-143 N1: el par bajo su propio piso dice cuánto le falta, sin publicar el conteo', () => {
    renderSheet(
      facts({
        takenWith: [
          {
            subjectId: 'subject-3',
            subjectName: 'Física I',
            subjectCode: '131',
            togetherCount: 7,
            droppedCount: 0,
            isPublished: false,
            missingToPublish: 3,
          },
        ],
      }),
    );

    // El nombre está en el div interno (título + código); el <p> del conteo es hermano de ese div,
    // adentro del contenedor de la fila entera, un nivel más arriba.
    const row = screen.getByRole('link', { name: /física i/i }).closest('div')?.parentElement;
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByText(/7 la llevaron junto con esta: con 3 más se publica/i),
    ).toBeInTheDocument();
    expect(within(row as HTMLElement).queryByText(/dejaron/)).not.toBeInTheDocument();
  });

  /**
   * Ficha SC-007, "lo que no muestra nunca": ninguna cátedra se remarca como "mejor" entre las que
   * se comparan; solo se ordenan por voces.
   */
  it('ninguna cátedra se remarca como "mejor" entre las que se comparan', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <SubjectFactsSheet
          facts={facts({
            chairs: [
              {
                chairId: 'c1',
                chairName: 'Pérez',
                reviewCount: 80,
                isPublished: true,
                reviewsMissingToPublish: 0,
                lastReviewedAt: null,
              },
              {
                chairId: 'c2',
                chairName: 'Ruiz',
                reviewCount: 31,
                isPublished: true,
                reviewsMissingToPublish: 0,
                lastReviewedAt: null,
              },
            ],
          })}
        />
      </QueryClientProvider>,
    );

    expect(container.textContent).not.toMatch(/mejor|recomendad|top|★/i);
  });
});
