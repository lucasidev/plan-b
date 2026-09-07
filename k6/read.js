import http from 'k6/http';
import { check, sleep } from 'k6';

// Contra qué ambiente pegamos y cuántos lectores simultáneos sostenemos: los
// dos por env var, para correr el mismo script contra distinta URL o carga
// sin tocar el archivo (issue #464).
const BASE_URL = __ENV.BASE_URL || 'https://planb.olisar.com.ar';
const VUS = Number(__ENV.VUS) || 10;

// Perfil de lectura: sube en 30s hasta VUS lectores, los sostiene 1 minuto y
// baja en 15s. Umbrales: menos de 5% de requests fallidos y el 95% de las
// respuestas por debajo de 1.5s. Si algo se degrada antes de romper el
// threshold, el resumen por request (tag `name`) dice cuál.
export const options = {
  stages: [
    { duration: '30s', target: VUS },
    { duration: '1m', target: VUS },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

// Las cinco rutas públicas del recorrido de lectura: la entrada, una ficha de
// materia, una ficha de cátedra, el método y una búsqueda de catálogo. Los ids
// son los del corpus sembrado en el stage (materia 211 "Fundamentos de Control
// de Calidad" y Cátedra Pérez, ver docs/engineering/deploy.md).
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'subject-ficha', path: '/subjects/00000004-0000-4000-a000-000000000012' },
  { name: 'chair-ficha', path: '/chairs/00000008-0000-4000-a000-000000000001' },
  { name: 'method', path: '/method' },
  { name: 'search', path: '/api/search?q=control' },
];

export default function () {
  for (const route of ROUTES) {
    const response = http.get(`${BASE_URL}${route.path}`, {
      tags: { name: route.name },
    });
    check(response, {
      'responde 200': (r) => r.status === 200,
    });
    sleep(1);
  }
}
