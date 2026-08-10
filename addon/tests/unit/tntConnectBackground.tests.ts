import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initBackground } from '@src/tntConnectBackground.js';

const mockMenusCreate = vi.fn((_createData: any, callback: () => void) => {
    Promise.resolve().then(callback);
    return 'mock-menu-id';
});

const mockMenusOnClicked = {
  addListener: vi.fn()
};

const mockNotificationsCreate = vi.fn();

const mockBrowser = {
  runtime: {
    onInstalled: {
      addListener: vi.fn()
    },
    onStartup: {
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
  },
  messages: {
    getFull: vi.fn(),
    get: vi.fn()
  },
  messengerUtilities: {
    listInlineTextParts: vi.fn(),
    convertToPlainText: vi.fn()
  },
  identities: {
    get: vi.fn()
  }
};

const mockMessenger = {
  accounts: {
    list: vi.fn().mockResolvedValue([])
  }
};

vi.stubGlobal('browser', mockBrowser);
vi.stubGlobal('messenger', mockMessenger);

describe('background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates context menu on install', async () => {
    await initBackground();

    const installHandler = mockBrowser.runtime.onInstalled.addListener.mock.calls[0][0];
    await installHandler({ reason: 'install' });

    expect(mockMenusCreate).toHaveBeenCalled();
  });

  it('creates context menu on startup', async () => {
    initBackground();

    const startupHandler = mockBrowser.runtime.onStartup.addListener.mock.calls[0][0];
    await startupHandler();

    expect(mockMenusCreate).toHaveBeenCalled();
  });

  it('orchestrates extract, clean, send, and notify on click', async () => {
    initBackground();

    const clickHandler = mockBrowser.menus.onClicked.addListener.mock.calls[0][0];

    const mockInfo = {
      selectedMessages: {
        messages: [{
          id: 'msg1',
          author: 'john@example.com',
          subject: 'Hello',
          date: '2024-01-01T00:00:00.000Z'
        }]
      }
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
    initBackground();

    const clickHandler = mockBrowser.menus.onClicked.addListener.mock.calls[0][0];

    const mockInfo = {
      selectedMessages: {
        messages: [{
          id: 'msg1',
          author: 'john@example.com',
          subject: 'Hello',
          date: '2024-01-01T00:00:00.000Z'
        }]
      }
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
