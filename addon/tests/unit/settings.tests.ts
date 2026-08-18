import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, saveSettings, clearSettings } from '@src/modules/settings.js';

const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();
const mockStorageRemove = vi.fn();

const mockBrowser = {
  storage: {
    local: {
      get: mockStorageGet,
      set: mockStorageSet,
      remove: mockStorageRemove
    }
  }
};

vi.stubGlobal('browser', mockBrowser);

describe('settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default settings when nothing is stored', async () => {
    mockStorageGet.mockResolvedValue({});

    const settings = await getSettings();

    expect(settings).toEqual({
      databasePath: '',
      dbUser: ''
    });
  });

  it('returns stored settings', async () => {
    mockStorageGet.mockResolvedValue({
      settings: {
        databasePath: '/path/to/db/MyDB.mpddb',
        dbUser: 'user@example.com'
      }
    });

    const settings = await getSettings();

    expect(settings).toEqual({
      databasePath: '/path/to/db/MyDB.mpddb',
      dbUser: 'user@example.com'
    });
  });

  it('saves settings', async () => {
    mockStorageGet.mockResolvedValue({});
    mockStorageSet.mockResolvedValue(undefined);

    await saveSettings({
      databasePath: '/path/to/db/MyDB.mpddb',
      dbUser: 'user@example.com'
    });

    expect(mockStorageSet).toHaveBeenCalledWith({
      settings: {
        databasePath: '/path/to/db/MyDB.mpddb',
        dbUser: 'user@example.com'
      }
    });
  });

  it('merges partial settings with existing ones', async () => {
    mockStorageGet.mockResolvedValue({
      settings: {
        databasePath: '/old/path/OldDB.mpddb',
        dbUser: 'olduser@example.com'
      }
    });
    mockStorageSet.mockResolvedValue(undefined);

    await saveSettings({
      databasePath: '/new/path/NewDB.mpddb'
    });

    expect(mockStorageSet).toHaveBeenCalledWith({
      settings: {
        databasePath: '/new/path/NewDB.mpddb',
        dbUser: 'olduser@example.com'
      }
    });
  });

  it('clears settings', async () => {
    mockStorageRemove.mockResolvedValue(undefined);

    await clearSettings();

    expect(mockStorageRemove).toHaveBeenCalledWith('settings');
  });
});
