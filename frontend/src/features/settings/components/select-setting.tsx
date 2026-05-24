'use client';

import { useOptimistic, useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateSettingsAction } from '../actions';
import type { SettingsPatch } from '../schema';
import { SettingRow } from './setting-row';

/**
 * Select con auto-save + optimistic UI. Mismo pattern que ToggleSetting pero para enums
 * string (Language, Theme). El field name + las opciones llegan por props para que el
 * componente sirva para los dos casos sin código duplicado.
 */
type Option<T extends string> = { value: T; label: string };

type Props<F extends 'language' | 'theme', T extends string> = {
  field: F;
  initialValue: T;
  options: ReadonlyArray<Option<T>>;
  label: string;
  description?: string;
  onChangeSideEffect?: (next: T) => void;
};

export function SelectSetting<F extends 'language' | 'theme', T extends string>({
  field,
  initialValue,
  options,
  label,
  description,
  onChangeSideEffect,
}: Props<F, T>) {
  const id = `select-${field}`;
  const [persistedValue, setPersistedValue] = useState<T>(initialValue);
  const [optimisticValue, setOptimisticValue] = useOptimistic<T>(persistedValue);
  const [, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (next: string) => {
    const typed = next as T;
    startTransition(async () => {
      setOptimisticValue(typed);
      setErrorMessage(null);

      const result = await updateSettingsAction({ status: 'idle' }, {
        [field]: typed,
      } as unknown as SettingsPatch);

      if (result.status === 'success') {
        setPersistedValue(typed);
        onChangeSideEffect?.(typed);
      } else if (result.status === 'error') {
        setErrorMessage(result.message);
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
          <Select value={optimisticValue} onValueChange={handleChange}>
            <SelectTrigger id={id} className="w-[180px]" aria-label={label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
