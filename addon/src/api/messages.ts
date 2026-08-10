import { cleanBody } from '@src/cleaner/bodyCleaner.ts';

export interface ExtractedMessage {
  author: string;
  subject: string;
  date: Date;
  body: string;
  direction: 'sent' | 'received';
}

export function getMessageAuthor(messageAuthor: string, identityEmail: string): 'sent' | 'received' {
  if (!messageAuthor || !identityEmail) {
    return 'received';
  }

  const emailMatch = messageAuthor.match(/<(.+?)>/);
  const authorEmail = emailMatch ? emailMatch[1].toLowerCase() : messageAuthor.toLowerCase();

  if (authorEmail === identityEmail.toLowerCase()) {
    return 'sent';
  }

  return 'received';
}

export async function extractMessage(messageId: string, identityEmail: string): Promise<ExtractedMessage> {
  const fullMessage = await browser.messages.getFull(messageId);
  const author = fullMessage.author;
  const subject = fullMessage.subject;
  const date = new Date(fullMessage.date);

  let body: string;

  try {
    const parts = await browser.messengerUtilities.listInlineTextParts(messageId);
    if (parts.length > 0) {
      body = await browser.messengerUtilities.convertToPlainText(parts);
    } else {
      body = await browser.messengerUtilities.convertToPlainText(fullMessage.parts);
    }
  } catch {
    body = '';
  }

  body = cleanBody(body);

  const direction = getMessageAuthor(author, identityEmail);

  return {
    author,
    subject,
    date,
    body,
    direction
  };
}
