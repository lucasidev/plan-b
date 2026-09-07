import http from 'k6/http';
import { check, sleep } from 'k6';

// Contra qué ambiente pegamos y cuántos escritores simultáneos sostenemos.
const BASE_URL = __ENV.BASE_URL || 'https://planb.olisar.com.ar';
const VUS = Number(__ENV.VUS) || 3;

// Cuenta sembrada contra la que se loguea (ver seed-data/personas.json). Lucía
// tiene perfil de alumna y está VerifiedActive, así que sirve de default para
// el email; la password NO tiene default a propósito, para que sembrarla mal
// (o correr esto sin querer) no cuele una password débil en un script commiteado.
const SEED_EMAIL = __ENV.SEED_EMAIL || 'lucia.mansilla@gmail.com';
const SEED_PASSWORD = __ENV.SEED_PASSWORD;

// Perfil de escritura, más chico que el de lectura: sube en 30s hasta VUS,
// sostiene 30s, baja en 10s. NO publica reseñas (contaminaría el corpus del
// stage): lo caro que medimos es el sign-in (bcrypt, cost factor 12, ver
// BCryptPasswordHasher.cs), con una lectura autenticada atrás para confirmar
// que la cookie de sesión quedó funcionando.
//
// Nota sobre rate limiting: al momento de escribir esto, SignInEndpoint no usa
// IRateLimiter (a diferencia de register, forgot-password y resend-verification,
// que sí lo usan). Si en algún momento se le suma un límite al ingreso, VUS
// tiene que quedar por debajo de ese cupo o esta corrida empieza a devolver 429.
export const options = {
  stages: [
    { duration: '30s', target: VUS },
    { duration: '30s', target: VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{name:sign-in}': ['p(95)<3000'],
  },
};

// Corre una sola vez, antes de levantar los VUs (no una vez por VU ni por
// iteración): un solo error claro si falta la password, y no rompe `k6
// inspect` / `k6 archive`, que solo leen el init context y nunca llaman esto.
export function setup() {
  if (!SEED_PASSWORD) {
    throw new Error('Falta SEED_PASSWORD: no tiene default a propósito, pasala por env.');
  }
}

export default function () {
  const signInResponse = http.post(
    `${BASE_URL}/api/identity/sign-in`,
    JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'sign-in' },
    },
  );
  check(signInResponse, {
    'sign-in responde 200': (r) => r.status === 200,
  });

  // Lectura autenticada: confirma que la cookie que dejó el sign-in funciona.
  // La ruta real de "Mis aportes" es /api/reviews/courses/me (GetMyReviewsEndpoint.cs),
  // no /api/reviews/mine.
  const mineResponse = http.get(`${BASE_URL}/api/reviews/courses/me`, {
    tags: { name: 'reviews-mine' },
  });
  check(mineResponse, {
    'mis aportes responde 200': (r) => r.status === 200,
  });

  sleep(1);
}
