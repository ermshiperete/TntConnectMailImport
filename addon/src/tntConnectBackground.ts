import { extractMessage, getMessageDirection } from '@src/api/messages.js';
import { sendImportRequest } from '@src/api/native.js';
import { addEntry } from '@src/modules/menu.js';
import { getSettings } from '@src/modules/settings.js';

const MAX_BODY_LENGTH = 200_000;

async function getIdentityEmails(): Promise<string[]> {
  const identities: string[] = [];
  try {
    const accounts = await messenger.accounts.list();
    accounts.forEach((account) => {
      account.identities.forEach((identity) => {
        if (identity.email) {
          identities.push(identity.email);
        }
      });
    });
  } catch {
    // ignore
  }
  return identities;
}

async function handleMenuClick(info: any, tab: any) {
  if (!info?.selectedMessages?.messages) {
    return;
  }
  await Promise.all(info.selectedMessages.messages.map(async (email: messenger.messages.MessageHeader) => {
    try {
      const messageId = email.id;
      const identityEmails = await getIdentityEmails();
      const direction = await getMessageDirection(email.author, identityEmails);
      const message = await extractMessage(messageId);
      const settings = await getSettings();

      function extractEmail(author: string): string {
        const match = author.match(/<([^>]+)>/);
        return match ? match[1] : author;
      }

      const request = {
        dbPath: settings.databasePath,
        dbUser: settings.dbUser,
        contactEmail: extractEmail(email.author),
        subject: email.subject,
        body: message.slice(0, MAX_BODY_LENGTH),
        date: new Date(email.date).toISOString(),
        direction: direction
      };

      const result = await sendImportRequest(request);

      if (result.success) {
        browser.notifications.create('import-success', {
          type: 'basic',
          title: 'Import Successful',
          message: `History entry created (ID: ${result.historyId})`
        });
      } else {
        browser.notifications.create('import-failed', {
          type: 'basic',
          title: 'Import Failed',
          message: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      browser.notifications.create('import-error', {
        type: 'basic',
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));
}

async function createMenu() {
  await addEntry({
    id: 'import-to-tntconnect',
    title: 'Import to TntConnect',
    contexts: ['message_list']
  });
}

function onInstalled() {
  createMenu();
}

function onStartup() {
  createMenu();
}

export function initBackground() {
  browser.runtime.onInstalled.addListener(onInstalled);
  browser.runtime.onStartup.addListener(onStartup);
  browser.menus.onClicked.addListener(handleMenuClick);
}

if (typeof browser !== 'undefined') {
    initBackground();
}
