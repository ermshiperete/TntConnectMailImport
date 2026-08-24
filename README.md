# TntConnect Mail Import

Thunderbird add-on that imports emails into TntConnect as history
entries.

## Installation from Release

### Native host (Linux)

1. Copy the shell wrapper and JAR to a permanent location:

    ```bash
    chmod +x tntconnect-native-host 
    sudo cp tntconnect-native-host /usr/local/bin/
    sudo cp tntconnect-native-host.jar /usr/local/lib/
    ```

2. Copy the manifest to the Thunderbird native messaging hosts
   directory:

    ```bash
    mkdir -p ~/.mozilla/native-messaging-hosts/
    cp tntconnect_mail_import.json ~/.mozilla/native-messaging-hosts/
    ```

### Thunderbird add-on

1. Open Thunderbird → Menu → Add-ons and Themes → Settings (gear) →
   Install Add-on From File
2. Select `TntConnectMailImport_*.xpi`

### Thunderbird as flatpak

When running Thunderbird as a flatpak, there are a few additonal steps
required:

```bash
mkdir -p ~/.var/app/org.mozilla.thunderbird_esr/.thunderbird/native-messaging-hosts
cp tntconnect_mail_import.json \
  ~/.var/app/org.mozilla.thunderbird_esr/.thunderbird/native-messaging-hosts/
```

In the Thunderbird Config Editor (Edit → Settings → General → Config Editor), set
`widget.use-xdg-desktop-portal.native-messaging` to `1`.

## Usage

1. Open an email in Thunderbird
2. Right-click the message → "Import to TntConnect"
3. If successful, a notification shows the new history entry ID

## Development

### Architecture

Thunderbird add-on (TypeScript) → JSON → Native host (Java/UCanAccess)
→ SQL → TntConnect .mpddb

The add-on extracts email metadata and body from Thunderbird, cleans the
body, and sends it to a native messaging host via JSON over
stdin/stdout. The native host writes the history entry to the TntConnect
Access database.

### Prerequisites

- Node.js v18+
- Java 17+
- Maven 3.8+
- Thunderbird (for running the add-on)

### Build

#### Add-on

```bash
cd addon
npm install
npm run build
```

This produces the built files in `addon/dist/`.

#### Package for distribution

```bash
cd addon
npm run package
```

This creates `addon/dist/TntConnectMailImport.zip` containing the built
add-on files.

#### Native host

```bash
cd native-host
mvn package
```

This produces `target/tntconnect-native-host.jar` (uber-jar including
UCanAccess).

### Install

#### Native host (Linux)

1. Copy the shell wrapper and JAR to a permanent location:

    ```bash
    sudo cp native-host/tntconnect-native-host /usr/local/bin/
    sudo cp native-host/target/tntconnect-native-host.jar /usr/local/lib/
    ```

2. Copy the manifest to the Thunderbird native messaging hosts
   directory:

    ```bash
    mkdir -p ~/.mozilla/native-messaging-hosts/
    cp native-host/native-manifest.json ~/.mozilla/native-messaging-hosts/tntconnect_mail_import.json
    ```

3. Update `path` in the manifest if the wrapper/JAR are installed
   elsewhere.

#### Thunderbird add-on

1. Open Thunderbird → Menu → Add-ons and Themes → Settings (gear) →
   Debug Add-ons
2. Click "Load Temporary Add-on"
3. Select `addon/public/manifest.json`

#### Thunderbird as flatpak

When running Thunderbird as a flatpak, there are a few additonal steps
required:

```bash
mkdir -p ~/.var/app/org.mozilla.thunderbird_esr/.thunderbird/native-messaging-hosts
cp native-host/native-manifest.json ~/.var/app/org.mozilla.thunderbird_esr/.thunderbird/native-messaging-hosts/tntconnect_mail_import.json
```

In the Thunderbird Config Editor (Edit/Settings/General/Config Editor), set
`widget.use-xdg-desktop-portal.native-messaging` to `1`.

### Test

#### Add-on unit tests

```bash
cd addon
npm test
```

#### Native host unit tests

```bash
cd native-host
mvn test
```

## License

MIT
