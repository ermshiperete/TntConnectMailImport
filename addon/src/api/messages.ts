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

async function getBodyFromBody(part: messenger.messages.MessagePart): Promise<{body: string, contentType: string}> {
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

async function getBodyFromPart(part: messenger.messages.MessagePart): Promise<string> {
  let body = '';
  if (part.body) {
    return getBodyFromBody(part).then(result => result.body);
  } else if (part.parts) {
    for (let i = 0; i < part.parts.length; i++) {
      const childPart = part.parts[i];
      if (childPart.body) {
        const { body: childBody, contentType } = await getBodyFromBody(childPart);
        body = childBody;
        if (contentType === 'text/plain') {
          break;
        }
      } else {
        body = await getBodyFromPart(childPart);
      }
    }
  }
  return body;
}

export async function extractMessage(messageId: number): Promise<string> {
  const fullMessage: messenger.messages.MessagePart = await browser.messages.getFull(messageId);

  let body = await getBodyFromPart(fullMessage);
  return cleanBody(body);
}
