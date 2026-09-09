import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import { TransparencyChecklist } from './transparency-checklist';

function fact(overrides: Partial<OfficialFact> & Pick<OfficialFact, 'id' | 'field'>): OfficialFact {
  return {
    status: 'Published',
    value: 'Publicado',
    unit: null,
    period: null,
    sourceName: 'Sitio institucional',
    sourceUrl: 'https://example.edu.ar',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
    ...overrides,
  };
}

/**
 * SC-005, ADR-0090, F01: el checklist de transparencia institucional. Grounded en el caso del
 * "listo cuando" de la tarea (R6, #486): UNT muestra su nómina, su presupuesto y sus actas con
 * link a la fuente.
 */
describe('TransparencyChecklist', () => {
  const UNT_FACTS: OfficialFact[] = [
    fact({
      id: 'f-minutes',
      field: 'minutes_published',
      value: 'Boletín Oficial semanal con las resoluciones',
      period: '2025 en adelante',
      sourceName: 'Boletín Oficial UNT',
      sourceUrl: 'https://boletinoficial.unt.edu.ar',
      relievedAt: '2026-09-07T12:00:00Z',
    }),
    fact({
      id: 'f-budget',
      field: 'budget_published',
      value: 'Presupuesto y ejecución por resoluciones',
      period: '2023 a 2026',
      sourceName: 'Portal de transparencia UNT',
      sourceUrl: 'https://transparencia.unt.edu.ar',
      relievedAt: '2026-09-06T12:00:00Z',
    }),
    fact({
      id: 'f-staff',
      field: 'staff_roster_published',
      value: 'Publicada en XLSX, con unidad académica, cargo y dedicación',
      period: 'marzo 2026',
      sourceName: 'Portal de transparencia UNT',
      sourceUrl: 'https://transparencia.unt.edu.ar',
      relievedAt: '2026-09-05T12:00:00Z',
    }),
  ];

  it('muestra cada campo del checklist con su nombre en español', () => {
    render(<TransparencyChecklist facts={UNT_FACTS} />);

    expect(screen.getByText('Actas del órgano de gobierno publicadas')).toBeInTheDocument();
    expect(screen.getByText('Presupuesto ejecutado publicado')).toBeInTheDocument();
    expect(screen.getByText('Nómina docente con condición de cargo')).toBeInTheDocument();
  });

  it('la auditoría de la AGN aparece con su etiqueta en español', () => {
    render(
      <TransparencyChecklist
        facts={[
          fact({
            id: 'f-agn',
            field: 'agn_audit',
            value: 'Resolución AGN 126/2013',
            period: '2013',
            sourceName: 'AGN, Auditoría General de la Nación',
            relievedAt: '2026-09-08T12:00:00Z',
          }),
        ]}
      />,
    );

    expect(screen.getByText('Auditada por la AGN')).toBeInTheDocument();
    expect(screen.getByText('Resolución AGN 126/2013')).toBeInTheDocument();
  });

  it('una fila publicada muestra su valor y su fuente', () => {
    render(<TransparencyChecklist facts={UNT_FACTS} />);

    expect(
      screen.getByText('Publicada en XLSX, con unidad académica, cargo y dedicación'),
    ).toBeInTheDocument();
    expect(screen.getByText('Portal de transparencia UNT · marzo 2026')).toBeInTheDocument();
  });

  /**
   * El criterio explícito: una fila "no publicado" se distingue a simple vista de una con dato.
   * Acá se prueba con la privada que no publica nómina ni presupuesto (E05): no es un hueco, es
   * lo que la ficha tiene que decir.
   */
  it('una privada sin nómina ni presupuesto publicado lo dice con fecha, no con un hueco', () => {
    render(
      <TransparencyChecklist
        facts={[
          fact({
            id: 'f-budget-private',
            field: 'budget_published',
            status: 'NotPublished',
            value: null,
            note: 'La institución no publica su presupuesto ejecutado.',
            sourceName: 'Sitio institucional',
            relievedAt: '2026-09-07T12:00:00Z',
          }),
        ]}
      />,
    );

    expect(screen.getByText('Presupuesto ejecutado publicado')).toBeInTheDocument();
    expect(
      screen.getByText(/No publicado: La institución no publica su presupuesto ejecutado/),
    ).toBeInTheDocument();
  });

  it('sin ningún campo relevado, dice que la transparencia todavía no se relevó', () => {
    render(<TransparencyChecklist facts={[]} />);

    expect(
      screen.getByText(/todavía no relevamos la transparencia de esta institución/i),
    ).toBeInTheDocument();
  });

  /** "Ver fuentes" lista las URL relevadas, una por fuente distinta (SC-005). */
  it('"Ver fuentes" lista cada URL relevada sin repetir', async () => {
    const user = userEvent.setup();
    render(<TransparencyChecklist facts={UNT_FACTS} />);

    // El listado vive adentro de un <details>: se abre como lo haría quien lee, en vez de asumir
    // que el contenido colapsado ya es accesible.
    await user.click(screen.getByText('Ver fuentes'));

    const boletin = screen.getByRole('link', { name: 'Boletín Oficial UNT' });
    expect(boletin).toHaveAttribute('href', 'https://boletinoficial.unt.edu.ar');

    // Presupuesto y nómina citan la misma fuente: aparece una sola vez en "Ver fuentes".
    expect(screen.getAllByRole('link', { name: 'Portal de transparencia UNT' })).toHaveLength(1);
  });

  it('"Relevado el" usa la fecha más reciente entre las filas', () => {
    render(<TransparencyChecklist facts={UNT_FACTS} />);

    expect(screen.getByText(/Relevado el 07\/09\/2026/)).toBeInTheDocument();
  });
});
