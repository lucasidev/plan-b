import type { Settings, SettingsPatch } from './schema';

/**
 * Server-action state for update. The UI auto-saves per toggle: each toggle fires the
 * action with a small patch and the component reflects the result (silent success or
 * error with copy).
 */
export type UpdateSettingsFormState =
  | { status: 'idle' }
  | { status: 'success'; patch: SettingsPatch }
  | { status: 'error'; message: string; kind?: 'validation' | 'auth' | 'unknown' };

export const initialUpdateSettingsState: UpdateSettingsFormState = { status: 'idle' };

export type { Settings, SettingsPatch };
