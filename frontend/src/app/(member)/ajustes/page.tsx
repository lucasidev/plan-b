import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { AjustesForm, fetchMySettings } from '@/features/settings';

export const metadata = {
  title: 'Ajustes · planb',
};

// La página depende de la sesión del request (cookies via apiFetchAuthenticated).
// Forzamos dynamic para que Next no intente prerender en build (donde no hay backend up,
// y el contenido es per-user igual).
export const dynamic = 'force-dynamic';

/**
 * /ajustes (US-072). Fetcheo server-side de los settings actuales (o defaults si el user
 * todavía no personalizó nada) y los pasamos al shell client-side que monta las secciones.
 *
 * <para>
 * Sin TanStack Query acá porque el caso de uso no necesita re-fetch ni cache compartida con
 * otras vistas: el componente cliente mantiene su propio state local y los auto-save invocan
 * server actions que revalidan la ruta. Una RSC + props es más simple y suficiente.
 * </para>
 */
export default async function AjustesPage() {
  const settings = await fetchMySettings();

  return (
    <div className="flex flex-col gap-8 py-6">
      <header>
        <DisplayHeading>Ajustes</DisplayHeading>
        <Lede>Configurá notificaciones, privacidad, idioma y tema visual.</Lede>
      </header>
      <AjustesForm initialSettings={settings} />
    </div>
  );
}
