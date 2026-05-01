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
    // Vitest sólo busca tests en src/ (co-localizados al source). Si en el
    // futuro necesitamos tests fuera (e.g. e2e/), usar otro config o glob
    // explícito.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
