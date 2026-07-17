import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { INDEPENDENT_PROJECT_DISCLAIMER } from '@/lib/copy';
import { AuthShell } from './auth-shell';

/**
 * Tests del AuthShell v2 (US-059-f). Verifica el contrato del shell: eyebrow
 * numerado, título como heading, panel contextual, form (children) y footer.
 * El caso importante es la generalización: el disclaimer del panel es genérico
 * y no nombra ninguna universidad.
 */
describe('AuthShell', () => {
  const renderShell = () =>
    render(
      <AuthShell
        stepCode="02"
        stepName="INGRESO"
        leftPanel={<div>PANEL-CONTEXTUAL</div>}
        title="Buenas de nuevo"
        sub="Volvé a tu plan-b."
        foot={<a href="/sign-up">Creá tu cuenta</a>}
      >
        <div>FORM-CHILDREN</div>
      </AuthShell>,
    );

  it('muestra el eyebrow numerado con código y nombre del paso', () => {
    renderShell();
    expect(screen.getByText(/02/)).toBeInTheDocument();
    expect(screen.getByText(/ingreso/i)).toBeInTheDocument();
  });

  it('renderiza el título como heading y el subtítulo', () => {
    renderShell();
    expect(screen.getByRole('heading', { name: /buenas de nuevo/i })).toBeInTheDocument();
    expect(screen.getByText(/volvé a tu plan-b/i)).toBeInTheDocument();
  });

  it('renderiza el panel contextual, el form y el footer', () => {
    renderShell();
    expect(screen.getByText('PANEL-CONTEXTUAL')).toBeInTheDocument();
    expect(screen.getByText('FORM-CHILDREN')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /creá tu cuenta/i })).toHaveAttribute(
      'href',
      '/sign-up',
    );
  });

  it('muestra el disclaimer genérico, sin nombrar ninguna universidad', () => {
    renderShell();
    expect(screen.getByText(INDEPENDENT_PROJECT_DISCLAIMER)).toBeInTheDocument();
    expect(screen.queryByText(/unsta/i)).toBeNull();
  });
});
