export interface ImportRequest {
  dbPath: string;
  dbUser: string;
  contactEmail: string;
  subject: string;
  body: string;
  date: string;
  direction: 'sent' | 'received';
}

export interface ImportResponse {
  success: boolean;
  historyId?: number;
  error?: string;
}

export class NativeClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NativeClientError';
  }
}

export async function sendImportRequest(request: ImportRequest): Promise<ImportResponse> {
  return new Promise((resolve, reject) => {
    const port = browser.runtime.connectNative('tntconnect_mail_import');

    if (port.error) {
      console.error(`Failed to connect to native host: ${port.error.message}`);
      reject(new NativeClientError(port.error.message));
      return;
    }

    const messageHandler = (response: unknown) => {
      (port as any).onMessage.removeListener(messageHandler);
      (port as any).onDisconnect.removeListener(disconnectHandler);
      resolve(response as ImportResponse);
    };

    const disconnectHandler = (port: any) => {
      if (port.onMessage) {
        port.onMessage.removeListener(messageHandler);
      }
      if (port.onDisconnect) {
        port.onDisconnect.removeListener(disconnectHandler);
      }
      reject(new NativeClientError((port as any).error?.message || 'Native host disconnected'));
    };

    (port as any).onMessage.addListener(messageHandler);
    (port as any).onDisconnect.addListener(disconnectHandler);

    port.postMessage({
      action: 'importEmail',
      ...request
    });
  });
}
