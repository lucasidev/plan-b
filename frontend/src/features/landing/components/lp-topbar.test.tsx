import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpTopbar } from './lp-topbar';

/**
 * Tests del topbar de la landing (US-054-f). El comportamiento que importa es la
 * adaptación por sesión: el mismo topbar muestra CTAs anónimos o un único
 * "Ir a mis aportes" según `isLoggedIn`. Es el único elemento de la landing que
 * cambia con la sesión (la página nunca redirige al usuario logueado).
 */
describe('LpTopbar', () => {
  it('anónimo: muestra los CTAs Ingresar y Crear cuenta, sin "Ir a mis aportes"', () => {
    render(<LpTopbar isLoggedIn={false} />);
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/sign-up');
    expect(screen.queryByRole('link', { name: /ir a mis aportes/i })).toBeNull();
  });

  it('logueado: muestra "Ir a mis aportes" hacia /reviews/mine y oculta los CTAs anónimos', () => {
    render(<LpTopbar isLoggedIn={true} />);
    expect(screen.getByRole('link', { name: /ir a mis aportes/i })).toHaveAttribute(
      'href',
      '/reviews/mine',
    );
    expect(screen.queryByRole('link', { name: 'Ingresar' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).toBeNull();
  });

  it('muestra el nav interno hacia las anclas de la landing', () => {
    render(<LpTopbar isLoggedIn={false} />);
    expect(screen.getByRole('link', { name: 'Una ficha' })).toHaveAttribute('href', '#sample');
    expect(screen.getByRole('link', { name: 'Cómo funciona' })).toHaveAttribute('href', '#how');
    expect(screen.getByRole('link', { name: 'Preguntas' })).toHaveAttribute('href', '#faq');
  });
});
