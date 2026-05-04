import { z } from 'zod';

// ── Build-time / client-exposed env ───────────────────────────────
// NEXT_PUBLIC_* keys are inlined by Next.js at build time. Validation runs at
// module import (= once per build) so misconfiguration breaks `bun run build`
// instead of leaking through to runtime.
const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5000'),
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

// Backwards-compatible alias for callers that already do `import { env }`.
// Only client-side keys are exposed through it. Server-only keys must come
// through serverEnv() below.
export const env = clientEnv;

// ── Runtime / server-only env ─────────────────────────────────────
// Validated lazily on first call so `bun run build` doesn't need real secrets
// in CI. Any server route that touches serverEnv() in prod fails fast on
// missing or short values. Throws if accidentally invoked from client code.
//
// JWT_SECRET must match the backend's JWT__Secret (HS256 symmetric key).
// JWT_ISSUER / JWT_AUDIENCE must match the backend's JWT__Issuer / JWT__Audience.
// Per-environment values: 'planb' in dev, 'planb-test' in CI, etc. This lets a
// JWT signed for one env get rejected in another (defense in depth + cross-env
// confusion guard).
// SESSION_SECRET signs the iron-session cookie if/when we adopt it; for the
// pure-JWT flow that's currently in place it isn't strictly required, but
// keeping it in the schema reserves the slot.
const serverSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default('planb'),
  JWT_AUDIENCE: z.string().default('planb'),
  SESSION_SECRET: z.string().min(32),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() must only be called from server-side code.');
  }
  if (cached) return cached;
  cached = serverSchema.parse({
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_ISSUER: process.env.JWT_ISSUER,
    JWT_AUDIENCE: process.env.JWT_AUDIENCE,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
  return cached;
}
