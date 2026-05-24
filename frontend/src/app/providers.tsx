'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import { ThemeProvider } from 'next-themes';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ADR-0021: baseline staleTime > 0 to avoid refetching immediately after RSC hydration
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    // Theme provider de next-themes. `system` sigue al OS, `light`/`dark` fijan.
    // El setting del backend (US-072) define el valor inicial; el cliente puede
    // overridear vía useTheme() y next-themes persiste en localStorage para evitar
    // flash al recargar (suppressHydrationWarning en <html> ya está seteado).
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
