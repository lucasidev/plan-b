import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExploreLensSwitch } from './explore-lens-switch';

/**
 * US-222 E1: las dos lentes, Carreras e Instituciones (acá "Universidades", que es como el
 * catálogo ya nombra a la lente existente), y pasar de una a otra no pide escribir nada: son
 * links, no un campo de texto ni un botón que abra un picker.
 */
describe('ExploreLensSwitch', () => {
  it('muestra las dos lentes como links, cada una a su propia ruta', () => {
    render(<ExploreLensSwitch active="universities" />);

    const careers = screen.getByRole('tab', { name: 'Carreras' });
    const universities = screen.getByRole('tab', { name: 'Universidades' });

    expect(careers).toHaveAttribute('href', '/careers');
    expect(universities).toHaveAttribute('href', '/universities');
  });

  it('marca como seleccionada la lente activa, y solo esa', () => {
    render(<ExploreLensSwitch active="careers" />);

    expect(screen.getByRole('tab', { name: 'Carreras' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Universidades' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
