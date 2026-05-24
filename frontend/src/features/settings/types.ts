import type { Settings, SettingsPatch } from './schema';

/**
 * Estado del server action de update. El UI hace auto-save por toggle: cada toggle dispara
 * el action con un patch chico, y el componente refleja el resultado (success silencioso, o
 * error con copy).
 */
export type UpdateSettingsFormState =
  | { status: 'idle' }
  | { status: 'success'; patch: SettingsPatch }
  | { status: 'error'; message: string; kind?: 'validation' | 'auth' | 'unknown' };

export const initialUpdateSettingsState: UpdateSettingsFormState = { status: 'idle' };

export type { Settings, SettingsPatch };
