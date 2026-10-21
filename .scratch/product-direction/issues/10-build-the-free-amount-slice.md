# Build the first slice: the Free amount

Type: task
Status: claimed
Parent: ../../../docs/product.md

## Goal

The founder uses the app on their iPhone for 3–4 weeks and finds out if the Free amount is useful in everyday spending decisions. The main screen answers one question: how much can I spend without touching the money set aside?

```
Available money   12 400 zł
Reserves          −9 100 zł
Free amount        3 300 zł
```

Under the answer, show the rows it comes from: each Account and each Reserve.

## Scope

1. **Accounts.** Name, currency, and a flag: included in Available money or not. The user records a Reported balance from the bank app, with its date. Each Account shows the date of its latest Reported balance.
2. **Reserves.** Name, amount, currency (the base currency by default) and an optional due date. The user can change or close a Reserve. A closed Reserve leaves the Free amount.
3. **Fast Expense entry.** Amount first, then the Account. An optional Reserve makes it a Reserve-funded expense. Category, Counterparty and a note are optional. The Expense reduces the Account balance until the next Reported balance.
4. **Rates.** Current rates from NBP, with source and date, stored on the device. Without a network, the app uses the stored rates and shows their date. A currency without a rate is shown as unknown, never as zero.
5. **Export and restore** of the complete Book to a file.

## Model

- Money is stored as integer minor units. Rates have an explicit direction and provenance.
- The user sees Transactions and Transfers. The storage keeps each operation as balance changes, one per Account, in that Account's currency.
- An Account balance is its latest Reported balance plus the operations recorded after it. A new Reported balance that differs from the calculated balance shows an Unrecorded difference. The app does not turn it into an Income or an Expense.
- The first Reported balance of an Account is its Opening balance. There is no Balance adjustment.
- Available money and the Free amount are always calculated, never stored.
- Start from the domain model and tests in [`docs/archive/prototype-domain/`](../../../docs/archive/prototype-domain/). Keep only what this slice needs.

Terms: [`GLOSSARY.md`](../../../GLOSSARY.md).

## How we work

- Web-first development on Expo with Fast Refresh ([research](../../../docs/research/web-first-react-native-development.md)).
- Daily use on the founder's iPhone through a local build: `expo run:ios --device`. No EAS. Storage is SQLite on the device.
- Design follows [Clarity](../../../docs/design.md): the main answer with its basis, Dynamic Type, VoiceOver order, hit areas of at least 44 pt.
- Apply the lessons of the browser prototype in [product.md](../../../docs/product.md#prototype-history).
- Tests use synthetic data only.

## Outside this slice

Statement import and history ([issue 12](12-import-statement-history.md)), Transfers in the UI, Income in the UI, reports, charts, the purchase check, iCloud synchronization, live bank synchronization, Members, agent access.

## Done when

- The founder can set up their Accounts and Reserves on the iPhone in under 15 minutes.
- Recording an Expense takes under 10 seconds from the app's start.
- The app works without a network and keeps all data after a restart.
- Export, deletion of the app data and restore give the same Free amount.
- Automated tests cover: balance from Reported balance and later operations, Unrecorded difference, Reserve-funded expense, closed Reserves, conversion with a stored rate, an unknown rate, export/restore.

## Viability check

After 3–4 weeks of use, answer with the founder:

1. Did I update the Reported balances without a reminder?
2. Did I open the app before a purchase?
3. Did the Free amount change at least one decision?

Two or more "yes": continue with issue 12. Otherwise, find out what failed: the idea itself or the effort to keep the data current. The answer sets the priority of [issue 11](11-research-bank-synchronization.md). Record the result under `## Implementation`.
