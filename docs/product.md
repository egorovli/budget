# Budgetly: product

Status: 2026-10-21. This file is the single summary of the product decisions. The sources are in [`archive/`](archive/). Domain terms are defined in [`GLOSSARY.md`](../GLOSSARY.md). Decision rules are in [`principles.md`](principles.md). Architecture decisions are in [`adr/`](adr/).

## Promise

**Your money, up to date. Your plans, in one place. See what you can spend.**

This promise is a founder hypothesis. No user interviews or demand tests have been done.

## Current stage

Since 2026-10-21, we build Budgetly for the founder's own use, and we research what can be connected to it. We make no promise to other users. The measure of success: the founder uses the app every week and trusts its numbers. We decide the next step from that use, not from a full product plan.

## User

- An individual or a household with several Accounts. The person thinks about upcoming costs before spending.
- An individual must be able to use the full workflow alone. A household plans together in one Book.
- Small-business finance is possibly later scope. Full business bookkeeping is out of scope.
- No launch country is selected. Poland is not a constraint. The first Book defaults to PLN only because the founder's data is in PLN.

## Everyday loop

1. **Get the picture current.** Collect records from institutions, make manual entry fast, and show which Accounts are current and which records need review.
2. **Make a plan.** Give available money a purpose: upcoming costs, daily spending, goals.
3. **Make a spending decision.** Show what remains for a purpose and what a proposed purchase changes. The purchase check is a preview. It records nothing.
4. **Keep the plan useful.** As expenses arrive, show differences from the plan and let the user adjust it.

## Product qualities

- Trustworthy numbers: every figure traces to source records ([principles 1–3](principles.md)).
- Fast entry: amount first, minimal required fields.
- Offline-first: recording, viewing, editing, export and backup never wait for the network.
- Useful bank synchronization (not designed yet).
- No advertising business model.
- AI comes from the user's existing agent, with read-only access to one Book (for example through MCP), with export and revoke. A built-in assistant is not a requirement.

None of these qualities is unique: YNAB, Monarch, Copilot and Actual already have them ([pricing reference](research/pricing-reference.md)). The difference must come from the combination and from the quality of execution.

## Decided

| Date | Decision | Source |
| --- | --- | --- |
| 2026-08 | Expo + React Native, iOS first; local Expo builds, no EAS | [ADR 0001](adr/0001-expo-react-native-ios-first.md), `AGENTS.md` |
| 2026-08 | Personal iCloud sync before family sharing | [ADR 0002](adr/0002-personal-icloud-sync-before-family-sharing.md) |
| 2026-08 | Book is the financial and sharing boundary | [ADR 0003](adr/0003-book-is-the-financial-and-sharing-boundary.md) |
| 2026-08 | Exchange rates come through one provider-agnostic module, NBP first | [ADR 0004](adr/0004-provider-agnostic-exchange-rate-module.md) |
| 2026-08 | Transaction date is a calendar date; Occurrence time is optional and never invented | [research](research/transaction-date-time-model.md) |
| 2026-09-12 | First problem: one connected workflow (current Accounts, plan, what remains) | [issue 01](archive/product-direction/issues/01-select-first-user-problem.md) |
| 2026-09-12 | Visual direction: Clarity only | [design.md](design.md) |
| 2026-10-08 | Model the foundations first: Accounts, Transactions, Transfers, Categories, Counterparties, amounts, dates | [map notes](archive/product-direction/map.md) |
| 2026-10-08 | Category nesting has no depth limit; Counterparty is separate from Category | `GLOSSARY.md` |
| 2026-10-08 | Expense location is optional and needs consent | [capture notes](research/automatic-capture-and-local-assistance.md) |
| 2026-10-08 | Money is stored as integer minor units; rates have an explicit direction and provenance | [prototype spec](archive/specs/browser-prototype.md) |
| 2026-10-08 | Private statements stay outside Git; repository fixtures are synthetic | [map](archive/product-direction/map.md) |
| 2026-10-21 | Build for the founder's own use first; no external promise | [issue 03](../.scratch/product-direction/issues/03-define-testable-product-promise.md) |
| 2026-10-21 | No demand test now | [issue 06](../.scratch/product-direction/issues/06-design-demand-test-and-decision-rule.md) |
| 2026-10-21 | Reserves + Free amount, without full allocation; the first slice is the Free amount | [issue 07](../.scratch/product-direction/issues/07-distinguish-envelopes-and-reserves.md), [issue 10](../.scratch/product-direction/issues/10-build-the-free-amount-slice.md) |
| 2026-10-21 | The user sees Transactions and Transfers; each operation is stored as balance changes, one per Account, in that Account's currency | [Decisions of 2026-10-21](#decisions-of-2026-10-21) |
| 2026-10-21 | Opening balance and Reported balance; an Unrecorded difference is shown, never corrected automatically; no Balance adjustment | [Decisions of 2026-10-21](#decisions-of-2026-10-21) |
| 2026-10-21 | Manual Reported balances first, then statement import, then live bank synchronization if it is possible | [Decisions of 2026-10-21](#decisions-of-2026-10-21) |
| 2026-10-21 | No market selection: base currency PLN, NBP rates, several currencies | [Decisions of 2026-10-21](#decisions-of-2026-10-21) |
| 2026-10-21 | Household and agent access are outside the first slice; ADR 0002 stays valid | [Decisions of 2026-10-21](#decisions-of-2026-10-21) |

Valuation accounts, Balance adjustments and Members are **deferred, not rejected**. Their earlier definitions are in [the previous glossary](archive/glossary-before-foundations-2026-10-08.md).

## Decisions of 2026-10-21

These answers follow from the current stage. Each one lets the first slice start. We review them after a few weeks of use with real data.

1. **Promise** ([issue 03](../.scratch/product-direction/issues/03-define-testable-product-promise.md)). There is no external promise. The first slice tests the core of the idea: is the Free amount useful in everyday spending decisions? An import of statement history alone tests only the import; a bank app already shows balances.
2. **Envelopes or Reserves** ([issue 07](../.scratch/product-direction/issues/07-distinguish-envelopes-and-reserves.md)). Reserves + Free amount, in the simplest form. The user thinks about upcoming costs before spending and does not assign every unit of money; full allocation is what YNAB already does. An expense changes a Reserve only when the user selects that Reserve (Reserve-funded expense).
3. **Accounting model.** The user sees Transactions and Transfers. The storage keeps each operation as a set of balance changes. Each balance change belongs to one Account and is in that Account's currency. An Account balance is the sum of its balance changes. This minimal double entry covers Transfers between currencies with a fee, credit cards (an Account with a negative balance; a repayment is a Transfer) and refunds. Categories are not accounts, and the UI uses no accounting terms ([domain research](research/finance-standards-and-domain-model.md)).
4. **Opening balance or Balance adjustment.** No Balance adjustment. The user records a Reported balance from the bank app; the first one is the Opening balance. An Account balance is the latest Reported balance plus the Transactions and Transfers recorded after it. When a new Reported balance differs from the calculated balance, the app shows the Unrecorded difference and does not turn it into an Income or an Expense ([principle 2](principles.md)). Statement reconciliation later uses the same rule, as [`normalize-seed.py`](../scripts/normalize-seed.py) does.
5. **Household.** Outside the first slice. There is one user, and [ADR 0002](adr/0002-personal-icloud-sync-before-family-sharing.md) stays valid. The Book boundary ([ADR 0003](adr/0003-book-is-the-financial-and-sharing-boundary.md)) lets us add Members later.
6. **Bank data.** First, the user enters Reported balances by hand, about once a week. Next, statement import: Erste and Revolut CSV, TBank PDF ([issue 12](../.scratch/product-direction/issues/12-import-statement-history.md)). The normalizer already reads these formats, reconciles balances and links currency exchanges. Live synchronization is a separate research question ([issue 11](../.scratch/product-direction/issues/11-research-bank-synchronization.md)). If it is not possible, statement import still gives the product its value.
7. **Market.** No market selection. The founder's data sets the defaults: base currency PLN, NBP rates, Accounts in PLN, EUR, USD, RUB and AMD.
8. **Agent access.** Outside the first slice. A simple later experiment is a read-only MCP server on top of the Book export. It needs no change to the model.
9. **Demand validation** ([issue 06](../.scratch/product-direction/issues/06-design-demand-test-and-decision-rule.md)). No demand test now. We return to it if we decide to show the product to other people.

## Current work

- [Issue 10](../.scratch/product-direction/issues/10-build-the-free-amount-slice.md): the first slice, the Free amount. Accounts with Reported balances, Reserves, fast Expense entry, NBP rates, export. The founder uses it on their iPhone for 3–4 weeks.
- [Issue 11](../.scratch/product-direction/issues/11-research-bank-synchronization.md): research whether live synchronization with the founder's banks is possible for personal use. It does not block issue 10.
- [Issue 12](../.scratch/product-direction/issues/12-import-statement-history.md): import the statement history and reconcile it. It starts after the check of issue 10.

## Prototype history

- **2026-08: iPhone UI walkthrough.** A low-fidelity walkthrough of 24 screens ([archive](archive/iphone-core-ui/)).
- **2026-09: Demand kit and Clarity campaigns.** Ads, pages and experiment rules were prepared. Nothing was published. The production files were deleted on 2026-10-21; the plans are in [`archive/product-direction/`](archive/product-direction/) and [`archive/design/`](archive/design/).
- **2026-10-08: Browser prototype on Expo.** Local-first storage (IndexedDB on web, SQLite on native), exact money, Transfers between currencies, 120-level Categories, a preview of the private seed, simulated capture, and export/restore. Its question: can a person record an Expense quickly, find it later, and understand its effect on an Account? The app code was deleted on 2026-10-21. The domain model and tests are kept in [`archive/prototype-domain/`](archive/prototype-domain/). The spec and test results are in [`archive/specs/browser-prototype.md`](archive/specs/browser-prototype.md).

Lessons from the prototype for the next bootstrap:

- Use web output `single`, not `static`, because local IDs cannot be listed at export time.
- Commit the complete Book snapshot atomically with a revision check, so that a stale tab cannot overwrite newer data.
- An unknown Opening balance gives a known net movement, not a claimed balance.
- Native Save-to-Files was not verified.

## Data for domain checks

The founder's real statements (Erste, Revolut, TBank; 11 Accounts, 1,728 entries; PLN, EUR, USD, RUB, AMD) are in `~/Dev/egorovli/budgetly-seed/`, outside the repository. [`scripts/normalize-seed.py`](../scripts/normalize-seed.py) converts them into one normalized seed. Set `BUDGETLY_SEED_DIR` to use another location. Do not copy this data into the repository, screenshots, telemetry or model requests.
