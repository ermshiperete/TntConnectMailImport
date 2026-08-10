export function cleanBody(body: string): string {
  if (!body) return '';

  let cleaned = body;

  const replyHeaderPattern = /^On\s.+wrote:\s*$/m;
  cleaned = cleaned.replace(replyHeaderPattern, '');

  const signaturePatterns = [
    /^-- $/m,
    /^___+$/m
  ];

  for (const pattern of signaturePatterns) {
    const match = pattern.exec(cleaned);
    if (match) {
      cleaned = cleaned.slice(0, match.index);
    }
  }

  const lines = cleaned.split('\n');
  const filtered = lines.filter(line => !line.trim().startsWith('>'));
  cleaned = filtered.join('\n');

  cleaned = cleaned.trimEnd();

  return cleaned;
}
