import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMenusCreate = vi.fn();
const mockMenusOnClicked = {
  addListener: vi.fn()
};

const mockNotificationsCreate = vi.fn();

describe('background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.browser = {
      runtime: {
        onInstalled: {
          addListener: vi.fn()
        }
      },
      menus: {
        create: mockMenusCreate,
        onClicked: mockMenusOnClicked
      },
      notifications: {
        create: mockNotificationsCreate
      },
      accounts: {
        list: vi.fn().mockResolvedValue([{ identities: [{ email: 'me@example.com' }] }])
      }
    };
  });

  it('creates context menu on install', async () => {
    const { default: initBackground } = await import('@src/background.ts');
    initBackground();

    const installHandler = globalThis.browser.runtime.onInstalled.addListener.mock.calls[0][0];
    await installHandler({ reason: 'install' });

    expect(mockMenusCreate).toHaveBeenCalled();
  });

  it('orchestrates extract, clean, send, and notify on click', async () => {
    const { default: initBackground } = await import('@src/background.ts');
    initBackground();

    const clickHandler = globalThis.browser.menus.onClicked.addListener.mock.calls[0][0];

    const mockInfo = {
      messageId: 'msg1'
    };

    const mockTab = {
      messageId: 'msg1'
    };

    const mockExtract = await import('@src/api/messages.ts');
    vi.spyOn(mockExtract, 'extractMessage').mockResolvedValue({
      author: 'john@example.com',
      subject: 'Hello',
      date: new Date('2024-01-01'),
      body: 'Message body',
      direction: 'received'
    });

    const mockNative = await import('@src/api/native.ts');
    vi.spyOn(mockNative, 'sendImportRequest').mockResolvedValue({
      success: true,
      historyId: 12345
    });

    await clickHandler(mockInfo, mockTab);

    expect(mockNotificationsCreate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        type: 'basic',
        title: 'Import Successful',
        message: expect.any(String)
      })
    );
  });

  it('shows error notification on contact not found', async () => {
    const { default: initBackground } = await import('@src/background.ts');
    initBackground();

    const clickHandler = globalThis.browser.menus.onClicked.addListener.mock.calls[0][0];

    const mockInfo = {
      messageId: 'msg1'
    };

    const mockTab = {
      messageId: 'msg1'
    };

    const mockNative = await import('@src/api/native.ts');
    vi.spyOn(mockNative, 'sendImportRequest').mockResolvedValue({
      success: false,
      error: 'Contact not found'
    });

    await clickHandler(mockInfo, mockTab);

    expect(mockNotificationsCreate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        type: 'basic',
        title: 'Import Failed'
      })
    );
  });
});
