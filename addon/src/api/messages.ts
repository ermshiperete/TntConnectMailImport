import { cleanBody } from '@src/cleaner/bodyCleaner.js';

export interface ExtractedMessage {
  date: Date;
  body: string;
}

export function getMessageDirection(messageAuthor: string, identityEmails: string[]): 'sent' | 'received' {
  if (!messageAuthor || !identityEmails) {
    return 'received';
  }

  const emailMatch = messageAuthor.match(/<(.+?)>/);
  const authorEmail = emailMatch ? emailMatch[1].toLowerCase() : messageAuthor.toLowerCase();

  const isSent = identityEmails.some((email: string) => authorEmail === email.toLowerCase());
  return isSent ? 'sent' : 'received';
}

interface BodyResult {
  body: string;
  contentType: string;
}

async function getBodyFromBody(part: messenger.messages.MessagePart): Promise<BodyResult> {
  let body = '';
  if (!part.body) {
    return { body, contentType: '' };
  }
  // ideally we want to use the text/plain part
  if (part.contentType && part.contentType === 'text/plain') {
    body = part.body;
  } else {
    // Otherwise we use what we can get
    body = await browser.messengerUtilities.convertToPlainText(part.body);
  }
  return {
    body,
    contentType: part.contentType ?? ''
  };
}

async function getBodyFromPart(part: messenger.messages.MessagePart): Promise<BodyResult> {
  let body = '';
  let contentType = '';
  if (part.body) {
    return getBodyFromBody(part);
  } else if (part.parts) {
    let result: BodyResult;
    for (let i = 0; i < part.parts.length; i++) {
      const childPart = part.parts[i];
      if (childPart.body) {
        result = await getBodyFromBody(childPart);
      } else {
        result = await getBodyFromPart(childPart);
      }
      if (result.contentType === 'text/plain') {
        return result;
      }
      if (!body) {
        body = result.body;
        contentType = result.contentType;
      }
    }
  }
  return { body, contentType };
}

export async function extractMessage(messageId: number): Promise<string> {
  const fullMessage: messenger.messages.MessagePart = await browser.messages.getFull(messageId);

  const result = await getBodyFromPart(fullMessage);
  return cleanBody(result.body);
}
