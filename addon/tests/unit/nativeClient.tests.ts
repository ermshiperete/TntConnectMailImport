import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPort = {
  postMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  },
  onDisconnect: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  },
  disconnect: vi.fn()
};

const mockConnectNative = vi.fn(() => mockPort);

vi.stubGlobal('browser', {
  runtime: {
    connectNative: mockConnectNative
  }
});

import { sendImportRequest, NativeClientError } from '@src/api/native.js';

describe('nativeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends JSON message to native host', async () => {
    const promise = sendImportRequest({
      dbPath: '/path/to/db.mpddb',
      contactEmail: 'john@example.com',
      subject: 'Hello',
      body: 'Message body',
      date: '2024-01-01T12:00:00.000Z',
      direction: 'received'
    });

    const messageHandler = mockPort.onMessage.addListener.mock.calls[0][0];
    messageHandler({ success: true, historyId: 12345 });

    const result = await promise;
    expect(mockConnectNative).toHaveBeenCalledWith('tntconnect_mail_import');
    expect(mockPort.postMessage).toHaveBeenCalledWith({
      action: 'importEmail',
      dbPath: '/path/to/db.mpddb',
      contactEmail: 'john@example.com',
      subject: 'Hello',
      body: 'Message body',
      date: '2024-01-01T12:00:00.000Z',
      direction: 'received'
    });
    expect(result).toEqual({ success: true, historyId: 12345 });
  });

  it('returns error response on failure', async () => {
    const promise = sendImportRequest({
      dbPath: '/path/to/db.mpddb',
      contactEmail: 'john@example.com',
      subject: 'Hello',
      body: 'Message body',
      date: '2024-01-01T12:00:00.000Z',
      direction: 'received'
    });

    const messageHandler = mockPort.onMessage.addListener.mock.calls[0][0];
    messageHandler({ success: false, error: 'Contact not found' });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Contact not found');
  });

  it('handles port disconnect', async () => {
    const promise = sendImportRequest({
      dbPath: '/path/to/db.mpddb',
      contactEmail: 'john@example.com',
      subject: 'Hello',
      body: 'Message body',
      date: '2024-01-01T12:00:00.000Z',
      direction: 'received'
    });

    const disconnectHandler = mockPort.onDisconnect.addListener.mock.calls[0][0];
    disconnectHandler({ error: new Error('Native host disconnected') });

    await expect(promise).rejects.toThrow(NativeClientError);
  });
});
