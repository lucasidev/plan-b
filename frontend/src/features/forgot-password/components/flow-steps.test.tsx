import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FlowSteps } from './flow-steps';

/**
 * Tests del panel FlowSteps del forgot-password (US-059-f). El componente es
 * visual estático salvo por la prop `active`, que decide qué paso está "ahora"
 * y cuáles quedan "done". Testeamos justamente esa lógica de estado.
 */
describe('FlowSteps', () => {
  it('renderiza los 3 pasos del flujo de recuperación', () => {
    render(<FlowSteps active={1} />);
    expect(screen.getByText(/pedís el link/i)).toBeInTheDocument();
    expect(screen.getByText(/te llega el mail/i)).toBeInTheDocument();
    expect(screen.getByText(/cambiás la contraseña/i)).toBeInTheDocument();
  });

  it('con active=1 marca el primer paso como "ahora" y usa el copy inicial', () => {
    render(<FlowSteps active={1} />);
    expect(screen.getByText(/^ahora$/i)).toBeInTheDocument();
    expect(screen.getByText(/te mandamos un link al mail/i)).toBeInTheDocument();
  });

  it('con active=2 cambia el copy y marca el paso previo como completado (✓)', () => {
    render(<FlowSteps active={2} />);
    expect(screen.getByText(/vas por el segundo/i)).toBeInTheDocument();
    // El paso 1 (n < active) se renderea con el check en vez del número.
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
