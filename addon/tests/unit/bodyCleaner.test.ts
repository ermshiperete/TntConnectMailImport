import { describe, it, expect } from 'vitest';
import { cleanBody } from '@src/cleaner/bodyCleaner.ts';

describe('bodyCleaner', () => {
  it('strips -- signature delimiter', () => {
    const input = 'Hello\n\n-- \nJohn Doe';
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it('strips ___ delimiter', () => {
    const input = 'Hello\n\n___\nJohn Doe';
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it('strips quoted lines starting with >', () => {
    const input = 'Hello\n\n> Quoted line\n> Another quote';
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });

  it('strips On ... wrote: quoted reply headers', () => {
    const input = 'Hello\n\nOn Mon, Jan 1, 2024, John Doe <john@example.com> wrote:';
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

  it('strips quoted block after reply header', () => {
    const input = 'Hello\n\nOn Mon, Jan 1, 2024, John wrote:\n\n> Hello\n> World';
    const result = cleanBody(input);
    expect(result).toBe('Hello');
  });
});
