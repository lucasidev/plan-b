/**
 * Presupuesto de rendimiento (#412). Mide y avisa, no gatea: los umbrales son `warn`, nunca
 * `error`, hasta que haya al menos dos corridas de CI para leer si son realistas.
 *
 * Corre contra un stack YA levantado (`just dev` o el stack de E2E arriba): esta config no
 * levanta nada. Local: `just frontend-lighthouse`. CI: paso "Lighthouse CI" del job `e2e`,
 * después de Playwright, contra el mismo `next start` que ya corrió la suite.
 *
 * Sin `settings.preset`: queda el default de Lighthouse (mobile, con su throttling de red y CPU),
 * a propósito. Midiendo acá mismo, un audit mobile tardó ~9,2s contra ~6,8s en desktop (~35% más
 * lento) para la misma URL; sumar una segunda pasada desktop llevaba las ocho auditorías (4 URLs ×
 * 2 corridas) de esta config cerca de los 4 minutos entre las dos pasadas, así que queda una sola:
 * mobile, que es la restricción real (a quién le importa más el rendimiento del producto).
 */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/method',
        'http://localhost:3000/subjects/00000004-0000-4000-a000-000000000012',
        'http://localhost:3000/chairs/00000008-0000-4000-a000-000000000001',
      ],
      numberOfRuns: 2,
    },
    assert: {
      // Sin preset: `lighthouse:no-pwa` agrega una aserción de nivel `error` por cada audit y
      // convierte cualquier audit rojo (hoy, el contraste de #451) en un exit 1. Acá se afirman
      // solo las cuatro categorías, y como `warn`.
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-report',
    },
  },
};
