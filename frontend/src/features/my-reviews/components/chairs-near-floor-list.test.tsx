import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChairNearFloor } from '../api.server';
import { ChairsNearFloorList } from './chairs-near-floor-list';

function chair(over: Partial<ChairNearFloor> = {}): ChairNearFloor {
  return {
    chairId: 'chair-bravo',
    chairName: 'Bravo',
    subjectId: 'subject-1',
    subjectName: 'Base de Datos',
    reviewCount: 9,
    ...over,
  };
}

describe('ChairsNearFloorList', () => {
  /**
   * US-231 E3: la cátedra a una del piso, que la cuenta no reseñó, dice cuánto junta y que con la
   * tuya se publica, con Reseñar al lado.
   */
  it('US-231 E3: dice "junta N reseñas: con la tuya se publica" y ofrece Reseñar', () => {
    render(<ChairsNearFloorList chairs={[chair()]} reviewedChairIds={new Set()} />);

    expect(screen.getByText('Base de Datos')).toBeInTheDocument();
    expect(screen.getByText(/junta 9 reseñas: con la tuya se publica/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^reseñar$/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
  });

  it('nunca lista una cátedra que esta cuenta ya reseñó', () => {
    render(
      <ChairsNearFloorList
        chairs={[chair({ chairId: 'ya-reseñada' })]}
        reviewedChairIds={new Set(['ya-reseñada'])}
      />,
    );

    expect(screen.queryByText('Base de Datos')).not.toBeInTheDocument();
  });

  it('sin ninguna cátedra pendiente, no dibuja nada (ni el encabezado)', () => {
    const { container } = render(<ChairsNearFloorList chairs={[]} reviewedChairIds={new Set()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('con una sola reseña de diferencia, usa el singular', () => {
    render(
      <ChairsNearFloorList chairs={[chair({ reviewCount: 1 })]} reviewedChairIds={new Set()} />,
    );
    expect(screen.getByText(/junta 1 reseña: con la tuya se publica/i)).toBeInTheDocument();
  });

  it('mezcla reseñadas y pendientes: solo se listan las pendientes', () => {
    render(
      <ChairsNearFloorList
        chairs={[
          chair({ chairId: 'pendiente', subjectName: 'Pendiente' }),
          chair({ chairId: 'reseñada', subjectName: 'Reseñada' }),
        ]}
        reviewedChairIds={new Set(['reseñada'])}
      />,
    );

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Reseñada')).not.toBeInTheDocument();
  });
});
