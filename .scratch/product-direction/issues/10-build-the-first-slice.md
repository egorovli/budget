# Build the first slice: a current picture from imported statements

Type: task
Status: open
Parent: ../../../docs/product.md

## Goal

The founder imports their own statements (11 Accounts, 1,728 entries) into a local Book, and the calculated balance of every Account agrees with the balance in the bank statement.

## Scope

1. Import the normalized seed from [`normalize-seed.py`](../../../scripts/normalize-seed.py) into a local Book. Keep each source record with its source.
2. Show the Accounts: balance, date of the latest data, and the reconciliation result. A difference is shown, never corrected automatically.
3. Show the activity feed, with search and filters by Account and Category.
4. Add fast manual entry of an Expense: amount first.
5. Export and restore the complete Book.

## Model

- The user sees Transactions and Transfers. The storage keeps each operation as balance changes, one per Account, in that Account's currency. An Account balance is the sum of its balance changes.
- Opening balance comes from the statement. There is no Balance adjustment.
- Money is stored as integer minor units. Rates have an explicit direction and provenance.
- Start from the domain model and tests in [`docs/archive/prototype-domain/`](../../../docs/archive/prototype-domain/).

## How we work

- Web-first on Expo with Fast Refresh ([research](../../../docs/research/web-first-react-native-development.md)). Local storage only.
- Apply the lessons of the browser prototype in [product.md](../../../docs/product.md#prototype-history).
- Real data stays in `~/Dev/egorovli/budgetly-seed/` (or `BUDGETLY_SEED_DIR`). It never goes into Git, screenshots, telemetry or model requests. Tests use synthetic fixtures.

## Outside this slice

Planning, Reserves, iCloud synchronization, live bank synchronization, Members, agent access.

## Done when

- The import of the founder's seed gives a passed reconciliation for every Account, or shows each difference with its Account and amount.
- Automated tests cover balance changes, Transfers between currencies with a fee, Opening balance and export/restore on synthetic data.
- The founder can find a past Expense and record a new one.
