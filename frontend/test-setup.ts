/**
 * Vitest global setup file. Loaded by `vitest.config.ts` via `setupFiles`.
 *
 * - `@testing-library/jest-dom/vitest` extends the default `expect` with
 *   DOM-aware matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.).
 * - `cleanup()` after each test removes mounted React trees from the
 *   happy-dom DOM, preventing tests from leaking state across files.
 *
 * Convenciones de testing en docs/testing/conventions.md (ADR-0036).
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
