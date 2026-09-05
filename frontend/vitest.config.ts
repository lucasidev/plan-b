import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom (no happy-dom): React 19 form actions necesitan soporte completo
    // de form.requestSubmit() + dispatchEvent(SubmitEvent) que happy-dom
    // 15 todavía no implementa de forma estable (los component tests con
    // `<form action={action}>` rompen con SyntaxError en BrowserFrameNavigator).
    // jsdom es ~2x más lento al boot pero estable para nuestro caso.
    environment: 'jsdom',
    globals: true,
    // passWithNoTests was true while the suite was empty (US-T01 pre-aterrizaje).
    // Ahora que hay tests, dejarlo en false para que un futuro setup vacío
    // grite en lugar de pasar trivialmente (e.g. test glob mal configurado).
    passWithNoTests: false,
    setupFiles: ['./test-setup.ts'],
    // Vitest sólo busca tests en src/ (co-localizados al source). Los specs
    // de Playwright (e2e/) tienen su propio runner — los excluimos explícito
    // por las dudas (el include glob ya los filtra, pero double-belt no daña).
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    // Cobertura (#414), sin thresholds: es mapa de lo no ejercitado, no un gate (ADR-0036).
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // src/app/** son páginas de Next: se prueban por E2E, no acá.
      exclude: ['src/**/*.test.{ts,tsx}', 'src/app/**', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only es un assertion runtime de Next.js que lanza si se importa
      // desde un client component. Vitest no es ningún component "type" - los
      // tests que importan código server-side (api-client.server.ts) caerían
      // en el throw. Aliasamos a un noop para que el harness pase.
      'server-only': path.resolve(__dirname, './test-shims/server-only.ts'),
    },
  },
});
