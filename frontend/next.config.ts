import type { NextConfig } from 'next';

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    // Enables `forbidden()` / `unauthorized()` interrupts plus their
    // dedicated `forbidden.tsx` and `unauthorized.tsx` boundaries.
    // We use them for 403 (member entering staff routes) and 401
    // (session expired mid-action) instead of redirecting silently.
    authInterrupts: true,
  },
  // Rewrites para que el frontend pueda hacer client-side fetches contra el
  // backend usando paths relativos same-origin (sin CORS, sin tener que
  // configurar CORS en el backend). El cliente TanStack Query del onboarding
  // (US-037-f cascadas) consume `/api/academic/...` y Next proxy al backend.
  //
  // Server actions siguen usando `apiFetch` con la URL absoluta vía
  // NEXT_PUBLIC_API_URL — eso evita el doble hop server → next → backend.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
