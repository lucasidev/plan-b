import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { ActiveCrumbs } from './active-crumbs';

// ActiveCrumbs decide entre las migas de la ficha y las genéricas comparando `usePathname()`
// contra el pathname para el que el server armó `items`: sin mockearlo, el hook revienta fuera de
// un router real de Next, y el mock tiene que ser controlable porque cada test pisa un pathname.
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('ActiveCrumbs', () => {
  it('con el mismo pathname para el que se armaron, dibuja las migas de la ficha', () => {
    vi.mocked(usePathname).mockReturnValue('/subjects/abc');

    render(
      <ActiveCrumbs
        pathname="/subjects/abc"
        items={[{ label: 'Explorar', href: '/universities' }, { label: '101 · Álgebra I' }]}
      />,
    );

    expect(screen.getByText('101 · Álgebra I')).toBeInTheDocument();
  });

  /**
   * El caso que motiva el componente: una navegación suave a una ruta que el slot no resuelve no
   * deja colgadas las migas de la ficha anterior.
   */
  it('con un pathname distinto (navegación suave a otra ruta), dibuja las genéricas', () => {
    vi.mocked(usePathname).mockReturnValue('/method');

    render(
      <ActiveCrumbs
        pathname="/subjects/abc"
        items={[{ label: 'Explorar', href: '/universities' }, { label: '101 · Álgebra I' }]}
      />,
    );

    expect(screen.queryByText('101 · Álgebra I')).not.toBeInTheDocument();
    expect(screen.getByText('Método')).toBeInTheDocument();
  });
});
