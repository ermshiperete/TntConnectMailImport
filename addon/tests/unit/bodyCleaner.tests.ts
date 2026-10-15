import { describe, it, expect } from 'vitest';
import { cleanBody } from '@src/cleaner/bodyCleaner.ts';

describe('bodyCleaner', () => {
  it.each([
    'Hello\n\n-- \nJohn Doe',
    'Hello\n\n___\nJohn Doe',
  ])('strips signature delimiters: %s', (input) => {
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it.each([
    'Hello\n\n> Quoted line\n> Another quote',
    'Hello\n\nOn Mon, Jan 1, 2024, John Doe <john@example.com> wrote:',
    'Hello\r\n\r\n-----Ursprüngliche Nachricht-----\r\nVon: John Doe <john@example.com>',
    'Hello\n\nOn Mon, Jan 1, 2024, John wrote:\n\n> Hello\n> World',
    'Hello\n\Am Mon, Jan 1, 2024 schrieb John:\n\n> Hello\n> World',
    'Hello\nJohn Doe <john@example.com> schrieb am Di., 29. Sept. 2026, 11:42:\nHello World',
  ])('strips reply headers: %s', (input) => {
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it('trims trailing whitespace', () => {
    const input = 'Hello  \n  \n';
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(cleanBody('')).toBe('');
  });

  it('handles no signature', () => {
    const input = 'Hello world';
    expect(cleanBody(input)).toBe('Hello world');
  });

  it('strips multiple signatures', () => {
    const input = 'Hello\n\n-- \nJohn\n\n-- \nJane';
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it.each([
    ['no brackets', 'Einige Personen, die diese Nachricht erhalten haben, erhalten nicht oft eine E-Mail von john@example.com. Erfahren Sie, warum dies wichtig ist<https://aka.ms/LearnAboutSenderIdentification>\r\nLiebe Doe,'],
    ['with brackets', '[Einige Personen, die diese Nachricht erhalten haben, erhalten nicht oft eine E-Mail von john@example.com. Erfahren Sie, warum dies wichtig ist<https://aka.ms/LearnAboutSenderIdentification>]\r\nLiebe Doe,'],
  ])('strips warning header: %s (%s)', (name, input) => {
    const result = cleanBody(input);
    expect(result).toBe('Liebe Doe,');
  });

  it('no match returns all', () => {
    const input = 'Hello\n\nThis is a test email.';
    const result = cleanBody(input);
    expect(result).toBe('Hello\n\nThis is a test email.');
  });
});
