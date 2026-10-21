# Budgetly: product

Status: 2026-10-21. This file is the single summary of the product decisions. The sources are in [`archive/`](archive/). Domain terms are defined in [`GLOSSARY.md`](../GLOSSARY.md). Decision rules are in [`principles.md`](principles.md). Architecture decisions are in [`adr/`](adr/).

## Promise

**Your money, up to date. Your plans, in one place. See what you can spend.**

This promise is a founder hypothesis. No user interviews or demand tests have been done.

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

Reserves, Free amount, Valuation accounts, Balance adjustments and Members are **deferred, not rejected**. Their earlier definitions are in [the previous glossary](archive/glossary-before-foundations-2026-10-08.md).

## Open questions

These are the items to think through before production code. The order is by dependency.

1. **Core promise and experience** ([issue 03](../.scratch/product-direction/issues/03-define-testable-product-promise.md)). Which of bank sync, planning, reports, offline use and agent access does the promise need?
2. **Envelopes or Reserves** ([issue 07](../.scratch/product-direction/issues/07-distinguish-envelopes-and-reserves.md)). Full allocation ("$0 left to assign") or Reserves + Free amount? Is full allocation optional? How does an expense affect an allocation?
3. **Accounting model.** A double-entry journal behind the UI, or the current Transaction/Transfer model? Source records with provenance either way ([domain research](research/finance-standards-and-domain-model.md)).
4. **Opening balance or Balance adjustment.** The prototype used Opening balance; the earlier model used Balance adjustments for reconciliation as well. Are both necessary?
5. **Household.** What do Members share and control? If a household is part of the first promise, ADR 0002 must be reviewed.
6. **Bank data.** Live bank sync or statement import first? Which institutions and which region?
7. **Market and price.** Poland (PLN, NBP) or the US (USD, $9 per month in the campaign drafts)?
8. **Agent access in the MVP.** Read-only Book access only, or also scenario requests such as the purchase check?
9. **Demand validation** ([issue 06](../.scratch/product-direction/issues/06-design-demand-test-and-decision-rule.md)). Do we test demand before we build, or build for our own use first? No campaign has been run.

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
