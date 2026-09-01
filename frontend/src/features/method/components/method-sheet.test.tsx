import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MethodSheet } from './method-sheet';

/**
 * Método existe para que un número se pueda rastrear hasta la regla que lo calculó. Los pisos, que
 * son los únicos números de la pantalla, salen del backend y no están escritos acá.
 *
 * De eso se desprenden las dos cosas que se prueban: que la pantalla derive bien el número que
 * muestra a partir del piso que le dan, y que cuando no le dan ninguno **no invente uno**. Un piso
 * inventado es peor que ausente, porque suena a método.
 *
 * Los pisos de acá no son los de producto (esos se pinean en `PublishingRulesTests`, del lado del
 * backend): son valores cualesquiera, elegidos distintos entre sí para que ningún assert pase por
 * coincidencia con el número real.
 */
describe('MethodSheet', () => {
  it('deriva del piso el número de reseñas con el que una cátedra todavía no publica', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(
      screen.getByRole('heading', { name: 'Por qué una cátedra con 6 reseñas no publica' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/desde las 7 reseñas/)).toBeInTheDocument();
  });

  it('publica el piso del par de materias, que es otro y protege otra cosa', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/su propio piso, de 4 por par y período/)).toBeInTheDocument();
  });

  it('sin piso no inventa un número: lo dice y deja el resto legible', () => {
    render(<MethodSheet instrument={null} chairFloor={null} pairFloor={null} />);

    expect(
      screen.getByRole('heading', { name: 'Por qué una cátedra con pocas reseñas no publica' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no pudimos leer el mínimo vigente/i)).toBeInTheDocument();

    // La razón del piso no depende del número, así que sigue publicada.
    expect(screen.getByText(/privacidad de quien reseña/)).toBeInTheDocument();

    // Y el resto de Método, que no tiene números, queda entero.
    expect(screen.getByRole('heading', { name: 'Cómo se arma un conteo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qué sesgos tiene esto' })).toBeInTheDocument();
  });

  it('sin cuestionario publicado lo dice, en vez de mostrar un catálogo vacío', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/todavía no hay un cuestionario publicado/i)).toBeInTheDocument();
  });
});
