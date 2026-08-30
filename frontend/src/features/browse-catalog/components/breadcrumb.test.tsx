import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CatalogBreadcrumb } from './breadcrumb';

/**
 * El contrato del breadcrumb es el `href`: quien lo trae es un link, quien no, es la página actual.
 *
 * Estos tests existen porque el componente no respetaba su propio contrato: linkeaba solo si además
 * había otro crumb a la derecha, así que la página de Planes de estudio, que resuelve un solo nivel,
 * quedaba sin forma de volver salvo el botón del browser.
 */
describe('CatalogBreadcrumb', () => {
  it('un crumb con href es un link, aunque sea el único', () => {
    render(<CatalogBreadcrumb items={[{ label: 'Universidades', href: '/universities' }]} />);

    expect(screen.getByRole('link', { name: 'Universidades' })).toHaveAttribute(
      'href',
      '/universities',
    );
  });

  it('un crumb sin href es la página actual y no se puede clickear', () => {
    render(
      <CatalogBreadcrumb
        items={[{ label: 'Universidades', href: '/universities' }, { label: 'UNSTA' }]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Universidades' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'UNSTA' })).not.toBeInTheDocument();
    expect(screen.getByText('UNSTA')).toBeInTheDocument();
  });

  it('linkea todos los niveles intermedios de una cadena larga', () => {
    render(
      <CatalogBreadcrumb
        items={[
          { label: 'Universidades', href: '/universities' },
          { label: 'UNSTA', href: '/universities/unsta/careers' },
          { label: 'TUDCS', href: '/careers/abc/plans' },
          { label: 'Plan 2018' },
        ]}
      />,
    );

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.queryByRole('link', { name: 'Plan 2018' })).not.toBeInTheDocument();
  });

  it('sin items no renderea nada', () => {
    const { container } = render(<CatalogBreadcrumb items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
