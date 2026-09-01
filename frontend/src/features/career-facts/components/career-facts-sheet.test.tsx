import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CareerFacts } from '../types';
import { CareerFactsSheet } from './career-facts-sheet';

// La ficha monta el topbar del catálogo, que a su vez monta el buscador global (router +
// QueryClient). Mismo patrón que landing-hero.test.tsx: se le dan los dos en vez de mockear el
// topbar entero, porque lo que se prueba acá es el contenido de la ficha.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const BASE: CareerFacts = {
  careerId: 'career-1',
  careerName: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
  universityName: 'Universidad del Norte Santo Tomás de Aquino',
  durationYears: null,
  totalSubjects: 21,
  coveredSubjects: 0,
  coveragePercent: 0,
  editorialNotes: [],
};

function renderSheet(facts: CareerFacts) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CareerFactsSheet facts={facts} />
    </QueryClientProvider>,
  );
}

describe('CareerFactsSheet', () => {
  it('muestra el nombre de la carrera y su institución', () => {
    renderSheet(BASE);

    expect(screen.getByRole('heading', { level: 1, name: BASE.careerName })).toBeInTheDocument();
    expect(screen.getByText(BASE.universityName)).toBeInTheDocument();
  });

  it('dice que faltan los datos oficiales cuando no hay duración cargada', () => {
    renderSheet(BASE);

    expect(screen.getByText(/todavía no tenemos datos oficiales/i)).toBeInTheDocument();
  });

  it('muestra la duración en el papel cuando existe, y avisa lo que todavía falta', () => {
    renderSheet({ ...BASE, durationYears: 3 });

    expect(screen.getByText(/3 años/)).toBeInTheDocument();
    expect(screen.getByText(/cuánto dura en la realidad/i)).toBeInTheDocument();
  });

  it('la cobertura vacía dice que ninguna materia junta el piso todavía', () => {
    renderSheet(BASE);

    expect(screen.getByText(/0 de 21 materias/)).toBeInTheDocument();
    expect(screen.getByText(/ninguna materia junta todavía/i)).toBeInTheDocument();
  });

  it('la cobertura parcial dice cuántas materias restantes no llegan al piso', () => {
    renderSheet({ ...BASE, coveredSubjects: 1, coveragePercent: 5 });

    expect(screen.getByText(/1 de 21 materias/)).toBeInTheDocument();
    expect(screen.getByText('5 %')).toBeInTheDocument();
    expect(
      screen.getByText(/las 20 restantes todavía no juntan las 10 reseñas del piso/i),
    ).toBeInTheDocument();
  });

  it('la cobertura completa no dice que falten materias', () => {
    renderSheet({ ...BASE, coveredSubjects: 21, coveragePercent: 100 });

    expect(
      screen.getByText(/todas sus materias ya juntan las 10 reseñas del piso/i),
    ).toBeInTheDocument();
  });

  it('enlaza a las materias del plan y a reseñar', () => {
    renderSheet(BASE);

    expect(screen.getByRole('link', { name: /ver las 21 materias/i })).toHaveAttribute(
      'href',
      `/careers/${BASE.careerId}/plans`,
    );
    expect(screen.getByRole('link', { name: /reseñá tu cursada/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
  });

  it('no publica ningún puntaje ni escala', () => {
    const { container } = renderSheet(BASE);

    expect(container.textContent).not.toMatch(/★|puntaje|promedio de|\/ 5/i);
  });

  it('publica la nota del equipo con su procedencia y su fecha', () => {
    renderSheet({
      ...BASE,
      editorialNotes: [
        {
          id: 'n1',
          text: 'Varias cursadas mencionan que no se sabe con qué se rinde el final.',
          publishedAt: '2026-08-19T12:00:00Z',
        },
      ],
    });

    expect(screen.getByText(/no se sabe con qué se rinde el final/i)).toBeInTheDocument();

    // La procedencia es lo que la hace legible: una síntesis sin decir de dónde sale es opinión.
    expect(screen.getByText(/leída de comentarios que no se publican/i)).toBeInTheDocument();
    expect(screen.getByText(/19\/08\/2026/)).toBeInTheDocument();
  });

  it('sin notas no dibuja el bloque, en vez de decir que no hay ninguna', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/de la curaduría/i)).not.toBeInTheDocument();
  });
});
