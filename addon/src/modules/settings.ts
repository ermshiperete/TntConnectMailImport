export interface AppSettings {
  databasePath: string;
  dbUser: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  databasePath: '',
  dbUser: ''
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const result = await browser.storage.local.get('settings');
    return { ...DEFAULT_SETTINGS, ...(result.settings as Partial<AppSettings> | undefined) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    await browser.storage.local.set({ settings: { ...current, ...settings } });
  } catch {
    // ignore
  }
}

export async function clearSettings(): Promise<void> {
  try {
    await browser.storage.local.remove('settings');
  } catch {
    // ignore
  }
}
