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
 * Shell de /settings. Cada sección es independiente y maneja su propio auto-save; este
 * componente solo orquesta el layout vertical. Recibe el snapshot inicial desde la RSC
 * (server-side fetch) para hidratar sin loading state.
 */
export function AjustesForm({ initialSettings }: Props) {
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
