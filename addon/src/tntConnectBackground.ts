import { extractMessage, getMessageDirection } from '@src/api/messages.js';
import { sendImportRequest } from '@src/api/native.js';
import { addEntry } from '@src/modules/menu.js';

const MAX_BODY_LENGTH = 200_000;

async function getIdentityEmails(): Promise<string[]> {
  const identities: string[] = [];
  try {
    const accounts = await messenger.accounts.list();
    console.log(`accounts=${JSON.stringify(accounts)}`);
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
  console.log(`info=${JSON.stringify(info)}, tab=${JSON.stringify(tab)}`);
  /*
  info={
    "menuItemId":"import-to-tntconnect",
    "parentMenuItemId":7,
    "editable":false,
    "selectedMessages":{
      "id":null,
      "messages":[{
        "id":35,
        "date":"2026-08-11T03:32:13.000Z",
        "author":"Sentry <noreply@md.getsentry.com>",
        "recipients":["eberhard_beilharz@sil.org"],"ccList":[],"bccList":[],
        "subject":"KEYMAN-LINUX-C0 - TypeError: string indices must be integers, not 'str'",
        "read":false,
        "new":false,
        "headersOnly":false,
        "flagged":false,
        "junk":false,
        "junkScore":0,
        "headerMessageId":"20260811033212.59.87540@md.getsentry.com",
        "size":35287,"
        tags":[],
        "external":false
      }]
    },
    "modifiers":[],
    "button":0
  },
  tab={
    "id":1,
    "index":0,
    "windowId":1,
    "highlighted":true,
    "active":true,"status":"complete","width":2247,"height":420,"groupId":-1,"cookieStoreId":"firefox-default","spaceId":1,"type":"mail","mailTab":true}
    */
  if (!info?.selectedMessages?.messages) {
    return;
  }
  await Promise.all(info.selectedMessages.messages.map(async (email: messenger.messages.MessageHeader) => {
    try {
      const messageId = email.id;
      const identityEmails = await getIdentityEmails();
      const direction = await getMessageDirection(email.author, identityEmails);
      const message = await extractMessage(messageId);

      function extractEmail(author: string): string {
        const match = author.match(/<([^>]+)>/);
        return match ? match[1] : author;
      }

      const request = {
        dbPath: '',
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
