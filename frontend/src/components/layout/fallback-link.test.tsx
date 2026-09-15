import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, MouseEvent } from 'react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FallbackLink } from './fallback-link';

/**
 * Component tests de `FallbackLink` (issue #525, con #510 adentro): el fallback que fuerza una
 * navegación completa cuando el click de un link del shell no se traduce nunca en un cambio de
 * URL. Los tres E2E existentes (settings, help, write-review) son la verificación de que esto
 * resuelve el flake real; acá se prueba el mecanismo aislado, incluido el caso que lo motivó
 * (el menú del avatar desmonta el link en el mismo click que navega).
 *
 * `fireEvent.click` en vez de `user-event`: con `vi.useFakeTimers()` activo, `userEvent.click()`
 * (v14.6.1) nunca resuelve acá, con o sin la opción `advanceTimers` (confirmado clickeando con
 * `fireEvent` al lado, que sí responde). El plazo que este componente arma es lo que el test
 * ejercita, así que fake timers no es negociable; el click sí puede ser el evento sintético
 * directo, que ya trae `button`/`ctrlKey` explícitos sin depender de ninguna coreografía async.
 */

const { linkStatusMock } = vi.hoisted(() => ({
  linkStatusMock: vi.fn(() => ({ pending: false })),
}));

// `next/link` real necesita un `RouterContext` que jsdom no arma solo: sin él, ni siquiera
// previene el default del click, y jsdom intenta una navegación real que no soporta. El mock
// se queda con lo único que este test ejercita: reenviar `onClick` con el mismo orden que el
// Link real (primero el onClick del consumidor, recién después preventDefault si no lo llamó ya
// él mismo), no dejar que jsdom navegue, y publicar `useLinkStatus` para que `LinkStatusProbe`
// tenga de dónde leer.
vi.mock('next/link', () => ({
  default: ({ href, children, onClick, ...rest }: ComponentProps<'a'>) => (
    <a
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          event.preventDefault();
        }
      }}
      {...rest}
    >
      {children}
    </a>
  ),
  useLinkStatus: () => linkStatusMock(),
}));

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock('@/lib/navigate-after-mutation', () => ({
  navigateAfterMutation: navigateMock,
}));

// Más que cualquier plazo real que el componente pueda usar: alcanza para vencer sin acoplar el
// test al número exacto (que se ajusta con la medición, ver el docstring de fallback-link.tsx).
const PAST_ANY_DEADLINE_MS = 10_000;

beforeEach(() => {
  vi.useFakeTimers();
  linkStatusMock.mockReturnValue({ pending: false });
  // El plazo compara contra `window.location.pathname` real (así lo hace en producción, ver
  // fallback-link.tsx): sin esto jsdom arranca en otra URL y el chequeo nunca da lo esperado.
  window.history.pushState({}, '', '/home');
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('FallbackLink', () => {
  it('fuerza la navegación si el pathname no cambió cuando venció el plazo', () => {
    render(<FallbackLink href="/settings">Ajustes</FallbackLink>);

    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));
    expect(navigateMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(PAST_ANY_DEADLINE_MS);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/settings');
  });

  it('no fuerza nada si el pathname ya llegó al destino antes de que venza el plazo', () => {
    render(<FallbackLink href="/settings">Ajustes</FallbackLink>);

    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));

    // El router sí navegó: la URL real ya refleja el destino, antes de que venza el plazo.
    window.history.pushState({}, '', '/settings');

    vi.advanceTimersByTime(PAST_ANY_DEADLINE_MS);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('un click con ctrl/cmd o de botón secundario no programa nada', () => {
    render(<FallbackLink href="/settings">Ajustes</FallbackLink>);
    const link = screen.getByRole('link', { name: 'Ajustes' });

    // Ctrl/Cmd-click: el navegador abre una pestaña nueva, no hay push que defender.
    fireEvent.click(link, { ctrlKey: true });
    // Click de botón secundario (no primario): tampoco es la navegación que Link intercepta.
    fireEvent.click(link, { button: 1 });

    vi.advanceTimersByTime(PAST_ANY_DEADLINE_MS);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('un href externo no programa nada', () => {
    render(<FallbackLink href="https://otro-origen.example/x">Afuera</FallbackLink>);

    fireEvent.click(screen.getByRole('link', { name: 'Afuera' }));
    vi.advanceTimersByTime(PAST_ANY_DEADLINE_MS);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('el fallback dispara igual si el padre desmontó el link en el propio click (menú del avatar)', () => {
    function UnmountsOnClick() {
      const [mounted, setMounted] = useState(true);
      if (!mounted) return null;
      return (
        <FallbackLink href="/settings" onClick={() => setMounted(false)}>
          Ajustes
        </FallbackLink>
      );
    }

    render(<UnmountsOnClick />);
    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));
    expect(screen.queryByRole('link', { name: 'Ajustes' })).not.toBeInTheDocument();

    vi.advanceTimersByTime(PAST_ANY_DEADLINE_MS);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/settings');
  });

  it('sigue llamando al onClick del consumidor', () => {
    const onClick = vi.fn();
    render(
      <FallbackLink href="/settings" onClick={onClick}>
        Ajustes
      </FallbackLink>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));

    expect(onClick).toHaveBeenCalledTimes(1);

    // Drena el plazo que este click armó: sin esto queda pendiente para el próximo test, que lo
    // vería como "ya hay uno para este href" y no armaría el suyo.
    vi.advanceTimersByTime(PAST_ANY_DEADLINE_MS);
  });

  it('con una navegación pendiente al vencer el plazo, espera un segundo plazo antes de forzar', () => {
    linkStatusMock.mockReturnValue({ pending: true });
    render(<FallbackLink href="/settings">Ajustes</FallbackLink>);

    fireEvent.click(screen.getByRole('link', { name: 'Ajustes' }));

    vi.advanceTimersByTime(2_000);
    expect(navigateMock).not.toHaveBeenCalled();

    // Colgada de verdad: sigue pendiente después del segundo plazo, y ahí sí se fuerza.
    vi.advanceTimersByTime(2_000);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/settings');
  });

  it('un segundo click sobre el mismo destino no reinicia el plazo', () => {
    render(<FallbackLink href="/settings">Ajustes</FallbackLink>);
    const link = screen.getByRole('link', { name: 'Ajustes' });

    fireEvent.click(link);
    vi.advanceTimersByTime(1_000);
    fireEvent.click(link);

    // Si el segundo click hubiera reiniciado el plazo, acá todavía faltaría 1s (el propio) más
    // el margen del primero: 2001ms desde el primer click alcanza solo si nunca se reinició.
    vi.advanceTimersByTime(1_001);

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});
