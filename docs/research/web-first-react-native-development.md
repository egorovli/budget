# Web-first React Native development

Research date: 2026-08-13

## Question

Can Sort of Budget use Expo web as the default development and testing surface for
roughly 80% of day-to-day work, while keeping iOS simulator and device checks
for the behavior that only native can validate? If so, what should replace
SQLite and other native services in the browser?

## Recommendation

Yes. Use the browser as Sort of Budget's **fast development surface**, not as an
approximation that is allowed to silently pass for iOS.

The recommended split is:

```text
shared domain, use cases, routes, and most screen components
                         |
                  capability ports
                         |
          +--------------+--------------+
          |                             |
      native adapters                 web adapters
      Expo SQLite                     Dexie / IndexedDB
      CloudKit module                 explicit sync-unavailable adapter
      SecureStore / Keychain          explicit secure-store-unavailable adapter
      Files / share sheet             browser file import and download
      native tabs                     web tab shell
```

The browser should run with deterministic synthetic data by default. It should
exercise the same domain commands, calculations, validation, route bodies, and
repository contract as native. It must not claim to validate native storage,
CloudKit, secure storage, navigation chrome, gestures, keyboard behavior, or
performance.

For persistence, implement a domain-shaped asynchronous port with:

- Expo SQLite on iOS and Android;
- Dexie over IndexedDB on web;
- an in-memory implementation only for small unit tests and instantly seeded
  demos.

Do **not** expose SQLite queries through the application as the cross-platform
abstraction. Different storage engines behind a behavioral contract are less
coupled and make their semantic differences testable. A shared contract suite,
run against every real adapter, is what establishes parity.

This approach fits the accepted iOS-first ADR: iOS remains the release target,
while shared TypeScript remains easy to inspect and exercise. It also preserves
the project's no-EAS boundary: native development builds and release checks use
local Expo/Xcode commands.

## Current repository fit

Sort of Budget is already close to this shape:

- `packages/mobile` uses Expo SDK 57, React Native 0.86, React Native Web 0.21,
  Expo Router, Metro web output, and a `web` script.
- `app.json` already declares a static Metro web build.
- route files are lean and re-export screen bodies from `src/screens`, which is
  a good separation for sharing screen code.
- `src/index.web.ts` is already a dedicated web entry point.
- the current prototype has no persistence, CloudKit, secure storage, file I/O,
  or other application-level native service. The seams can therefore be
  introduced before they are coupled to screens.
- the current Book tabs layout uses `NativeTabs`. Expo documents that native
  tabs use native system bars on iOS/Android and only a basic fallback on web;
  it explicitly supports a web-specific layout using `expo-router/ui` while
  keeping the same routes on native. [Expo: custom web layout for native tabs](https://docs.expo.dev/router/advanced/native-tabs/#custom-web-layout)

One existing performance cost is worth revisiting before treating web startup
as the fast loop: `src/index.web.ts` waits for `LoadSkiaWeb()` before mounting
the router, although the current prototype does not import Skia in its screens.
React Native Skia documents that web uses a CanvasKit WASM payload of about 2.9
MB compressed and supports component-level code splitting instead of blocking
root registration. Defer Skia loading to the first chart that needs it, or omit
it from the initial web path until charts exist. [React Native Skia: web support](https://shopify.github.io/react-native-skia/docs/getting-started/web/)

## Why web can cover most iteration

Expo's web workflow uses React Native Web and applies the same Fast Refresh,
debugging, environment, and Metro workflow across platforms. Expo Router shares
the file-based route graph across native and web, while allowing explicitly
platform-specific modules and layouts. [Expo: develop websites](https://docs.expo.dev/workflow/web/)
[Expo Router: platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)

That makes the browser suitable for frequent work on:

- financial rules and derived totals;
- domain validation and error states;
- CRUD workflows through the repository port;
- the Book-scoped route graph, links, route parameters, and deep-link-like URL
  entry;
- screen composition, copy, loading/empty/error states, accessibility semantics,
  responsive layout, and keyboard/mouse input;
- import/export format validation;
- most visual iteration where native chrome is not the subject of the change.

React Native Web implements the core React Native components on top of React
DOM and supports accessible HTML and multiple input modes. It also documents
real compatibility gaps, so web parity should be stated per capability rather
than assumed globally. [React Native Web: overview](https://necolas.github.io/react-native-web/)
[React Native Web: compatibility](https://necolas.github.io/react-native-web/docs/react-native-compatibility/)

## Persistence decision

### Preferred: Expo SQLite native, Dexie/IndexedDB web

IndexedDB is the browser's asynchronous transactional store for structured,
indexed data. It is more appropriate for ledger-sized structured data than
`localStorage`, which is synchronous and blocks JavaScript during reads and
writes. [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[MDN: Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

Dexie is a small IndexedDB wrapper that adds Promise-based operations,
versioned schemas, queries, transactions, and explicit error propagation. Its
transaction Promise resolves only after commit and rejects on abort. A critical
constraint is that a Dexie transaction should perform database work only;
unrelated asynchronous operations such as network calls can let the browser
commit the IndexedDB transaction early. Resolve exchange rates or other remote
inputs before entering the local transaction, then atomically persist the
complete financial operation. [Dexie: API reference](https://dexie.org/docs/API-Reference)
[Dexie: transactions](https://dexie.org/docs/Dexie/Dexie.transaction())

This option is preferred because it:

- needs no SQLite WASM startup or cross-origin-isolation server headers;
- uses a stable browser-native storage substrate;
- supports the atomic multi-record writes Sort of Budget requires;
- makes the web adapter clearly different from, and therefore unable to mask,
  native SQLite-specific behavior;
- remains replaceable behind the shared contract.

The cost is maintaining two small persistence implementations. That is
acceptable only if the port is kept at the domain/application boundary and both
implementations run the same contract tests. Duplicating SQL-shaped repositories
or leaking Dexie collections into screen code would make the cost unjustified.

### Alternative: Expo SQLite on web

Expo SQLite presents almost the same SQLite API on web and supports database
serialization, which is attractive for implementation reuse. It is not the
recommended default today because Expo still labels web support **alpha**. Web
setup requires WASM handling and `SharedArrayBuffer`, plus COOP/COEP headers in
deployed environments. [Expo SQLite: web setup](https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup)

There is also a correctness-relevant API difference: Expo documents that
`withTransactionAsync()` is non-exclusive and may be interrupted by other
asynchronous queries, while `withExclusiveTransactionAsync()` is not supported
on web. SQLCipher support is limited to Android, iOS, and macOS. These are poor
defaults for making an alpha browser implementation the primary validation of
atomic financial writes. [Expo SQLite: transactions](https://docs.expo.dev/versions/latest/sdk/sqlite/#withtransactionasynctask)
[Expo SQLite: SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/#sqlcipher)

Expo SQLite web remains worth a **bounded parity spike later**. If a future SDK
marks it stable and it passes Sort of Budget's persistence contract, the web adapter
can change without changing domain or screen code.

### Not suitable: `localStorage` or AsyncStorage-shaped entity storage

`localStorage` is string-only, synchronous, and limited to a small per-origin
quota. It is suitable for disposable presentation preferences, not a financial
ledger or an atomic multi-entity operation. The same argument applies to
modeling the ledger as a collection of unrelated key/value values simply to
share an AsyncStorage-like API. [MDN: storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### In-memory storage

An in-memory adapter is useful for:

- pure use-case tests;
- Storybook-like screen states, if introduced;
- deterministic seed/reset in browser previews;
- tests for adapter-independent behavior and failure injection.

It is not a substitute for browser or SQLite integration tests because it does
not reproduce transactions, indexes, migrations, quotas, process restarts, or
database errors.

## The storage port

Prefer one explicit transaction boundary over a large generic CRUD surface. An
illustrative shape is:

```ts
interface BookStore {
  readBook(bookId: BookId): Promise<BookSnapshot | null>;
  observeBook(bookId: BookId, listener: () => void): Unsubscribe;
  transact<T>(
    bookId: BookId,
    operation: (transaction: BookTransaction) => Promise<T>
  ): Promise<T>;
  exportBook(bookId: BookId): Promise<PortableBookBackup>;
  restoreBook(backup: PortableBookBackup): Promise<BookId>;
}
```

`BookTransaction` should expose domain operations or repositories, not raw SQL
or IndexedDB tables. Its callback must only await operations supplied by the
transaction; fetches and OS prompts happen before it. Exact names should follow
the eventual domain module, but the behavioral guarantees should be fixed now:

- all writes for a transfer commit or roll back together;
- spending from a reserve creates the expense and reserve adjustment together;
- stable IDs and uniqueness rules make retries idempotent;
- delete and edit cannot leave dependent balances or reserves stale;
- reads used for a decision and the resulting writes share the required
  transaction boundary;
- all stored money uses exact domain representations, never binary floating
  point merely because IndexedDB accepts JavaScript numbers;
- every migration is versioned, forward-tested, and failure-safe;
- restore validates the whole portable backup before replacing or merging data.

The portable backup should be a versioned domain format shared by both adapters,
not a raw SQLite database or a Dexie export. Raw engine export can remain a
diagnostic tool, but it does not satisfy user ownership or cross-platform
restore.

### Contract tests

One adapter contract should be instantiated against:

1. the in-memory adapter for very fast feedback;
2. Dexie in a real Playwright browser, including WebKit;
3. Expo SQLite in the iOS development build or native integration harness.

At minimum, the contract should cover:

- create/read/update/delete and deterministic ordering;
- duplicate command and sync replay behavior;
- transfer atomicity;
- expense-plus-reserve-adjustment atomicity;
- rollback on a mid-operation failure;
- uniqueness and referential integrity;
- migration from every supported schema version;
- close/reopen persistence;
- full export, destructive reset, restore, and derived-state equivalence;
- quota/storage failure surfaced without reporting a successful save.

SQLite foreign-key enforcement must be enabled per connection; SQLite documents
that it is disabled by default. Native migrations should also run an integrity
check in tests and before accepting a restored database. [SQLite: foreign keys](https://www.sqlite.org/foreignkeys.html#fk_enable)
[SQLite: integrity_check](https://www.sqlite.org/pragma.html#pragma_integrity_check)

## Other platform seams

Use platform-specific files for meaningful differences, such as
`book-store.native.ts` and `book-store.web.ts`. Expo Router supports `.native`,
`.ios`, `.android`, and `.web` modules outside `src/app`; inside `src/app`, a
platform-specific route must have a non-platform route too so that route identity
remains universal. [Expo Router: platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)

Keep `src/app` as route wiring. Put platform adapters and platform UI shells
outside it.

### Navigation shell

- Shared: route names, parameters, links, screen bodies, and application state.
- Native: `NativeTabs`, native stack headers, gestures, sheets, and back behavior.
- Web: `expo-router/ui` headless tabs or a small responsive web shell.

This is not duplicated product navigation: it is two renderers for the same
route graph. Tests should assert route reachability on both, while simulator
checks own the native transitions and header behavior.

### Sync

Define a `SyncGateway` independently of local persistence:

- native: the future local Expo module for CloudKit;
- web development: an explicit `UnavailableSyncGateway` with visible capability
  state, or a deterministic fake in a dedicated scenario;
- tests: scripted success, conflict, retry, offline, and duplicate-delivery
  adapters.

Do not silently return success on web. The UI should say that sync is unavailable
in the web development client when that path is reached.

Apple does provide CloudKit JS access to the same public and private databases
as an iOS/macOS CloudKit app, but it requires enabling web services, tokens, and
web authentication. That is a possible future production-web adapter, not a
requirement for a fast local UI loop; adding it now would expand the security and
sync scope prematurely. [Apple: CloudKit JS](https://developer.apple.com/documentation/cloudkitjs)

### Secrets and authentication

Define a small `SecretStore`/authentication capability:

- native: Keychain-backed `expo-secure-store` or the security design chosen for
  the CloudKit module;
- web development: explicitly unavailable, or ephemeral memory for non-secret
  test values only.

Expo states that there is no web equivalent to SecureStore's native encrypted
SharedPreferences/Keychain behavior. Never put production secrets, sync tokens,
or encryption keys in IndexedDB or `localStorage` to make a test pass. [Expo: storing authentication data](https://docs.expo.dev/guides/authentication/#storing-data)

Biometric/keychain behavior needs a real-device test: Expo notes that simulators
do not reproduce biometric authentication for retrieving SecureStore values.
[Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

### Import, export, and sharing

Keep serialization and validation shared, then adapt transport:

- native: document picker plus file-system/share-sheet adapter;
- web: browser `File` input/document picker for import and a generated `Blob`
  download for export;
- both: the same versioned backup parser, validation, checksum, and restore
  semantics.

Expo DocumentPicker supports web but requires user activation and cannot reliably
report cancellation on every browser. Expo Sharing uses the Web Share API on
HTTPS and cannot share local file URIs on web, so a download adapter is the
portable browser fallback. [Expo DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
[Expo Sharing: web limitations](https://docs.expo.dev/versions/latest/sdk/sharing/#sharing-limitations-on-web)

### Small native effects

Haptics, notifications, app lifecycle, permissions, status bar, and OS dialogs
should have narrow capability ports or platform components where they affect a
workflow. A web preview may provide a visible no-op or browser equivalent, but it
must not be used as evidence that native behavior works.

Avoid abstracting ordinary React Native primitives merely because they render
through React DOM on web. Add a seam only where behavior, security, or lifecycle
actually differs.

## Security and recovery rules for browser development

Browser storage is scoped to an origin, best-effort by default, and may be
evicted under storage pressure. Private-browsing data is usually deleted when
the private session ends. A site can request persistent storage through
`navigator.storage.persist()`, but the browser may deny it. Therefore IndexedDB
must not be described as a backup or the sole durable copy of real financial
data. [MDN: quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
[MDN: persistent storage request](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)

For the development client:

- seed synthetic books by default;
- display a persistent `WEB DEVELOPMENT DATA` indicator;
- provide deterministic reset and reseed;
- never prefill real account names, balances, credentials, or production
  exports;
- never log record payloads or export contents;
- treat browser extensions and XSS as able to read unencrypted origin data;
- if a future real web product is proposed, write a separate threat model and
  ADR before allowing real data.

These restrictions are what let the browser improve development speed without
weakening the project's first principle.

## What web does not validate

Web cannot sign off:

- native tabs, stack headers, transition gestures, sheets, or back behavior;
- iOS safe areas, status bar, dynamic type, native accessibility focus, and
  VoiceOver behavior;
- keyboard avoidance, focus dismissal, numeric keyboard, paste/autofill, and
  amount-entry ergonomics on a phone;
- touch target feel, haptics, long press, swipe actions, and scroll physics;
- Expo SQLite, SQLCipher, migration, locking, file location, or crash recovery;
- CloudKit account, offline, conflict, subscription, or duplicate-delivery paths;
- Keychain, biometrics, permissions, Files, or share sheets;
- Hermes/native-module compatibility, memory use, launch time, JS/UI thread
  stalls, or production rendering performance.

React Native Web specifically documents mocks or gaps for APIs such as
`KeyboardAvoidingView`, `StatusBar`, `BackHandler`, `RefreshControl`, momentum
scroll events, and parts of text input behavior. These are native-check triggers,
not reasons to give up the web loop. [React Native Web: compatibility](https://necolas.github.io/react-native-web/docs/react-native-compatibility/)

## Testing model and cadence

The useful target is not a literal coverage percentage. It is a **fast default
loop with explicit native triggers**.

### Every change or in watch mode

- type checking and linting;
- pure domain tests for all financial invariants and edge cases;
- application/use-case tests against the in-memory port;
- component tests with `jest-expo` and React Native Testing Library;
- route integration tests with `expo-router/testing-library`;
- repository contract tests that are cheap enough for the current adapter.

Expo's supported Router test library provides an in-memory route file system and
pathname/parameter matchers on top of React Native Testing Library. These tests
remain JavaScript tests; React Native's testing guide warns that they cannot find
bugs in the native platform implementation. [Expo Router: testing](https://docs.expo.dev/router/reference/testing/)
[React Native: testing overview](https://reactnative.dev/docs/testing-overview)

### Most interactive product work

- from `packages/mobile`, run `bun run web`;
- use browser Fast Refresh and responsive phone-sized viewports;
- keep a small Playwright suite for the first working slice: create account,
  allocate reserve, record purchase, spend from reserve, export, reset, restore;
- use Chromium for the fastest local loop and WebKit as an additional browser
  persistence/layout check.

Playwright runs Chromium, WebKit, and Firefox locally and provides auto-retrying
web assertions. It verifies the web client only, not iOS. [Playwright: introduction](https://playwright.dev/docs/intro)
[Playwright: assertions](https://playwright.dev/docs/test-assertions)

### Native-triggered checks

Run the simulator immediately, rather than waiting for release, whenever a
change touches:

- a native dependency, app config, Expo SDK, local Expo module, or generated
  native project;
- the native navigation shell, headers, sheets, gestures, safe areas, or status
  bar;
- amount entry, keyboard behavior, scrolling, animation, or haptics;
- SQLite schema/migrations, transaction handling, backup/restore, or CloudKit;
- secure storage, permissions, file/document picker, sharing, links, lifecycle,
  or notifications;
- a performance path where browser timings are not representative.

Independently of those triggers, run the first working slice natively at least
once per vertical slice (or weekly while a slice spans longer), so divergence is
found while the context is fresh.

### Before release

- run all domain, application, route, browser, and adapter contract tests;
- install a locally built release-style iOS artifact;
- run native end-to-end smoke tests for the vital financial scenarios, migration,
  offline persistence, export, and restore;
- test security/hardware paths on a real device;
- manually inspect the fastest transaction-entry path and the resulting free
  balance, because this is the main product risk.

## Making native checks less painful

The simulator should not require a full native compilation for ordinary
TypeScript and React changes. Build and install the local development client once
with `npx expo run:ios`. After that, keep the simulator booted when convenient
and use `npx expo start`; the installed client loads JavaScript from Metro and
receives Fast Refresh updates.

Expo says a rebuild is required when native code/dependencies change, app config
changes, or the Expo SDK changes—not for ordinary JavaScript/TypeScript edits.
This keeps native checkpoints much lighter while retaining the no-EAS workflow.
[Expo: local development build and rebuild rules](https://docs.expo.dev/develop/development-builds/introduction/#rebuild-when-native-code-changes)

## Incremental adoption plan

### 1. Establish the fast UI loop

- document `web` as the default interactive development command;
- add a web-specific Book tabs shell while preserving the shared route graph;
- stop blocking initial web mount on Skia; load it only for screens that use it;
- add a visible web-development-data banner and deterministic fixture seed.

Exit criterion: the complete current route prototype is usable from a cold
browser start without native-only warnings pretending to succeed.

### 2. Build the domain and contracts before durable storage

- implement the first working slice as pure domain commands and queries;
- introduce the minimal `BookStore` transaction port;
- add the in-memory adapter and contract tests;
- keep screens dependent on application queries/commands, not adapter APIs.

Exit criterion: the tax-reserve, purchase, reserve-spend, and transfer invariants
pass without React, browser, or SQLite.

### 3. Add the real web adapter

- implement Dexie with versioned schema and atomic operations;
- run the persistence contract in real Chromium and WebKit;
- add explicit storage-unavailable/quota/full errors;
- implement shared portable export and restore through browser files.

Exit criterion: browser close/reopen, edit/delete, rollback, reset, export, and
restore reproduce the same derived Book state.

### 4. Add the native adapter early

- implement Expo SQLite behind the same port;
- enable foreign keys and use the exclusive transaction API for related writes;
- run the same contract on iOS, including migrations and reopen;
- keep one installed local development client and use Metro for ordinary edits.

Exit criterion: the first working slice passes on iOS SQLite before beginning
the next major vertical slice.

### 5. Add native capabilities one at a time

- introduce `SyncGateway`, `SecretStore`, and file/share adapters only as their
  vertical slices require them;
- give web explicit unavailable or deterministic fake implementations;
- add a native smoke test with every capability.

Exit criterion: no browser fallback can claim a native security, sync, or OS
operation succeeded when it did not run.

### 6. Reassess after measured use

Track:

- browser cold-start and Fast Refresh time;
- how often native checks are triggered;
- defects found only on native;
- duplicate code and contract-test cost between Dexie and SQLite;
- time to run the first working slice on web and native.

If web catches most shared defects and native divergence is found within each
vertical slice, the workflow is working. If native-only failures accumulate,
increase native cadence or deepen the relevant adapter contract rather than
abandoning the fast web loop.

## Decision summary against project principles

1. **Security:** synthetic web data, explicit unavailable secure capabilities,
   no secrets in browser storage, and no claim that IndexedDB is a backup.
2. **Correctness:** pure domain invariants, explicit atomic transaction port,
   and one behavioral suite against Dexie and SQLite.
3. **Recoverability:** one validated, versioned domain backup format that can
   cross storage engines.
4. **UI/UX:** browser Fast Refresh for frequent iteration, with native keyboard,
   navigation, accessibility, and touch checkpoints before divergence grows.
5. **Performance:** remove unconditional Skia startup from the main web loop and
   measure native performance only on native.
6. **Simplicity:** add only a small set of capability seams; do not fork screens,
   routes, or domain logic by platform.

The practical conclusion is: **adopt web-first development, but not web-only
validation**. Dexie is the best current browser persistence adapter; Expo SQLite
remains the native store and a possible future web replacement after it is
stable and contract-proven.
