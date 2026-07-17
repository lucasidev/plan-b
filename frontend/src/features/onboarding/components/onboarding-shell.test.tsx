import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingShell } from './onboarding-shell';

/**
 * Tests del OnbShell v2 (US-059-f). El shell reenmarca el contenido de cada paso
 * en el chrome nuevo (pill de progreso + heading + card + footer opcional + botón
 * Salir). Cubrimos que la API (`step`, `heading`, `children`, `footer`) se refleja
 * en lo que se renderea.
 *
 * `OnbExitButton` importa el server action de sign-out; lo mockeamos para que el
 * component test no acople a la lógica server.
 */
vi.mock('@/features/sign-out', () => ({
  signOutAction: vi.fn(),
}));

describe('OnboardingShell', () => {
  it('muestra el pill de progreso con el paso actual y el total (default 4)', () => {
    render(
      <OnboardingShell step={2} heading="Tu carrera">
        <div>contenido</div>
      </OnboardingShell>,
    );
    expect(screen.getByText(/paso 2 de 4/i)).toBeInTheDocument();
  });

  it('renderiza el heading, el subheading y el contenido del paso', () => {
    render(
      <OnboardingShell step={1} heading="Bienvenida" subheading="Configurás tu cuenta">
        <div>CONTENIDO-PASO</div>
      </OnboardingShell>,
    );
    expect(screen.getByRole('heading', { name: /bienvenida/i })).toBeInTheDocument();
    expect(screen.getByText(/configurás tu cuenta/i)).toBeInTheDocument();
    expect(screen.getByText('CONTENIDO-PASO')).toBeInTheDocument();
  });

  it('renderiza el footer opcional (CTAs de navegación) cuando se pasa', () => {
    render(
      <OnboardingShell
        step={2}
        heading="Tu carrera"
        footer={<button type="button">Continuar</button>}
      >
        <div>contenido</div>
      </OnboardingShell>,
    );
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
  });

  it('expone el botón Salir del onboarding', () => {
    render(
      <OnboardingShell step={1} heading="Bienvenida">
        <div>contenido</div>
      </OnboardingShell>,
    );
    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
  });
});
