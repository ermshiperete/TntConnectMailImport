import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockBrowser = {
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

vi.stubGlobal('browser', mockBrowser);

import { extractMessage, getMessageAuthor } from '@src/api/messages';

describe('messageExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts author, subject, and date', async () => {
    const mockMessage = {
      author: 'John Doe <john@example.com>',
      subject: 'Hello World',
      date: new Date('2024-01-01T12:00:00Z')
    };

    mockBrowser.messages.getFull.mockResolvedValue(mockMessage);
    mockBrowser.messengerUtilities.listInlineTextParts.mockResolvedValue([]);
    mockBrowser.messengerUtilities.convertToPlainText.mockResolvedValue('Plain text body');

    const result = await extractMessage('msg1');

    expect(result.author).toBe('John Doe <john@example.com>');
    expect(result.subject).toBe('Hello World');
    expect(result.date).toEqual(new Date('2024-01-01T12:00:00Z'));
  });

  it('prefers inline text parts over plain text conversion', async () => {
    const inlineParts = [{ body: 'Inline text part' }];
    const mockMessage = {
      author: 'John Doe <john@example.com>',
      subject: 'Hello',
      date: new Date('2024-01-01T12:00:00Z')
    };

    mockBrowser.messages.getFull.mockResolvedValue(mockMessage);
    mockBrowser.messengerUtilities.listInlineTextParts.mockResolvedValue(inlineParts);
    mockBrowser.messengerUtilities.convertToPlainText
      .mockResolvedValueOnce('Inline text part')
      .mockResolvedValueOnce('Fallback body');

    const result = await extractMessage('msg1');

    expect(result.body).toBe('Inline text part');
  });

  it('falls back to plain text conversion when no inline parts', async () => {
    const mockMessage = {
      author: 'John Doe <john@example.com>',
      subject: 'Hello',
      date: new Date('2024-01-01T12:00:00Z')
    };

    mockBrowser.messages.getFull.mockResolvedValue(mockMessage);
    mockBrowser.messengerUtilities.listInlineTextParts.mockResolvedValue([]);
    mockBrowser.messengerUtilities.convertToPlainText.mockResolvedValue('Fallback body');

    const result = await extractMessage('msg1');

    expect(result.body).toBe('Fallback body');
  });

  it('identifies sent mail when author matches identity', async () => {
    mockBrowser.identities.get.mockResolvedValue({
      email: 'me@example.com'
    });

    expect(getMessageAuthor('me@example.com', 'me@example.com')).toBe('sent');
  });

  it('identifies received mail when author does not match identity', async () => {
    mockBrowser.identities.get.mockResolvedValue({
      email: 'me@example.com'
    });

    expect(getMessageAuthor('other@example.com', 'me@example.com')).toBe('received');
  });
});
