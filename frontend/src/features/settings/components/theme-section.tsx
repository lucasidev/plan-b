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
 * Theme select integrado con next-themes. El cambio se persiste al backend y además se aplica
 * inmediato en el cliente vía <c>useTheme().setTheme</c>. Auto-save por toggle: el side effect
 * de aplicar al cliente corre solo cuando el server action devolvió success (para no aplicar
 * un tema que después se rollbackea por error de red).
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
