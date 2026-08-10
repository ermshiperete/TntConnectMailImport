export interface ImportRequest {
  dbPath: string;
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

    const messageHandler = (response: ImportResponse) => {
      port.onMessage.removeListener(messageHandler);
      port.onDisconnect.removeListener(disconnectHandler);
      resolve(response);
    };

    const disconnectHandler = (error: Error) => {
      port.onMessage.removeListener(messageHandler);
      port.onDisconnect.removeListener(disconnectHandler);
      reject(new NativeClientError(error.message || 'Native host disconnected'));
    };

    port.onMessage.addListener(messageHandler);
    port.onDisconnect.addListener(disconnectHandler);

    port.postMessage({
      action: 'importEmail',
      ...request
    });
  });
}
