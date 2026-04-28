import type { NextConfig } from 'next';

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
};

export default nextConfig;
