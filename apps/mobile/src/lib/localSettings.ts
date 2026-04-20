import * as SecureStore from 'expo-secure-store';
import { mergeAppSettings, type AppSettings } from '@laundry/domain';

const LOCAL_SETTINGS_KEY = 'laundry.mobile.settings.v1';

const LOCAL_PREFERENCE_KEYS = [
  'theme',
  'lastCatalog',
  'lastServiceType',
  'dashboardDateStart',
  'dashboardDateEnd',
  'dashboardTypeFilter',
  'statsRange',
  'statsTypeFilter',
  'blurIntensity',
  'cardOpacity',
  'modalOpacityMiddle',
  'modalOpacityAverage',
  'modalOpacityEdges',
] as const satisfies ReadonlyArray<keyof AppSettings>;

type LocalPreferenceKey = (typeof LOCAL_PREFERENCE_KEYS)[number];
type LocalSettingsShape = Partial<Pick<AppSettings, LocalPreferenceKey>>;

function pickLocalSettings(input?: Partial<AppSettings> | null): LocalSettingsShape {
  if (!input) return {};

  return LOCAL_PREFERENCE_KEYS.reduce<LocalSettingsShape>((acc, key) => {
    const value = input[key];
    if (value !== undefined) {
      acc[key] = value as never;
    }
    return acc;
  }, {});
}

export async function getLocalSettings(): Promise<LocalSettingsShape> {
  try {
    const raw = await SecureStore.getItemAsync(LOCAL_SETTINGS_KEY);
    if (!raw) return {};
    return pickLocalSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    return {};
  }
}

export async function setLocalSettings(partial: Partial<AppSettings>): Promise<LocalSettingsShape> {
  const current = await getLocalSettings();
  const next = pickLocalSettings(mergeAppSettings({ ...current, ...partial }));
  await SecureStore.setItemAsync(LOCAL_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function mergeWithLocalSettings(
  base: Partial<AppSettings> | null | undefined,
  local: Partial<AppSettings> | null | undefined,
) {
  return mergeAppSettings({
    ...(base ?? {}),
    ...pickLocalSettings(local),
  });
}

