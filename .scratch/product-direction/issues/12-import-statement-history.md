# Import the statement history and reconcile it

Type: task
Status: open
Blocked by: 10
Parent: ../../../docs/product.md

## Goal

The founder imports their own statements (11 Accounts, 1,728 entries) into the Book from [issue 10](10-build-the-free-amount-slice.md), and the calculated balance of every Account agrees with the balance in the bank statement. Imported statements replace most manual Reported balances and give the history behind each balance.

Start this ticket only if the check of issue 10 says to continue.

## Scope

1. Import the normalized seed from [`normalize-seed.py`](../../../scripts/normalize-seed.py) into a local Book. Keep each source record with its source.
2. Show the reconciliation result for each Account. A difference is an Unrecorded difference: it is shown, never corrected automatically.
3. Show the activity feed, with search and filters by Account and Category.
4. Match imported records with manual Expenses from issue 10. A matching amount and date is only evidence: show candidates, do not merge silently.
5. Include the imported records in export and restore.

## Model

- Use the model of issue 10: balance changes per Account, Opening balance, Reported balance, Unrecorded difference.
- Reuse the import and reconciliation tests from [`docs/archive/prototype-domain/`](../../../docs/archive/prototype-domain/).

## Data

Real data stays in `~/Dev/egorovli/budgetly-seed/` (or `BUDGETLY_SEED_DIR`). It never goes into Git, screenshots, telemetry or model requests. Tests use synthetic fixtures.

## Done when

- The import of the founder's seed gives a passed reconciliation for every Account, or shows each difference with its Account and amount.
- A repeated import of the same statement adds no records.
- Automated tests cover Transfers between currencies with a fee, duplicate candidates and export/restore on synthetic data.
