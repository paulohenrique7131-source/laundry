import type { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  lastCatalog: 'services',
  lastServiceType: 'Normal',
  blurIntensity: 16,
  cardOpacity: 0.15,
  showAbout: true,
  modalOpacityMiddle: 0.9,
  modalOpacityAverage: 0.6,
  modalOpacityEdges: 0.2,
  customCatalogs: [],
};

export function mergeAppSettings(input?: Partial<AppSettings> | null): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(input ?? {}),
    customCatalogs: input?.customCatalogs ?? DEFAULT_SETTINGS.customCatalogs,
  };
}
