'use client';

import type { Settings } from '../schema';
import { SectionCard } from './section-card';
import { ToggleSetting } from './toggle-setting';

type Props = {
  settings: Settings;
};

export function PrivacySection({ settings }: Props) {
  return (
    <SectionCard title="Privacidad" description="Qué se muestra de vos en el corpus público.">
      <ToggleSetting
        field="showDisplayNameInReviews"
        initialValue={settings.showDisplayNameInReviews}
        label="Mostrar mi nombre en mis reseñas"
        description="Si lo desactivás, tus reseñas aparecen como anónimas."
      />
      <ToggleSetting
        field="allowTeacherContact"
        initialValue={settings.allowTeacherContact}
        label="Permitir que docentes me contacten"
        description="Cuando respondan una reseña tuya, pueden mandarte un mensaje desde la app."
      />
    </SectionCard>
  );
}
