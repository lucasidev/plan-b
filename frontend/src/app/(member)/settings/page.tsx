import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { fetchMySettings, SettingsForm } from '@/features/settings';

export const metadata = {
  title: 'Ajustes · planb',
};

// The page depends on the request's session (cookies via apiFetchAuthenticated). We
// force dynamic so Next does not try to prerender at build time (where no backend is
// up, and the content is per-user anyway).
export const dynamic = 'force-dynamic';

/**
 * /settings (US-072). Server-side fetch of the current settings (or defaults if the
 * user has not customized anything yet) and they are passed to the client shell that
 * mounts the sections.
 *
 * No TanStack Query here because the use case does not need re-fetch or shared cache
 * with other views: the client component keeps its own local state and the auto-saves
 * invoke server actions that revalidate the route. An RSC + props is simpler and
 * enough.
 */
export default async function SettingsPage() {
  const settings = await fetchMySettings();

  return (
    <div className="flex flex-col gap-8 py-6">
      <header>
        <DisplayHeading>Ajustes</DisplayHeading>
        <Lede>Configurá notificaciones, privacidad, idioma y tema visual.</Lede>
      </header>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
