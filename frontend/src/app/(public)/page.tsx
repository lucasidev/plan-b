import {
  fetchSampleChairFactsServer,
  LandingHero,
  LandingSample,
  LandingSteps,
  LpCtaFinal,
  LpFaq,
  LpFooter,
  LpTopbar,
} from '@/features/landing';
import { getSession } from '@/lib/session';

// La muestra sale sorteada de la base en cada visita: no puede quedar cacheada.
export const dynamic = 'force-dynamic';

/**
 * `/` root. La entrada del producto (US-221, SC-004).
 *
 * La entrada no explica el instrumento: lo muestra funcionando sobre una ficha real. Alguien que
 * llega de un link no tiene por qué creerle a otro sitio más, y una promesa ("verificamos", "es
 * independiente") no demuestra nada; un conteo con sus voces sí. Por eso la muestra viene de la
 * base y no de un ejemplo hardcodeado, y por eso sale sorteada entre las que ya publican: elegir la
 * de más voces sería un destacado disfrazado (US-171).
 *
 * Se renderea igual para anónimos y logueados; lo único que cambia con la sesión es el topbar.
 *
 * **Un bloque de SC-004 no está**: el de Pedir que carguemos una facultad. Su pantalla todavía no
 * existe, y un link a una pantalla inexistente es peor que no ofrecerla.
 */
export default async function LandingPage() {
  const [session, sample] = await Promise.all([getSession(), fetchSampleChairFactsServer()]);

  return (
    <>
      <LpTopbar isLoggedIn={session !== null} />

      <main>
        <LandingHero />
        <LandingSample sample={sample} />
        <LandingSteps />
        <LpFaq />
      </main>

      <LpCtaFinal />
      <LpFooter />
    </>
  );
}
