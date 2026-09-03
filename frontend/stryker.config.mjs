/**
 * Mutation testing de la lógica de la pantalla Reseñar (feature write-review): el schema
 * de validación, la server action que publica y los fetchers server-side. Los componentes
 * quedan afuera: un `.tsx` es UI, y esta corrida mide si los tests atrapan cambios de
 * comportamiento, no de layout.
 *
 * Sin `break`: mide, no gatea (ADR-0036).
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  testRunner: 'vitest',
  mutate: ['src/features/write-review/**/*.ts', '!src/features/write-review/**/*.test.ts'],
  reporters: ['html', 'json', 'progress', 'clear-text'],
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  tempDirName: '.stryker-tmp',
};

export default config;
