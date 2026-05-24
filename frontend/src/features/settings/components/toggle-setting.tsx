'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { updateSettingsAction } from '../actions';
import type { SettingsPatch } from '../schema';
import { SettingRow } from './setting-row';

/**
 * Toggle individual con auto-save + optimistic UI. El toggle se marca al click; si el server
 * action devuelve error, se rollbackea y mostramos un copy al pie. No hay debouncing porque
 * el caso de tocar el mismo toggle dos veces seguidas es marginal — si pasa, el primer
 * action gana o pierde según el orden de respuesta, lo cual es OK semántica-mente.
 */
type Props = {
  field: keyof Pick<
    SettingsPatch,
    | 'notificationsInApp'
    | 'notificationsEmail'
    | 'notifyReviewResponse'
    | 'notifyNewReviewInFollowed'
    | 'notifyAcademicCalendar'
    | 'notifyDraftPromotionNudge'
    | 'showDisplayNameInReviews'
    | 'allowTeacherContact'
  >;
  initialValue: boolean;
  label: string;
  description?: string;
};

export function ToggleSetting({ field, initialValue, label, description }: Props) {
  const id = `toggle-${field}`;
  const [persistedValue, setPersistedValue] = useState(initialValue);
  const [optimisticValue, setOptimisticValue] = useOptimistic(persistedValue);
  const [, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (next: boolean) => {
    startTransition(async () => {
      setOptimisticValue(next);
      setErrorMessage(null);

      const result = await updateSettingsAction({ status: 'idle' }, {
        [field]: next,
      } as SettingsPatch);

      if (result.status === 'success') {
        setPersistedValue(next);
      } else if (result.status === 'error') {
        setErrorMessage(result.message);
        // useOptimistic se resetea solo al rerender con el persistedValue sin cambio.
      }
    });
  };

  return (
    <div>
      <SettingRow
        htmlFor={id}
        label={label}
        description={description}
        control={
          <Switch
            id={id}
            checked={optimisticValue}
            onCheckedChange={handleChange}
            aria-label={label}
          />
        }
      />
      {errorMessage && (
        <p className="text-xs text-danger mt-1 mb-3" role="status">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
