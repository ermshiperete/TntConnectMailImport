import { getSettings, saveSettings } from '@src/modules/settings.js';

const databasePathInput = document.getElementById('databasePath') as HTMLInputElement;
const dbUserInput = document.getElementById('dbUser') as HTMLInputElement;
const saveButton = document.getElementById('save') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

async function loadSettings(): Promise<void> {
  const settings = await getSettings();
  databasePathInput.value = settings.databasePath;
  dbUserInput.value = settings.dbUser;
}

async function handleSave(): Promise<void> {
  await saveSettings({
    databasePath: databasePathInput.value,
    dbUser: dbUserInput.value
  });

  statusDiv.textContent = 'Settings saved.';
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 2000);
}

saveButton.addEventListener('click', handleSave);

loadSettings();
