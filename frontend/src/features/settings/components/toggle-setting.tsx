'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { updateSettingsAction } from '../actions';
import type { SettingsPatch } from '../schema';
import { SettingRow } from './setting-row';

/**
 * Single toggle with auto-save + optimistic UI. The toggle flips on click; if the
 * server action returns an error, it rolls back and we show a copy at the foot. There
 * is no debouncing because tapping the same toggle twice in a row is a marginal case:
 * if it happens, the first action wins or loses depending on response order, which is
 * semantically fine.
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
        // useOptimistic resets itself on rerender with the unchanged persistedValue.
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
