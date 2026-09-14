import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';

// Sidebar resalta el item activo con `usePathname()`: sin mockearlo, el hook revienta fuera de
// un router real de Next. Mock controlable (no un valor fijo): varios tests de acá abajo
// necesitan pathnames distintos para probar `isActive`.
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

function renderWithPathname(pathname: string, role: 'member' | 'admin' | null) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(<Sidebar role={role} />);
}

describe('Sidebar', () => {
  it('sin sesión: ofrece Explorar y Método, pero no Mis aportes', () => {
    renderWithPathname('/universities', null);

    // El nombre accesible incluye el shortcut pegado al label (el `<span>` del "⌘1" no tiene
    // separador): match por prefijo en vez del texto completo.
    expect(screen.getByRole('link', { name: /^Explorar/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Método' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Mis aportes/ })).not.toBeInTheDocument();
  });

  it('con sesión de alumno: ofrece Mis aportes', () => {
    renderWithPathname('/universities', 'member');

    expect(screen.getByRole('link', { name: /^Mis aportes/ })).toBeInTheDocument();
  });

  it('/careers/123/plans enciende Explorar: activePrefixes incluye /careers', () => {
    renderWithPathname('/careers/123/plans', null);

    expect(screen.getByRole('link', { name: /^Explorar/ })).toHaveAttribute('data-active', 'true');
  });

  it('/careers-foo no enciende Explorar: el prefijo exige un / después, no cualquier texto', () => {
    renderWithPathname('/careers-foo', null);

    expect(screen.getByRole('link', { name: /^Explorar/ })).toHaveAttribute('data-active', 'false');
  });

  it('/reviews/new no enciende Explorar ni Mis aportes: no es ninguna de sus rutas', () => {
    renderWithPathname('/reviews/new', 'member');

    expect(screen.getByRole('link', { name: /^Explorar/ })).toHaveAttribute('data-active', 'false');
    expect(screen.getByRole('link', { name: /^Mis aportes/ })).toHaveAttribute(
      'data-active',
      'false',
    );
  });

  it('/reviews/mine con sesión de alumno enciende Mis aportes', () => {
    renderWithPathname('/reviews/mine', 'member');

    expect(screen.getByRole('link', { name: /^Mis aportes/ })).toHaveAttribute(
      'data-active',
      'true',
    );
  });
});
