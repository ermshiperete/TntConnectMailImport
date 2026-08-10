# Thunderbird → TntConnect Email Import Add-on (TDD Plan)

## Goal
Build a Thunderbird WebExtension that lets users right-click an email and import it into TntConnect as a history entry. Use the sender's email address to find the contact, the subject as the history description, and the cleaned email body as the note.

## Architecture
Thunderbird WebExtensions (Manifest V3) cannot directly access ODBC/JDBC, so the add-on is split into two parts:

1. **Thunderbird add-on** (TypeScript → JS WebExtension MV3)  
   Handles UI, context menu, email extraction, and body cleaning.
2. **Native messaging host** (Java + UCanAccess)  
   Handles all reads/writes against the `.mpddb` Access database. Communicates with the add-on over JSON via stdin/stdout.

Communication flow:
```
Thunderbird add-on  --JSON-->  Native host  --SQL-->  TntConnect .mpddb
```

## Verified facts (from TntConnect docs + MIST source)
- Database is Access 2000 format (`.mpddb`), password is `tntMPD`.
- UCanAccess JDBC URL: `jdbc:ucanaccess://<path>;immediatelyReleaseResources=true;openExclusive=true;`
- Key tables: `Contact`, `History`, `HistoryContact`, `TaskType`
- Email fields in Contact: `Email1`, `Email2`, `Email3`, `SpouseEmail1`, `SpouseEmail2`, `SpouseEmail3`
- `TaskType.EMAIL = 100`
- `History.Description` max length = 150
- `History` fields used: `HistoryID`, `TaskTypeID`, `Description`, `HistoryDate`, `Notes`, `HistoryResultID`, `LastEdit`, `LoggedByUserID`, `InMPDWeeklyUpdate`, `IsChallenge`, `IsThank`, `IsMassMailing`, `AutoGenCode`, `DataChangeLogAsCsv`, `PledgeChangeAmount`, `PledgeChangeCurrencyID`, `BasePledgeChangeAmount`, `BaseCurrencyID`
- `HistoryContact` fields: `HistoryContactID`, `LastEdit`, `HistoryID`, `ContactID`
- IDs are random integers; must check uniqueness before insert.
- `LastEdit` must be updated for TntSync to detect changes.
- For EMAIL task type, MIST calls `ContactManager.updateLastLetterDate()`.
- History duplicate check: same `ContactID` + `TaskTypeID` + `HistoryDate` + `HistoryResultID` = duplicate.

## Technology decision: Native host language
**Decision: Java + UCanAccess.**

The native host must write to `.mpddb` (Access 2000) on Linux. Evaluated options:
- **Java + UCanAccess**: Free, open-source, cross-platform, proven by MIST and TntConnect docs. Chosen.
- **TypeScript/Node.js + ODBC**: No free Access ODBC driver exists for Linux. `node-odbc` requires a system driver; ACE is Windows-only. Not viable.
- **.NET Core + ODBC**: Same driver problem. `System.Data.OleDb` is Windows-only on .NET Core; no Linux Access ODBC driver. Not viable.
- **.NET Core + commercial ODBC (Devart)**: Works but introduces a paid dependency unsuitable for a free ministry tool.

The native host language is invisible to users (JSON over stdio), so there is no functional downside to Java.

## Decisions (resolved)
1. **HistoryResultID**: Auto-detect: `RESULT_RECEIVED (2)` for received mail, `RESULT_DONE (1)` for sent mail. Check if message author matches a configured Thunderbird identity. Matches MIST behavior.
2. **Duplicate email contacts**: Fail with error.
3. **Contact not found**: Fail with error.
4. **Description truncation**: Truncate to 147 + `...`.
5. **Quoted reply stripping**: Simple regex-based heuristics.

## Project structure
```
TntConnectMailImport/
  addon/
    src/
      background.ts
      api/
        native.ts
        messages.ts
      cleaner/
        bodyCleaner.ts
      types.ts
    tests/
      unit/
        bodyCleaner.test.ts
        messageExtractor.test.ts
        nativeClient.test.ts
      integration/
        nativeHost.test.ts
    manifest.json
    package.json
    tsconfig.json
    vite.config.ts
  native-host/
    src/
      Main.java
      TntDatabase.java
      ContactManager.java
      HistoryManager.java
      models/
        Contact.java
        History.java
    tests/
      unit/
        ContactManagerTest.java
        HistoryManagerTest.java
        NativeProtocolTest.java
      integration/
        DbIntegrationTest.java
    build.gradle
    lib/
    native-manifest.json
```

## Testing strategy
- **Addon unit tests**: Vitest. Mock `browser.*` APIs.
- **Native host unit tests**: JUnit 5. Use in-memory HSQLDB or temp copies of demo `.mpddb` for integration tests.
- **Integration tests**: Spin up native host as subprocess, send JSON messages, verify DB state against demo database.

## Step-by-step implementation plan (TDD)

### 1. Initialize add-on scaffolding + test framework
- Create `addon/package.json` with `vitest`, `@types/thunderbird`, `vite`, `webextension-polyfill`.
- Create `manifest.json` (MV3) requesting `messagesRead` and `nativeMessaging` permissions.
- Configure Vite to build the WebExtension into `dist/`.
- Verify `vitest` runs and test discovery works.

### 2. Implement `bodyCleaner.ts` (TDD)
- Write tests first in `addon/tests/unit/bodyCleaner.test.ts`:
  - Strips `-- ` signature delimiter
  - Strips `___` delimiter
  - Strips quoted lines starting with `>`
  - Strips `On ... wrote:` quoted reply headers
  - Trims trailing whitespace
  - Edge cases: empty string, no signature, multiple signatures
- Run tests — they fail.
- Implement `addon/src/cleaner/bodyCleaner.ts` to pass all tests.
- Refactor if needed.

### 3. Implement `messages.ts` (TDD)
- Write tests first in `addon/tests/unit/messageExtractor.test.ts`:
  - Mocks `browser.messages.getFull`, `listInlineTextParts`, `convertToPlainText`
  - Verifies extraction of `author`, `subject`, `date`
  - Verifies body extraction prefers inline text parts
  - Verifies fallback to plain text conversion
  - Verifies identity matching (sent vs received)
- Run tests — they fail.
- Implement `addon/src/api/messages.ts` to pass all tests.
- Refactor if needed.

### 4. Implement `native.ts` (TDD)
- Write tests first in `addon/tests/unit/nativeClient.test.ts`:
  - Mocks `browser.runtime.connectNative`
  - Verifies JSON message framing
  - Verifies response parsing
  - Verifies error handling / port disconnect
- Run tests — they fail.
- Implement `addon/src/api/native.ts` to pass all tests.
- Refactor if needed.

### 5. Implement `background.ts` (TDD)
- Write tests first in `addon/tests/unit/background.test.ts`:
  - Mocks `browser.runtime`, `browser.menus`, `browser.notifications`
  - Verifies context menu creation on install
  - Verifies click handler orchestrates: extract → clean → send to native host → notify
  - Verifies error paths (no contact found, DB locked)
- Run tests — they fail.
- Implement `addon/src/background.ts` to pass all tests.
- Refactor if needed.

### 6. Build native messaging host Java scaffolding + test framework
- Create Gradle build with JUnit 5.
- Verify test discovery works.

### 7. Implement `ContactManager.java` (TDD)
- Write tests first in `native-host/tests/unit/ContactManagerTest.java`:
  - `findContactByEmail` exact match in Email1
  - `findContactByEmail` exact match in SpouseEmail2
  - `findContactByEmail` no match returns null
  - `findContactByEmail` multiple matches throws exception
- Run tests — they fail.
- Implement `native-host/src/ContactManager.java` against demo `.mpddb`.
- Refactor if needed.

### 8. Implement `HistoryManager.java` (TDD)
- Write tests first in `native-host/tests/unit/HistoryManagerTest.java`:
  - `createHistory` inserts row with correct fields
  - `createHistory` generates unique HistoryID
  - `createHistory` updates LastEdit
  - `createHistory` creates HistoryContact row
  - `createHistory` updates Contact.LastLetter for EMAIL task type
  - `createHistory` detects duplicates and returns existing
- Run tests — they fail.
- Implement `native-host/src/HistoryManager.java`.
- Refactor if needed.

### 9. Implement `Main.java` (native protocol) (TDD)
- Write tests first in `native-host/tests/unit/NativeProtocolTest.java`:
  - Reads length-prefixed JSON from stdin
  - Writes length-prefixed JSON to stdout
  - Handles `importEmail` action
  - Returns success response with historyId
  - Returns error response on missing contact
- Run tests — they fail.
- Implement `native-host/src/Main.java` to pass all tests.
- Refactor if needed.

### 10. Integration tests
- Write `native-host/tests/integration/DbIntegrationTest.java`:
  - Spin up `Main` as subprocess against demo `.mpddb`.
  - Call `findContactByEmail` with known addresses, verify results.
  - Call `createHistory`, verify row appears in DB.
  - Clean up test inserts.
- Run and verify pass.

### 11. Native messaging host manifest & packaging
- Create `native-manifest.json`.
- Write install instructions for Linux (`~/.mozilla/native-messaging-hosts/`) and Windows (registry).
- Create shell wrapper that invokes `java -cp ... Main`.

## Test coverage targets
- Addon unit tests: 100% of `bodyCleaner.ts`, `messages.ts`, `native.ts`, `background.ts` logic.
- Native host unit tests: 100% of `ContactManager`, `HistoryManager`, `Main` logic.
- Integration tests: At least one end-to-end flow against demo database.
