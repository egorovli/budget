# Automatic capture and local assistance

Date: 2026-10-08. Status: ideas and feasibility notes, not an implementation plan.

## Direction from the user

- Aggregate Accounts, currencies, expenses, and savings.
- Keep core workflows offline-first and minimize routine entry.
- Preserve original and posted currencies and historical Operation rates.
- Explore bank connections, Apple Shortcuts, and local model assistance.

The existing [concept](../archive/product-direction/concept-v0.md), [principles](../principles.md),
and [glossary](../../GLOSSARY.md) remain the starting point.
The earlier POC excludes bank sync, category budgets, refunds, and automatic
categorization. Those exclusions need review for this broader product direction.

## Capture candidates

| Source | Verified capability | Open question |
| --- | --- | --- |
| Statement import | Local normalized seed already preserves bank movements and source evidence. | Repeat imports, overlapping periods, and reconciliation with other sources. |
| Wallet automation | Apple documents a transaction trigger when a selected card is tapped. | Fields and reliability for the user's cards, devices, and payment methods. |
| Notification automation | Apple's iOS 27 guide documents app selection and Message, Subtitle, or Title filters. | Accessible content, local handoff, locked-device behavior, and missed events. |
| FinanceKit | Apple documents eligible Wallet account data, an entitlement, and US/UK availability. | Actual eligibility for a selected launch market and institution. |
| Bank aggregation | Providers expose different bank, product, scope, and history coverage. | Coverage, commercial terms, connection renewal, data handling, and integration requirements. |

Sources: [Apple Wallet trigger](https://support.apple.com/en-lamr/guide/shortcuts/apd65c67538a/ios),
[Apple notification trigger](https://support.apple.com/en-ng/guide/shortcuts/apd932ff833f/ios),
[FinanceKit](https://developer.apple.com/financekit/),
[TrueLayer coverage fields](https://docs.truelayer.com/docs/supported-providers-table).
No bank connection or device capture was tested.

## Proposed behavior

- Preserve source records. Link observations of the same purchase to one financial
  operation. A notification, manual entry, and posted bank record must not each
  charge the Account. Keep provisional effects distinct from posted effects.
- Match exact source identities deterministically. Suggest uncertain cross-source
  matches for review. Equal date and amount alone cannot prove a duplicate.
- Keep both sides of an internal Transfer, including cross-currency amounts.
  Show fees without subtracting a fee twice when it is included in a posted amount.
- Keep historical reporting rates separate from Current valuation rates.
  Missing rates must not block local recording or produce invented totals.
- Show Account coverage, last update, and unresolved balance differences.
- Keep entry, edits, reports, export, and restorable backup usable offline.
  Treat bank capture, device synchronization, and backup as separate capabilities.

## Local model candidate

### Location as optional expense context

On 2026-10-08 the user proposed saving an Expense location with consent: latitude
and longitude for a point that can be shown on a map. Capture remains optional;
recording an expense must work when location is unavailable or permission is denied.
This is a position captured for an expense, not a request for continuous tracking.

Proposed supporting metadata: measurement time and accuracy when available.
These distinguish a recent, precise position from an old or approximate one.
The device's position when recording an expense is not proof of where an earlier
purchase occurred or which Counterparty received the payment.

Future idea: use proximity to suggest a Counterparty and possibly a Category.
Keep these suggestions separate from the recorded point. Places-data sources,
offline availability, and matching behavior remain undecided; no integration is selected.

### Model evaluation

Needle 3 documents structured extraction, classification, embeddings, and iOS,
Android, and browser targets. This establishes a candidate, not finance accuracy.
Its README also states that binary telemetry is enabled by default.
Verify disabled telemetry and actual network behavior before using private records.
Sources: [Needle repository](https://github.com/cactus-compute/needle),
[platforms](https://cactuscompute.com/blog/needle-supported-devices),
[extraction](https://cactuscompute.com/blog/structured-extraction-with-needle).

Proposed order: user rules and remembered corrections, then model suggestions,
then review when evidence is weak. Suggest Categories and Counterparties; require
confirmation for new Categories. Use deterministic code for amounts, balances,
rates, and final duplicate handling. Model confidence needs local calibration.

Before adoption, compare against simple rules on a manually labelled local sample.
Hold out later dates and unseen merchants. Measure correction time, wrong accepted
suggestions, missed matches, latency, memory, and offline behavior on target devices.

## Next product experiment

Use one complete statement period to test import, reconciliation, categorization,
and a spending plan. Include Transfers, foreign-currency purchases, refunds,
repeated purchases, and uncertain records. Use synthetic examples in Git.
Measure maintenance effort and whether the user can explain remaining money.
Keep category limits, Reserves, and forecast income distinct. The exact budgeting
model remains open in [ticket 07](../../.scratch/product-direction/issues/07-distinguish-envelopes-and-reserves.md).
