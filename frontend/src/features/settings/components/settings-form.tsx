'use client';

import type { Settings } from '../schema';
import { LanguageSection } from './language-section';
import { NotificationsSection } from './notifications-section';
import { PrivacySection } from './privacy-section';
import { SecuritySection } from './security-section';
import { ThemeSection } from './theme-section';

type Props = {
  initialSettings: Settings;
};

/**
 * Shell of /settings. Each section is independent and owns its own auto-save; this
 * component just orchestrates the vertical layout. It receives the initial snapshot
 * from the RSC (server-side fetch) to hydrate without a loading state.
 */
export function SettingsForm({ initialSettings }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <NotificationsSection settings={initialSettings} />
      <PrivacySection settings={initialSettings} />
      <LanguageSection settings={initialSettings} />
      <ThemeSection settings={initialSettings} />
      <SecuritySection />
    </div>
  );
}
