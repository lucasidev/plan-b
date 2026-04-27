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
const serverSchema = z.object({
  SESSION_SECRET: z.string().min(32),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() must only be called from server-side code.');
  }
  if (cached) return cached;
  cached = serverSchema.parse({ SESSION_SECRET: process.env.SESSION_SECRET });
  return cached;
}
