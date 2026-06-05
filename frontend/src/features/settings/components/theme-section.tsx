'use client';

import { useTheme } from 'next-themes';
import type { Settings, ThemeOption } from '../schema';
import { SectionCard } from './section-card';
import { SelectSetting } from './select-setting';

const THEME_OPTIONS = [
  { value: 'Auto', label: 'Sistema' },
  { value: 'Light', label: 'Claro' },
  { value: 'Dark', label: 'Oscuro' },
] as const satisfies ReadonlyArray<{ value: ThemeOption; label: string }>;

const SETTING_TO_NEXT_THEME = {
  Auto: 'system',
  Light: 'light',
  Dark: 'dark',
} as const;

type Props = {
  settings: Settings;
};

/**
 * Theme select integrated with next-themes. The change is persisted to the backend and
 * also applied immediately on the client via `useTheme().setTheme`. Per-toggle
 * auto-save: the side effect that applies the theme on the client runs only after the
 * server action returns success (so we don't apply a theme that later rolls back due
 * to a network error).
 */
export function ThemeSection({ settings }: Props) {
  const { setTheme } = useTheme();

  return (
    <SectionCard title="Tema" description="Visual claro u oscuro de la app, o seguir al sistema.">
      <SelectSetting
        field="theme"
        initialValue={settings.theme}
        options={THEME_OPTIONS}
        label="Tema visual"
        onChangeSideEffect={(next) => setTheme(SETTING_TO_NEXT_THEME[next])}
      />
    </SectionCard>
  );
}
