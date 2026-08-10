import { extractMessage } from '@src/api/messages.ts';
import { sendImportRequest } from '@src/api/native.ts';

async function getIdentityEmail(): Promise<string> {
  try {
    const accounts = await browser.accounts.list();
    if (accounts.length > 0 && accounts[0].identities.length > 0) {
      return accounts[0].identities[0].email;
    }
  } catch {
    // ignore
  }
  return '';
}

async function handleMenuClick(info: any, tab: any) {
  if (!tab?.messageId) return;

  try {
    const identityEmail = await getIdentityEmail();
    const message = await extractMessage(tab.messageId, identityEmail);

    const request = {
      dbPath: '',
      contactEmail: '',
      subject: message.subject,
      body: message.body,
      date: message.date.toISOString(),
      direction: message.direction
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
}

export default function initBackground() {
  browser.runtime.onInstalled.addListener(() => {
    browser.menus.create({
      id: 'import-to-tntconnect',
      title: 'Import to TntConnect',
      contexts: ['message']
    });
  });

  browser.menus.onClicked.addListener(handleMenuClick);
}

if (typeof browser !== 'undefined') {
  initBackground();
}

