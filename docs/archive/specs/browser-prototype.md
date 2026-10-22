# Sort of Budget: working browser prototype

Date: 2026-10-08
State: functional implementation complete; native file UI validation and audit finding 1 remain open

## Outcome

Build a locally stored, interactive prototype in the existing Expo application. Develop in the browser. Check the first complete flow on iOS before extending it. The prototype must answer: **Can a person record an Expense quickly, find it later, and understand its effect on an Account?**

Deliver the milestones below in order. Finish a usable Expense flow before building the remaining features. The end result is a functional prototype for personal use and evaluation, not a production release. Keep the implementation small enough to change after feedback.

## Read first

- [Project instructions](../../AGENTS.md) and [principles](../../docs/principles.md).
- [Active glossary](../../GLOSSARY.md), which owns the domain definitions.
- [Expo decision](../../docs/adr/0001-expo-react-native-ios-first.md), [Book boundary](../../docs/adr/0003-book-is-the-financial-and-sharing-boundary.md), and [exchange-rate decision](../../docs/adr/0004-provider-agnostic-exchange-rate-module.md).
- [Personal iCloud decision](../../docs/adr/0002-personal-icloud-sync-before-family-sharing.md): sync remains a later production requirement. Its omission here is a prototype scope limit, not a reversal of the ADR.
- When working with private data, read [the normalized seed contract](../../assets/seed/normalized/README.md) before reading `seed.json`.

This plan defines the current prototype scope. Older MVP documents and existing mock screens contain broader features. Use them as references only where this plan calls for them. Preserve unrelated working-tree changes.

## Scope and defaults

Implement:

- One active Book, selected when starting the prototype, with a base currency.
- Accounts with one currency and a dated Opening balance.
- Create, view, edit, and remove manual Income and Expense Transactions.
- Same-currency and cross-currency Transfers.
- Categories with unlimited parent nesting; Counterparties as a separate directory.
- Account activity, Book activity, search, and a small spending summary.
- Exact monetary values, original purchase amounts, and recorded historical rates.
- Local persistence, export, restore, and explicit reset.
- A local preview of the supplied bank seed.
- Simulated incoming capture with review before saving.
- An optional location field and a simulated consent flow for Expenses.

Use English interface copy, consistent with the existing screens. Use the existing styling and phone-sized layout as the starting point. Improve the interaction as needed; a visual redesign is not part of this work.

Later work: production bank connections, Apple Shortcuts capture, real push delivery, background processing, local models, automatic merchant matching, real device location, map tiles, cloud sync, family sharing, budgeting/Reserves, valuation Accounts, recurring payments, split Transactions, and production deployment. Keep these as future directions. Do not add placeholder frameworks for them.

The default demo must use synthetic data. Private statement data is loaded explicitly from a local file and stays on the device. Keep it out of source control, generated bundles, screenshots for sharing, telemetry, and external model requests.

## Existing code to reuse

Verified during planning:

| Area | Starting point | Required change |
| --- | --- | --- |
| Commands and dependencies | `packages/mobile/package.json` | Use the existing `web`, `ios`, `types:check`, and lint scripts; use Bun. |
| Routing | `packages/mobile/src/app/books/[book-id]/` | Keep route wrappers and parameter conventions. Resolve real IDs and handle missing records. |
| Route helpers | `packages/mobile/src/screens/prototype-routes.ts` | Keep helpers; replace sample-ID behavior in working flows. |
| Accounts | `packages/mobile/src/screens/prototype-accounts.tsx` | Replace fixed rows and balances with local data. |
| Activity and details | `packages/mobile/src/screens/prototype-overview.tsx` | Replace fixed Transactions and totals. |
| Forms | `packages/mobile/src/screens/prototype-forms.tsx` | Convert uncontrolled display fields and navigation-only Save links into validated writes. |
| Categories and Counterparties | `packages/mobile/src/screens/prototype-organization.tsx` | Replace sample directories with editable records. |
| Shared controls | `packages/mobile/src/components/prototype-ui.tsx` | Extend existing controls with controlled values, errors, and action handlers where needed. |
| App state and navigation | `packages/mobile/src/app/_layout.tsx` and the Book tabs layout | Load persisted state before rendering dependent routes. Keep only working prototype features in its main navigation. |

The inspected screens are static. No IndexedDB or SQLite usage was found in `packages/mobile/src` during planning. Recheck this before introducing storage. The app currently uses native tabs and static web output; verify browser routing instead of assuming these work for arbitrary locally created IDs. Leave the separate native UI showcase usable.

## Small technical design

Use shared TypeScript for domain types, validation, monetary calculations, and state changes. Keep React components responsible for interaction and presentation. Use platform files only where storage, file access, or native controls differ. Keep this code inside `packages/mobile/src`; a new workspace package is unnecessary for one application.

Recommended prototype storage:

- IndexedDB in the browser. It supports structured local data and transactions. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- The installed `expo-sqlite` on native. Its data persists across app restarts. Its web implementation currently requires extra setup and is marked alpha, so use the browser platform API for this prototype. [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- A small shared load/commit boundary with platform implementations. A versioned Book snapshot is sufficient at this scale; normalized SQL tables and a generic repository framework are not required.
- Commit the complete next snapshot atomically. Publish it to the UI only after storage confirms success. Serialize writes. Include a revision check in the same storage transaction so a stale browser tab cannot overwrite newer data; on conflict, preserve the draft and request reload/retry.
- Seed only a genuinely empty store. A read error or unknown schema version must show a recovery error and preserve existing data.

This is a proposed prototype design, not a new production architecture ADR. If an existing implementation already meets these requirements, reuse it. Record a concrete reason if a different storage choice is needed.

### Minimum data contract

Use stable IDs. All references must belong to the same Book. Names are editable labels, not identifiers.

| Record | Required information |
| --- | --- |
| Book | ID, name, base currency, schema version and storage revision. |
| Account | ID, Book ID, name, currency, Opening balance and its date. An explicitly unknown opening amount remains unknown. |
| Transaction | ID, Book ID, Account ID, Income/Expense type, positive Posted amount, Transaction date; optional Category ID, Counterparty ID, note, Original amount with currency, rate information, Occurrence time, Expense location. |
| Transfer | ID, Book ID, distinct source and destination Account IDs, positive sent and received amounts in their Account currencies, Transaction date, optional note and rate information. |
| Category | ID, Book ID, name, nullable parent ID. |
| Counterparty | ID, Book ID, name. |
| Expense location | Latitude, longitude, and optional measurement time and accuracy. Include whether the point was simulated. |

Amounts must use an exact representation. A practical default is integer minor units with currency precision, serialized as decimal integer strings. Use checked integer or BigInt arithmetic; do not calculate balances using floating-point currency amounts. Support at least PLN, EUR, USD, RUB, and AMD from the supplied data. Validate precision and reject invalid values without silent rounding.

Rates need explicit direction: for example, `1 EUR = 4.25 PLN`. Preserve the recorded decimal value, currency pair, and date/provenance when known. Original and Posted amounts remain authoritative even if a displayed implied rate is rounded. A rate inferred from amounts must be identified as inferred. Editing a Category or Counterparty must never fetch a new rate or change an amount.

Store Transaction date as a calendar date. Store Occurrence time only when the instant is known. Do not turn a source date or timezone-free local time into an invented UTC instant.

Derive balances from Opening balance plus Income minus Expense plus incoming Transfer amounts minus outgoing Transfer amounts. Define the Opening balance as the balance before the included activity starts on its date. Reject earlier manual activity with a clear explanation. An unknown Opening balance produces a known net movement, not a claimed balance. Opening balances and Transfers are excluded from spending and income summaries.

## Milestone 1: run the existing app and prepare a small demo

1. Record existing type-check, lint, and startup failures before editing. Fix only those that block this work.
2. Start the existing Expo web app. Inspect the Account, Activity, and Transaction form routes.
3. Confirm browser navigation, reload, and direct navigation to a record URL. For exported web output, support runtime-created IDs; use a client-rendered shell if static route generation cannot do this. Record the reason for a web-output change.
4. Prepare deterministic synthetic data: one Book, PLN and EUR Accounts, a short Category tree, a few Counterparties, and several Income/Expense records. Clearly identify it as sample data.
5. Keep broader mock features outside the main working flow. Remove Reserve and valuation controls from the working forms; preserve separate experiments where practical.

**Done:** one documented command starts the browser app; the intended routes load; the initial demo has no misleading fixed financial totals. Document baseline failures separately from introduced failures.

## Milestone 2: complete the Expense flow

1. Add the minimum domain and persistence code needed for Accounts and Expenses. Keep Account currency fixed once activity exists. Support name edits and an explicitly confirmed Opening balance correction.
2. Make the Account list and Account detail show stored values. Add basic Account creation with name, currency, Opening balance, and date.
3. Make the Expense form amount-first. Default the Account from the current screen or last used Account, and the date to today. Category, Counterparty, note, original purchase currency, and location remain optional.
4. Start with selection from the synthetic Category and Counterparty lists. Their full management comes in the next milestone.
5. Save once, await persistence, and navigate to the actual new Transaction. Prevent a double tap from creating two records. On failure, retain the input and show a retryable error.
6. Add Transaction details and editing. Cancel leaves saved data unchanged. Confirm removal of a manual Transaction before deleting it.
7. Recompute the Account balance and Activity after creation, editing, moving the Transaction to another Account, and removal. Moving between currencies requires explicit review of the Posted amount in the destination currency.
8. Add export and validated restore of the working Book snapshot now. Restore replaces the selected prototype dataset only after confirmation. Validate the entire document before writing; failure leaves the previous state unchanged.
9. Run this same basic flow on a local iOS build with persistent native storage. Fix keyboard, scrolling, or browser-only imports before expanding the feature set.

**Done:** create an Expense, reload, edit it, export, restore, and verify the exact Account balance. The flow works in the browser and on iOS, or an exact native environment blocker is recorded without claiming native validation.

## Milestone 3: complete the foundational model and browsing

### Income and Transfers

- Use the Transaction form for Income with clear type selection and correct balance effects.
- Create, inspect, edit, and remove Transfers as one operation. Persist both sides atomically. Show one row in Book Activity, and the relevant side in each Account.
- Same-currency Transfers have equal sent and received amounts. Cross-currency Transfers keep both actual amounts. Display the implied rate with a currency direction.
- Keep transfer fees outside the initial Transfer form. A user can record an explicit separate Expense. Never infer or subtract a fee twice.

### Categories and Counterparties

- Create and rename Categories; select, change, or clear their parent. Reject self-parenting, cycles, and cross-Book references at the domain boundary.
- Impose no product nesting-depth limit. Use iterative traversal. Make deep trees usable with expandable branches or path navigation, search, and a breadcrumb; avoid indefinitely increasing horizontal indentation.
- Allow direct selection of a Category that has children. Distinguish identical names through their full paths. A finite deep-tree test demonstrates behavior; it is not a product maximum.
- Create, rename, search, and select Counterparties. A name match can be suggested but must not merge identities automatically. Allow clearing the association on a Transaction.
- Omit Category, Counterparty, and Account deletion controls for this iteration. Their lifecycle rules are outside the current experiment.

### Activity and summaries

- Show date, amount with currency, Account, and optional Counterparty/Category. Order same-day records deterministically without suggesting an unknown exact time.
- Support Account, date range, Category, and Counterparty filters, plus text search over visible descriptions and notes. A Category filter can include its descendants; label that behavior.
- Provide spending totals per currency for the selected period. Sum parent Categories through all descendants, counting each Transaction once, including those assigned directly to the parent.
- Use the Book base currency only when a stored conversion is available for every included amount. Otherwise show per-currency totals and missing-conversion information. Do not silently treat missing rates as one or zero.
- Keep the main navigation small: Accounts, Activity, and access to Categories, Counterparties, and prototype data controls. A home screen may summarize these real values; it must not retain hardcoded net worth or free-money figures.

**Done:** Income and Transfer effects are correct; nested Categories and Counterparties can be edited without changing money; search and summaries agree with the stored records.

## Milestone 4: use the private bank seed without inventing financial facts

The supplied `seed.json` contains 11 Account sections, 1,728 bank movements, and 39 linked currency exchanges. Its entries are source records, not fully classified domain Transactions. The README documents incomplete histories and balance discrepancies.

For this iteration, provide a **read-only source preview** beside the editable synthetic/manual Book. This lets us inspect realistic data without requiring a general bank import/reconciliation engine before the core interaction is proven.

1. Add an explicit local JSON file picker in prototype data controls. Validate the normalized schema, IDs, references, currency values, dates, and amounts before accepting the file. Report actionable validation errors.
2. Store the loaded source dataset separately from the working Book. Preserve its values, checks, issues, and source references. Replacing it must not reset the working Book.
3. Show all 11 Account sections and all 1,728 movements. Support Account filtering, search, and original/posted amount display with suitable list rendering for this volume.
4. Inspect the 39 exchange links as paired source movements. Keep their 78 source rows intact; do not add 39 extra financial movements. Show unclassified entries as unclassified, regardless of their sign.
5. Show available statement balances with their dates and coverage. For TBank, show net movement rather than a balance. Preserve the Erste EUR discrepancy. Treat zero-entry Aion sections as incomplete history, not proof of a zero asset balance. Do not infer ownership of Kids & Teen sections.
6. Keep source-preview records out of working-Book totals. Label the two datasets clearly. A source detail can expose its reported fee, but that fee does not create a second debit.
7. Add a separate synthetic scale fixture of roughly 2,000 records for automated tests and shared screenshots. Do not anonymize private statements by merely replacing names.

**Done:** the private source file loads locally, counts and exchange links agree with the file, known limitations are visible, and no private source data is in the bundle or Git diff. The interactive flow works independently when this optional file is absent.

**Explicit limit:** this milestone does not turn the complete source dataset into editable financial history. A later import iteration can use the reviewed source model. If evaluation requires editing an actual Expense now, enter it manually in the working Book; do not silently promote a bank movement by its sign.

## Milestone 5: simulate capture and optional location

1. Add a clearly marked prototype control, “Simulate incoming transaction.” Provide fixed synthetic event examples: ordinary purchase, foreign-currency purchase, and incomplete purchase needing an Account.
2. The event supplies a draft. Show an in-app notification that opens it. Also keep a visible pending item so dismissing a toast cannot lose the draft.
3. Let the user review and change fields, then save through the same validated Transaction command as manual entry. Nothing changes the Account balance before confirmation. Support dismissal without saving.
4. Persist pending drafts and a stable event ID. Replaying the same event must not create another pending item or saved Transaction. Keep this specific behavior small; a bank reconciliation framework is unnecessary.
5. Use a simple shared in-app banner/toast first. Sonner is optional for a web-only presentation; keep any DOM dependency out of native imports. Browser notification permissions and push infrastructure are unnecessary for this experiment.
6. Offer an explicit “Add simulated location” action on an Expense. Explain that the point is synthetic. Require the user's action before attaching latitude/longitude; allow removal. Validate coordinate ranges. Income has no Expense location.
7. Render coordinates in details. Capture is optional and must never block saving. Real device permission prompts, location providers, nearby merchant search, and maps remain later work.

**Done:** simulate, review, save, reload, and replay an event; only one Expense exists. A dismissed notification leaves a recoverable draft. Location is absent by default and remains visibly simulated when attached.

## Milestone 6: verify offline use and recoverability

Local data storage and an offline application shell are separate requirements. Fast Refresh in a running browser does not prove offline restart. Expo documents service workers for offline web use and notes their cache-update risks. [Expo PWA guide](https://docs.expo.dev/guides/progressive-web-apps/)

1. Keep the development workflow on Expo Fast Refresh. Register an offline shell only for the exported prototype preview, not the development server.
2. Cache the application assets needed to load and navigate the prototype after an initial successful online load. Bundle required fonts/icons. Give caches versions and a tested update path. Keep financial data in the local database, outside asset caches.
3. Verify offline reload and deep links with a newly created record ID. Ensure the preview server's route fallback and the offline shell both support those URLs.
4. Verify offline create, view, edit, remove, export, restore, and simulated capture. Network failures must not gate these actions.
5. Add explicit “Reset working demo” and “Remove loaded source data” controls with their distinct scopes. Offer export before reset. Reset must never overwrite the original seed file on disk.
6. Test unavailable storage, failed writes, corrupt restore data, unsupported schema version, and stale-tab revision conflicts. Preserve valid saved data and unsaved form input where possible. Never recover by automatically clearing the store.
7. Explain in prototype data controls that browser data can be cleared and export is the recovery path. Do not label the local database or exported file encrypted unless that property is implemented and verified.

**Done:** after one successful load, disconnect and reload the exported prototype. Complete an Expense flow, export it, restore it, reconnect, and verify no data loss. Document the tested browser and the exact cache-update procedure.

## Validation and handoff

Use focused automated tests for domain and persistence behavior, plus browser interaction checks. Reuse an existing test setup if one appears; otherwise Bun tests are sufficient for pure TypeScript. Test storage behavior on the actual platform, not only an in-memory substitute.

Minimum cases:

| Check | Expected result |
| --- | --- |
| PLN Account opens at 1,000.00; Expense 12.34; edit to 20.00; remove | 987.66, then 980.00, then 1,000.00. |
| Add Income of 100.00 | Balance increases exactly 100.00; spending does not change. |
| Send 100.00 EUR; receive 425.00 PLN | Correct change on each Account; no income or spending added; both sides survive reload together. |
| Original purchase 10.00 EUR, Posted amount 43.21 PLN | PLN Account decreases by 43.21; both amounts remain after a Category edit and reload. |
| Parent Category has a direct Expense and child Expenses | Parent aggregate counts each once. Clearing a Category leaves balances unchanged. |
| Move a Category under its descendant | Rejected without changing the tree. Test a synthetic chain of at least 100 levels and a usable deep selection path. |
| Change viewing timezone | Transaction dates remain unchanged. |
| Save twice quickly; replay a capture event | One manual save or one captured Transaction, respectively. |
| Fail a storage write or restore | Previous stored state remains valid; no success feedback; entered form data remains available. |
| Two browser tabs edit the same stored revision | A stale commit is rejected; newer data is preserved. |
| Export, reset, restore | IDs, dates, amounts, references, rates, location, and calculated balances round-trip. |
| Load the private seed | Counts and links match; source data remains outside working totals and bundle assets. |
| Restart the exported app offline | Existing and newly created record routes load; financial actions work. |

Run current type-check and lint scripts for the affected package. Report pre-existing failures separately. Use keyboard navigation and a narrow phone viewport for the core browser flows. Check focus, labels, validation messages, empty/loading/error states, long Counterparty names, deep Category paths, and absence of horizontal overflow. Check the final core flow again on iOS if later changes affected shared components or persistence.

Finish with:

- Commands to run the web prototype, exported offline preview, focused tests, and local iOS app.
- A brief walkthrough of the working flow and how to load the optional private seed.
- Screenshots made with synthetic data only.
- Test results, baseline failures, and exact remaining platform limitations.
- The observations still needing user feedback: speed of Expense entry, findability of Categories/Counterparties, currency clarity, and usefulness of capture review.

Update this spec's state and add a short implementation-results section. If work needs separate tickets, follow the [local tracker format](../../docs/agents/issue-tracker.md), with one file per ticket and a link to this spec. Do not duplicate this specification across tickets. Do not claim a production-ready offline app from prototype checks alone.

## Implementation results

2026-10-08 baseline, before application edits:

- `cd packages/mobile && bun run types:check`: passed.
- `cd packages/mobile && bun run lint`: blocked by the existing nested root configuration at `.worktrees/demand-assets/biome.json`. No configuration migration was performed.
- `cd packages/mobile && bun run web --port 8082`: Metro started after granting local port access. The sandboxed attempt on port 8081 did not reach startup. Expo reported available dependency updates; dependencies were not changed.
- No existing persistence or static parameter generator was found in `packages/mobile/src`.
- Xcode is installed. `xcrun simctl list devices booted` works outside the sandbox; no simulator is currently booted. Native execution has not been checked.
- This was the starting baseline. Subsequent milestone results are recorded below. Unrelated working-tree changes are preserved.

### Milestone 1

Passed: type-check, package lint, focused exact-money test, Expo web export, Account/Activity/Transaction form inspection, direct Account/Transaction navigation and Account reload in Chromium. Run with `cd packages/mobile && bun run web --port 8082`.

Changed web output from `static` to `single`: new local IDs cannot be enumerated at export time. The exported preview must fall back to `index.html`. Replaced fixed overview totals with exact synthetic Account balances. Removed Reserve/valuation controls from the working navigation/forms; their separate experiment routes remain. Biome now excludes `.worktrees` so the existing nested checkout cannot block package lint. Existing visual controls remain the design direction.

### Milestone 2

Passed: exact Expense create/edit/move/remove tests; read/write failure tests; schema rejection; type-check and lint; browser manual Expense saved to a generated ID, reloaded, edited from 12.34 to 20.00, exported and restored with confirmation. Sample PLN balance changed from 1087.66 to 1067.66 and survived restore. Browser file testing bypassed only the headless operating-system chooser; the real File read and validation handlers ran.

Local `bun run ios --device 2F92B47A-12F0-4595-90B5-651826205E2D --port 8082` built and installed successfully. On iPhone 17 Pro / iOS 26.5, created an Expense, edited it to 20.00, terminated/relaunched the app, and verified 1067.66 PLN. Native export/restore UI checks remain pending. Xcode emitted two prebuilt-module script diagnostics but the build succeeded. Fixed platform import resolution so web uses IndexedDB without loading SQLite WASM. Native uses SQLite exclusive transactions. No dependency changes.

### Milestone 3

Passed: focused model tests (6), type-check and lint. Browser created a cross-currency Transfer and verified both actual amounts and directed inferred rate after reload; created a Category and a long-name Counterparty; Activity text search returned one matching Expense and exactly 12.34 PLN spending. Automated tests cover 120 Category levels, parent/direct-child totals without duplication, cycle rejection, Income effects, recorded Original amounts, currency locking, invalid calendar dates, and missing/stored base conversions. Category navigation uses paths and breadcrumbs; selection searches full paths without increasing indentation.

### Milestone 4

Passed: source validation tests, type-check and lint (12 informational notices reflect TypeScript-required bracket access). Loaded the actual private file through the local picker. Browser aggregate checks confirmed 11 sections, 1,728 movements, 39 links, the preserved discrepancy, incomplete histories and net-movement labeling. Working PLN balance stayed 967.66 PLN after the source load. Replaced the loaded preview with the independent synthetic 2,000-row fixture, verified reload and searched its final row. Shared screenshot uses only that fixture. The original seed remains ignored and unchanged; no private values were copied into application assets.

### Milestone 5

Passed: focused capture/location tests, type-check and lint. In Chromium, simulated an ordinary purchase, dismissed its notification, reloaded, reopened the retained draft, explicitly attached simulated coordinates, and double-clicked Save. Its actual record and location survived reload. Replaying the same event created no pending draft; exported data contained exactly one captured Expense. Fixed events also cover foreign currency and a missing Account. Location coordinates are checked at the shared domain boundary; Income cannot carry Expense location.


### Milestone 6 and final checks

- Exported preview passed offline reload of a newly created record URL, Expense create/view/edit/remove, foreign capture, export, reset and restore. Reconnection and explicit cache activation preserved the exact working balance. Development remains on Fast Refresh and registers no service worker.
- Real IndexedDB checks passed: atomic stale-revision rejection, corrupt/unsupported snapshot rejection, refusal to overwrite a future stored schema from an already open older session, unavailable-storage failure without publication, retry and export/reset/restore. Two real Chromium tabs confirmed that a stale draft keeps its input; “Reload saved data and keep input” then permits an explicit retry without losing the other tab's Transaction.
- Reset preserved the separate 2,000-row source fixture. Removing that loaded fixture preserved the working Book. The original seed file remained untouched. The final bundle contains no private movement IDs or source hashes.
- Phone viewport: 390×844. Long Counterparty names and a 120-level Category search path wrap without horizontal overflow. Tab focus reaches labeled inputs with a visible outline. Rate pair editing without changing the numeric value saved the displayed USD/PLN pair. Unknown Opening balance has an explicit control and remains labeled net movement after confirmation.
- Final iOS flow: iPhone 17 Pro / iOS 26.5. Created an Expense with keyboard input, edited it to 20.00, restarted the app and verified 1047.66 PLN. Fixed a native navigation reset by moving Book guards into screens. Tab routes now receive explicit Book parameters. Native export produced a valid JSON snapshot with the then-current 1067.66 PLN balance.
- **Native limit:** Device Hub exposes no accessible Save-to-Files controls on the share sheet. Coordinate clicks did not activate Save-to-Files. Native file saving and picker restore remain unverified. Android and a physical iPhone were not checked.
- Full package test suite passed (15 tests). Type-check, lint and exported build passed. Lint has 12 informational bracket-access notices; TypeScript requires that access for index signatures. No dependencies or EAS configuration were added.
- [After-mode Anti Slop audit](anti-slop/audit-001-2026-10-08.md): dark primary-button contrast is 3.65:1 and needs finding-1 approval before changing the inherited colors. Native file UI validation is partial. This is not a production offline app or a final visual design.

### Standards review

One rate-direction finding was fixed. Historical rate metadata is now retained only when value and pair match the displayed fields. Recheck: no remaining actionable standards issue. Review excluded unrelated working-tree changes.

### Spec review

Three findings were fixed: rate label/pair mismatch, invalid source identity text, and unsigned/both-sided Account Transfer rows. Recheck: no remaining issue in those changes or the native navigation fixes. Native file UI limitations remain explicit.

### Run and evaluate

From `packages/mobile`:

```sh
bun run web --port 8082
bun run build:offline && bun run preview:offline
bun run test
bun run types:check
bun run lint
bun run ios --device 2F92B47A-12F0-4595-90B5-651826205E2D --port 8082
```

Development uses `http://localhost:8082`. Exported preview uses `http://127.0.0.1:8083`; their browser databases are separate origins. Open Sort of Budget, select the Sample Book, open an Account and record an Expense. Save opens its real record; edit or confirm removal there. Activity has search, filters and per-currency spending. More opens directories and Prototype data.

In Prototype data, export before reset or restore. Load the optional private file from `assets/seed/normalized/seed.json`; open the read-only source preview. It never changes working totals. No file is required for the manual flow. Simulate a purchase, dismiss its banner if needed, then review the retained pending item before saving.

Offline update procedure: rebuild the export, reconnect, open Prototype data, choose “Check offline shell update,” finish open forms and export if needed, then confirm “Activate downloaded shell update.” The app reloads with the new asset cache. Verify a saved record, disconnect and reload again. Tested in Headless Chromium 148.0.0.0 on macOS via agent-browser. Cache versions are content hashes; obsolete prototype asset caches are removed only on activation. Financial records stay in IndexedDB.

For repeatable real-browser storage checks, use a dedicated synthetic browser session. Bundle `tests/browser-storage.ts` with `bun build tests/browser-storage.ts --target browser --format iife --outfile /tmp/budget-browser-check.js`, inject it with agent-browser `eval --stdin`, then run `window.budgetStorageChecks()`. The check restores the original test Book afterward. Native storage uses exclusive SQLite transactions with the same validation and revision rules. A valid native write also passed after the final stored-schema guard was added.

Synthetic screenshots: [capture details](screenshots/captured-expense.png), [source scale fixture](screenshots/source-synthetic.png), [Counterparties on a phone](screenshots/counterparties-phone.png), [deep Category path](screenshots/categories-deep-phone.png), [native saved balances](screenshots/ios-accounts.png), [dark contrast finding](screenshots/account-dark-audit.png).

Feedback still needed: Expense entry speed, Category and Counterparty findability, currency/rate clarity, and whether capture review is useful. Long Category paths require vertical scrolling; this is an interaction to evaluate, not a nesting limit.
