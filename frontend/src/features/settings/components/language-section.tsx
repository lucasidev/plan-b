'use client';

import type { Settings } from '../schema';
import { SectionCard } from './section-card';
import { SelectSetting } from './select-setting';

const LANGUAGE_OPTIONS = [
  { value: 'EsRioplatense', label: 'Español rioplatense' },
  { value: 'EsNeutro', label: 'Español neutro' },
  { value: 'En', label: 'English' },
] as const;

type Props = {
  settings: Settings;
};

export function LanguageSection({ settings }: Props) {
  return (
    <SectionCard
      title="Idioma"
      description="Por ahora la app está en español rioplatense. Las otras opciones llegan cuando aterrice i18n."
    >
      <SelectSetting
        field="language"
        initialValue={settings.language}
        options={LANGUAGE_OPTIONS}
        label="Idioma de la app"
      />
    </SectionCard>
  );
}
