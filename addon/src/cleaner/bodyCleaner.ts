export function cleanBody(body: string): string {
  if (!body) {
    return '';
  }

  let cleaned = body;

  const replyHeaderPatterns = [
    /^On[\s\S]*?\bwrote:[\s\S]*$/m,
    /^Am[\s\S]*?\bschrieb[\s\S]*$/m,
    /^\*?From:[\s\S]*$/m,
    /^\*?Gesendet:[\s\S]*$/m,
    /^-+Ursprüngliche Nachricht-+[\s\S]*$/m
  ];

  for (const pattern of replyHeaderPatterns) {
    const match = pattern.exec(cleaned);
    if (match) {
      cleaned = cleaned.replace(pattern, '');
      break;
    }
  }

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

  const warningHeaderPattern = /^\[?Einige Personen, die diese Nachricht erhalten haben, erhalten nicht oft eine E-Mail von [^@]+@(\w|\.)+\. Erfahren Sie, warum dies wichtig ist<https:\/\/aka\.ms\/LearnAboutSenderIdentification>\s*\]?\s*/m;
  const warningMatch = warningHeaderPattern.exec(cleaned);
  if (warningMatch) {
    cleaned = cleaned.replace(warningHeaderPattern, '');
  }

  const lines = cleaned.split('\n');
  const filtered = lines.filter(line => !line.trim().startsWith('>'));
  cleaned = filtered.join('\n');

  cleaned = cleaned.trimEnd();

  return cleaned;
}
