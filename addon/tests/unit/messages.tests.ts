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

import { extractMessage, getMessageDirection } from '@src/api/messages';

describe('extractMessage tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns body if available', async () => {
    const mockMessage = {
      author: 'John Doe <john@example.com>',
      subject: 'Hello',
      date: new Date('2024-01-01T12:00:00Z'),
      body: 'Inline text part'
    };

    mockBrowser.messages.getFull.mockResolvedValue(mockMessage);
    mockBrowser.messengerUtilities.convertToPlainText.mockResolvedValue('Inline text part');

    const result = await extractMessage('msg1');

    expect(result).toBe('Inline text part');
  });

  it('uses plain text if multiple parts', async () => {
    const mockMessage = {
      author: 'John Doe <john@example.com>',
      subject: 'Hello',
      date: new Date('2024-01-01T12:00:00Z'),
      parts: [
        {
          contentType: 'multipart/alternative',
          parts: [
            {
              contentType: 'text/html',
              body: '<p>Hello Html</p>'
            },
            {
              contentType: 'text/plain',
              body: 'Hello Text'
            }
          ]
        }
      ]
    };

    mockBrowser.messages.getFull.mockResolvedValue(mockMessage);
    mockBrowser.messengerUtilities.convertToPlainText.mockResolvedValue('Hello Html');

    const result = await extractMessage('msg1');

    expect(result).toBe('Hello Text');
  });

  it('falls back to other text if no plain text', async () => {
    const mockMessage = {
      author: 'John Doe <john@example.com>',
      subject: 'Hello',
      date: new Date('2024-01-01T12:00:00Z'),
      parts: [
        {
          contentType: 'multipart/alternative',
          parts: [
            {
              contentType: 'text/html',
              body: '<p>Hello Html</p>'
            }
          ]
        }
      ]
    };

    mockBrowser.messages.getFull.mockResolvedValue(mockMessage);
    mockBrowser.messengerUtilities.convertToPlainText.mockResolvedValue('Hello Html');

    const result = await extractMessage('msg1');

    expect(result).toBe('Hello Html');
  });
});

describe('getMessageDirection tests', () => {
  it('identifies sent mail when author matches identity', () => {
    expect(getMessageDirection('me@example.com', ['me@example.com'])).toBe('sent');
  });

  it('identifies sent mail when author matches one of multiple identities', () => {
    expect(getMessageDirection('me@example.com', ['other@example.com', 'me@example.com'])).toBe('sent');
  });

  it('identifies received mail when author does not match identity', () => {
    expect(getMessageDirection('other@example.com', ['me@example.com'])).toBe('received');
  });

  it('identifies received mail with full author name (matching identity)', () => {
    expect(getMessageDirection('My User <me@example.com>', ['me@example.com'])).toBe('sent');
  });

  it('identifies received mail with full author name (not matching identity)', () => {
    expect(getMessageDirection('Other User <other@example.com>', ['me@example.com'])).toBe('received');
  });
});
