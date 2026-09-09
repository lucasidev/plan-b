import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfficialFactRow } from './official-fact-row';
import type { OfficialFact } from './types';

/**
 * El render de una afirmación oficial, en sus cinco estados (ADR-0090). Lo que estos tests
 * protegen: que nunca haya un espacio en blanco, que un valor nunca se muestre sin su fuente, y
 * que un dato "no publicado" no pueda confundirse a simple vista con uno publicado.
 */
describe('OfficialFactRow', () => {
  const base: OfficialFact = {
    id: 'fact-1',
    field: 'paper_duration',
    status: 'Published',
    value: '2.5',
    unit: 'years',
    period: 'plan vigente',
    sourceName: 'Sitio UNSTA',
    sourceUrl: 'https://unsta.edu.ar/tudcs',
    note: null,
    // Mediodía UTC, no medianoche: a medianoche, cualquier huso horario negativo (Argentina
    // incluido) corre la fecha local un día para atrás y el assert de "07/09/2026" se vuelve
    // dependiente de en qué huso corre la suite (mismo criterio que career-facts-sheet.test.tsx).
    relievedAt: '2026-09-07T12:00:00Z',
  };

  it('publicado: muestra la etiqueta en español, el valor con su unidad, y la fuente con el período', () => {
    render(<OfficialFactRow fact={base} />);

    expect(screen.getByText('Dura en el papel')).toBeInTheDocument();
    expect(screen.getByText('2,5 años')).toBeInTheDocument();
    expect(screen.getByText('Sitio UNSTA · plan vigente')).toBeInTheDocument();
  });

  it('publicado sin período: la fuente se muestra igual, sin un separador colgado', () => {
    render(<OfficialFactRow fact={{ ...base, period: null }} />);

    expect(screen.getByText('Sitio UNSTA')).toBeInTheDocument();
    expect(screen.queryByText(/Sitio UNSTA ·/)).not.toBeInTheDocument();
  });

  it('formatea porcentaje y moneda según la unidad, y deja texto libre sin tocar', () => {
    const { rerender } = render(
      <OfficialFactRow
        fact={{ ...base, field: 'cohort_graduation', value: '21.4', unit: 'percent' }}
      />,
    );
    expect(screen.getByText('21,4 %')).toBeInTheDocument();

    rerender(
      <OfficialFactRow
        fact={{
          ...base,
          field: 'current_plan',
          value: 'Plan de la RM 2495/2018, 21 materias',
          unit: null,
        }}
      />,
    );
    expect(screen.getByText('Plan de la RM 2495/2018, 21 materias')).toBeInTheDocument();
  });

  /** Un derivado nunca toma la forma de un dato publicado: lleva su etiqueta y el link a Método. */
  it('derivado: se etiqueta como tal y linkea a Método, no a la fuente original', () => {
    render(
      <OfficialFactRow
        fact={{
          ...base,
          field: 'cohort_graduation',
          status: 'Derived',
          value: '21.4',
          unit: 'percent',
        }}
      />,
    );

    expect(screen.getByText('21,4 %')).toBeInTheDocument();
    expect(screen.getByText('Derivado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver la regla en método/i })).toHaveAttribute(
      'href',
      '/method',
    );
  });

  /** No publicado: qué se buscó y cuándo, nunca un espacio vacío ni un cero inventado. */
  it('no publicado: dice la nota y la fecha de relevamiento, sin mostrar ningún valor', () => {
    render(
      <OfficialFactRow
        fact={{
          ...base,
          field: 'real_duration',
          status: 'NotPublished',
          value: null,
          unit: null,
          period: null,
          note: 'Ninguna fuente pública publica la duración real por carrera.',
        }}
      />,
    );

    expect(
      screen.getByText(/No publicado: Ninguna fuente pública publica la duración real/),
    ).toBeInTheDocument();
    expect(screen.getByText(/relevado el 07\/09\/2026/)).toBeInTheDocument();
    expect(screen.queryByText('2,5 años')).not.toBeInTheDocument();
  });

  it('no publicado sin nota: igual dice dónde se buscó, nunca deja la fila muda', () => {
    render(
      <OfficialFactRow
        fact={{ ...base, status: 'NotPublished', value: null, unit: null, note: null }}
      />,
    );

    expect(screen.getByText(/No publicado en Sitio UNSTA/)).toBeInTheDocument();
  });

  /** Pedido: a quién y cuándo, sin fingir que ya está publicado. */
  it('pedido: dice a quién se le pidió y cuándo', () => {
    render(
      <OfficialFactRow
        fact={{
          ...base,
          field: 'cohort_graduation',
          status: 'Requested',
          value: null,
          unit: null,
          sourceName: 'Universidad Nacional de Tucumán',
          note: 'Pedido de acceso a la información por Ley 27.275.',
        }}
      />,
    );

    expect(
      screen.getByText(/Pedido a Universidad Nacional de Tucumán el 07\/09\/2026\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ley 27.275/)).toBeInTheDocument();
  });

  /** No aplica: la razón, sin fecha (es una razón estructural, no algo que pueda "llegar" después). */
  it('no aplica: dice la razón', () => {
    render(
      <OfficialFactRow
        fact={{
          ...base,
          field: 'accreditation',
          status: 'NotApplicable',
          value: null,
          unit: null,
          note: 'Las tecnicaturas no se acreditan: validez nacional por RM 2495/2018.',
        }}
      />,
    );

    expect(
      screen.getByText(/No aplica: Las tecnicaturas no se acreditan: validez nacional/),
    ).toBeInTheDocument();
  });

  /** Un campo sin nombre en el glosario todavía no rompe la ficha: se ve su código crudo. */
  it('un campo sin etiqueta conocida cae al código, en vez de romper', () => {
    render(<OfficialFactRow fact={{ ...base, field: 'unmapped_field' }} />);

    expect(screen.getByText('unmapped_field')).toBeInTheDocument();
  });

  it('sin "last", separa la fila con un borde; con "last", no', () => {
    const { container: withBorder } = render(<OfficialFactRow fact={base} />);
    expect(withBorder.firstElementChild).toHaveClass('border-b');

    const { container: withoutBorder } = render(<OfficialFactRow fact={base} last />);
    expect(withoutBorder.firstElementChild).not.toHaveClass('border-b');
  });

  /**
   * La distinción "a simple vista" entre un dato con valor y uno sin publicar: el valor publicado
   * usa la tipografía serif grande; ninguno de los tres estados sin dato la usa.
   */
  it('un estado sin dato nunca usa la tipografía de valor publicado', () => {
    for (const status of ['NotPublished', 'Requested', 'NotApplicable'] as const) {
      const { container, unmount } = render(
        <OfficialFactRow fact={{ ...base, status, value: null, unit: null }} />,
      );
      expect(container.querySelector('.font-serif')).not.toBeInTheDocument();
      unmount();
    }
  });
});
