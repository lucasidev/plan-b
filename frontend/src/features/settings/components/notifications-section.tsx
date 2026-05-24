'use client';

import type { Settings } from '../schema';
import { SectionCard } from './section-card';
import { ToggleSetting } from './toggle-setting';

type Props = {
  settings: Settings;
};

export function NotificationsSection({ settings }: Props) {
  return (
    <SectionCard title="Notificaciones" description="Elegí por dónde y para qué te avisamos.">
      <h3 className="text-xs font-mono uppercase tracking-wider text-ink-4 pt-3 pb-1">Canales</h3>
      <ToggleSetting
        field="notificationsInApp"
        initialValue={settings.notificationsInApp}
        label="Notificaciones en la app"
        description="Aparecen en la campana del topbar."
      />
      <ToggleSetting
        field="notificationsEmail"
        initialValue={settings.notificationsEmail}
        label="Notificaciones por email"
        description="Te llegan a tu casilla registrada."
      />

      <h3 className="text-xs font-mono uppercase tracking-wider text-ink-4 pt-3 pb-1">Por tipo</h3>
      <ToggleSetting
        field="notifyReviewResponse"
        initialValue={settings.notifyReviewResponse}
        label="Respuesta a mi reseña"
        description="Cuando un docente responde una reseña que escribí."
      />
      <ToggleSetting
        field="notifyNewReviewInFollowed"
        initialValue={settings.notifyNewReviewInFollowed}
        label="Nueva reseña en materia que sigo"
        description="Reseña publicada sobre una materia que marcaste como seguida."
      />
      <ToggleSetting
        field="notifyAcademicCalendar"
        initialValue={settings.notifyAcademicCalendar}
        label="Calendario académico"
        description="Recordatorio de inicio de cuatri y cierre de inscripción."
      />
      <ToggleSetting
        field="notifyDraftPromotionNudge"
        initialValue={settings.notifyDraftPromotionNudge}
        label="Recordatorio de promoción de borrador"
        description="Cuando tu borrador de planificación esté listo para confirmar."
      />
    </SectionCard>
  );
}
