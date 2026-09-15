import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  /** Sin nada que mostrar, el topbar no reserva un espacio vacío. */
  it('sin items, no renderiza nada', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  /** Con una sola miga (`.pb-where` de la maqueta), va en negrita y nunca como link. */
  it('con una sola miga, la muestra en negrita sin link', () => {
    render(<Breadcrumbs items={[{ label: 'Explorar', href: '/universities' }]} />);

    expect(screen.getByText('Explorar').tagName).toBe('B');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  /**
   * Con más de una (`.pb-crumbs`), todas menos la última son link; la última va en negrita, nunca
   * clickeable, aunque traiga `href` (es la ficha activa).
   */
  it('con varias, todas menos la última son link y la última es la activa en negrita', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Explorar', href: '/universities' },
          { label: 'UNSTA', href: '/universities/unsta/careers' },
          { label: 'Cátedra Pérez' },
        ]}
      />,
    );

    const explorar = screen.getByRole('link', { name: 'Explorar' });
    expect(explorar).toHaveAttribute('href', '/universities');
    const unsta = screen.getByRole('link', { name: 'UNSTA' });
    expect(unsta).toHaveAttribute('href', '/universities/unsta/careers');

    expect(screen.getByText('Cátedra Pérez').tagName).toBe('B');
    expect(screen.queryByRole('link', { name: 'Cátedra Pérez' })).not.toBeInTheDocument();
  });

  /**
   * La facultad (US-127) linkea a la ficha de institución pero no es la última miga: sigue siendo
   * un link aunque no cierre la cadena.
   */
  it('un segmento intermedio sin ser el último igual es link si trae href', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Explorar', href: '/universities' },
          { label: 'UNSTA', href: '/universities/unsta/careers' },
          { label: 'Facultad de Ingeniería', href: '/universities/unsta/careers' },
          { label: 'Tecnicatura en Desarrollo y Calidad de Software' },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Facultad de Ingeniería' })).toHaveAttribute(
      'href',
      '/universities/unsta/careers',
    );
  });

  /** Un segmento intermedio sin href (genérico, sin destino conocido) se lee como texto plano. */
  it('un segmento intermedio sin href se lee como texto, no como link roto', () => {
    render(<Breadcrumbs items={[{ label: 'Otros' }, { label: 'Ajustes' }]} />);

    expect(screen.getByText('Otros').tagName).toBe('SPAN');
    expect(screen.queryByRole('link', { name: 'Otros' })).not.toBeInTheDocument();
  });

  /** Separa cada miga con "/", oculto a lectores de pantalla: la jerarquía ya la dice `aria-label`. */
  it('separa las migas con una barra decorativa', () => {
    const { container } = render(
      <Breadcrumbs items={[{ label: 'Explorar', href: '/universities' }, { label: 'UNSTA' }]} />,
    );

    const separator = container.querySelector('[aria-hidden="true"]');
    expect(separator).toHaveTextContent('/');
  });

  /**
   * `truncate` (la carrera, sin nombre corto en el backend): se recorta con ellipsis en vez de
   * hacer wrap, y el nombre completo va al `title` para no perderlo. Las otras migas no lo llevan.
   */
  it('un segmento con truncate lleva la clase de recorte y el nombre completo en el title', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Explorar', href: '/universities' },
          { label: 'UNSTA', href: '/universities/unsta/careers' },
          {
            label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
            href: '/careers/career-1',
            truncate: true,
          },
          { label: '101 · Álgebra I' },
        ]}
      />,
    );

    const career = screen.getByRole('link', {
      name: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
    });
    expect(career).toHaveClass('pb-crumb-truncate');
    expect(career).toHaveAttribute(
      'title',
      'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
    );

    const university = screen.getByRole('link', { name: 'UNSTA' });
    expect(university).not.toHaveClass('pb-crumb-truncate');
    expect(university).not.toHaveAttribute('title');
  });

  /** La última miga (activa, en negrita) también puede llevar truncate: es el caso de /careers/[id]. */
  it('la miga activa (última, en negrita) también puede llevar truncate', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Explorar', href: '/universities' },
          {
            label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
            truncate: true,
          },
        ]}
      />,
    );

    const career = screen.getByText(
      'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
    );
    expect(career.tagName).toBe('B');
    expect(career).toHaveClass('pb-crumb-truncate');
  });
});
