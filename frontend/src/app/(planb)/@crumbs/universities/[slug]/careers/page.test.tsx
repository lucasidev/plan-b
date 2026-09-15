import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { fetchUniversitiesServer } from '@/features/browse-catalog/api.server';
import type { University } from '@/features/browse-catalog/types';
import UniversityCrumbs from './page';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('@/features/browse-catalog/api.server', () => ({ fetchUniversitiesServer: vi.fn() }));

const UNSTA: University = {
  id: 'uni-1',
  name: 'Universidad del Norte Santo Tomás de Aquino',
  slug: 'unsta',
};

describe('UniversityCrumbs', () => {
  it('con el slug resuelto, dibuja Explorar / {universidad corta}', async () => {
    vi.mocked(fetchUniversitiesServer).mockResolvedValue([UNSTA]);
    vi.mocked(usePathname).mockReturnValue('/universities/unsta/careers');

    render(await UniversityCrumbs({ params: Promise.resolve({ slug: 'unsta' }) }));

    expect(screen.getByText('UNSTA')).toBeInTheDocument();
  });

  it('slug sin coincidencia: migas genéricas', async () => {
    vi.mocked(fetchUniversitiesServer).mockResolvedValue([UNSTA]);

    render(await UniversityCrumbs({ params: Promise.resolve({ slug: 'otra' }) }));

    expect(screen.getByText('Universidad')).toBeInTheDocument();
  });

  it('un pedido que falla no tira la página: migas genéricas', async () => {
    vi.mocked(fetchUniversitiesServer).mockRejectedValue(
      new Error('Universities fetch failed: 500'),
    );

    render(await UniversityCrumbs({ params: Promise.resolve({ slug: 'unsta' }) }));

    expect(screen.getByText('Universidad')).toBeInTheDocument();
  });
});
