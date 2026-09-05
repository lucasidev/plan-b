import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { FreeText } from '../types';
import { FreeTextList } from './free-text-list';

function entry(over: Partial<FreeText> = {}): FreeText {
  return {
    reviewId: 'review-1',
    subjectName: 'Análisis Matemático II',
    termLabel: '2025-C1',
    chairName: 'Pérez',
    text: 'Nunca supimos con qué se rendía el final.',
    writtenAt: '2025-06-01T00:00:00Z',
    ...over,
  };
}

describe('FreeTextList', () => {
  /**
   * ADR-0084: la cola de curaduría, vacía. La mayoría de las reseñas no trae texto porque el campo
   * es opcional, así que este no es un estado raro.
   */
  it('cola vacía: dice que todavía nadie escribió nada', () => {
    render(<FreeTextList texts={[]} />);

    expect(screen.getByText(/todavía nadie escribió nada/i)).toBeInTheDocument();
  });

  /**
   * ADR-0084: el texto se lee con el contexto de la cursada de la que salió; sin cátedra
   * declarada, lo dice en vez de omitir la fila.
   */
  it('el texto se lee con su contexto, y sin cátedra declarada lo dice', () => {
    render(<FreeTextList texts={[entry({ chairName: null })]} />);

    expect(screen.getByText('Nunca supimos con qué se rendía el final.')).toBeInTheDocument();
    expect(screen.getByText(/sin cátedra declarada/i)).toBeInTheDocument();
    expect(screen.getByText('Análisis Matemático II')).toBeInTheDocument();
    expect(screen.getByText(/2025-C1/)).toBeInTheDocument();
  });

  /**
   * ADR-0084: quien escribió cada texto no llega a la pantalla. Ataque: el objeto trae un campo de
   * autor que el tipo `FreeText` no declara (simula una fuga del backend); el componente solo
   * interpola campos explícitos, así que no debería aparecer en ningún lado del render.
   */
  it('quien escribió el texto no llega a la pantalla, aunque el objeto lo traiga', () => {
    const leaked = { ...entry(), authorEmail: 'lucia@planb.local' } as FreeText;
    render(<FreeTextList texts={[leaked]} />);

    expect(screen.queryByText(/lucia@planb\.local/i)).not.toBeInTheDocument();
  });
});
