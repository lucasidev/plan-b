import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOnlineStatus } from '@/lib/use-online-status';
import { OfflineBanner } from './offline-banner';

vi.mock('@/lib/use-online-status', () => ({ useOnlineStatus: vi.fn() }));

function renderBanner() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <OfflineBanner />
    </QueryClientProvider>,
  );
}

describe('OfflineBanner', () => {
  it('no renderiza nada cuando hay conexión', () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ online: true, since: null });
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el aviso y el botón de reintentar cuando está offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ online: false, since: new Date() });
    renderBanner();
    expect(screen.getByText(/sin conexión/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
