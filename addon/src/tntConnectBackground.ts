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

function extractEmail(author: string): string {
  const match = author.match(/<([^>]+)>/);
  return match ? match[1] : author;
}

async function handleMenuClick(info: any, tab: any) {
  if (!info?.selectedMessages?.messages) {
    return;
  }

  const results: Array<{ email: string; success: boolean; historyId?: number; error?: string }> = [];

  for (const email of info.selectedMessages.messages) {
    try {
      const messageId = email.id;
      const identityEmails = await getIdentityEmails();
      const direction = await getMessageDirection(email.author, identityEmails);
      const message = await extractMessage(messageId);
      const settings = await getSettings();

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
        results.push({ email: extractEmail(email.author), success: true, historyId: result.historyId });
      } else {
        results.push({ email: extractEmail(email.author), success: false, error: result.error || 'Unknown error' });
        console.warn(`Failed to import email from ${email.author}: ${result.error}`);
      }
    } catch (error) {
      results.push({ email: extractEmail(email.author), success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error(`Error occurred while importing email from ${email.author}:`, error);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  if (results.length === 0) {
    return;
  }

  if (failCount === 0) {
    browser.notifications.create('import-success', {
      type: 'basic',
      title: 'Import Successful',
      message: `Imported ${successCount} email${successCount > 1 ? 's' : ''} to TntConnect`
    });
  } else if (successCount === 0) {
    const errors = results.map(r => `${r.email}: ${r.error}`).join('\n');
    browser.notifications.create('import-failed', {
      type: 'basic',
      title: 'Import Failed',
      message: `Failed to import all ${failCount} email${failCount > 1 ? 's' : ''}:\n${errors}`
    });
  } else {
    const failures = results.filter(r => !r.success).map(r => `${r.email}: ${r.error}`).join('\n');
    browser.notifications.create('import-partial', {
      type: 'basic',
      title: 'Import Partially Successful',
      message: `Imported ${successCount} of ${results.length} emails.\nFailures:\n${failures}`
    });
  }
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
