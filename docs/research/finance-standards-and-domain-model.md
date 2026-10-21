# Finance standards and the Budgetly domain model

Date: 2026-10-08. Status: research and proposed direction, not an accepted architecture.

## Finding

Use financial standards for external meanings and exchange formats. Model Budgetly's
Accounts, financial history, and spending plans around user scenarios. Test a small
double-entry journal as the calculation model. None of the surveyed standards supplies
the complete combination of personal budgeting, local storage, and offline reconciliation.

## What to reuse

The scope column reports source facts. The last column is a recommendation for Budgetly.

| Reference | Scope | Proposed use |
| --- | --- | --- |
| [ISO 20022](https://www.iso20022.org/iso-20022-message-definitions?search=Bank-to-Customer+Cash+Management) | Shared financial message concepts; camt.052 account reports, camt.053 statements, camt.054 debit/credit notifications. Current catalogue exposes V14. | Borrow amount, currency, entry, reference, balance, and date meanings. Add parsers only for actual source formats. |
| [OFX Banking 2.3](https://financialdataexchange.org/about-fdx/ofx-work-group/) | Consumer financial-data exchange, including bank, card, investment, and loan records. | Import/export reference; useful transaction identity and correction semantics. |
| [FDX API](https://developer.financialdataexchange.org/learn-about-fdx-api-v6-0-0) | Permissioned financial-data API and companion specifications. | Evaluate for a selected integration market. The public v6.0 page is from 2023; this research did not verify the latest schema/version. |
| [UK Open Banking](https://openbankinguk.github.io/read-write-api-site3/v4.0.1/resources-and-data-models/aisp/Transactions.html), [Berlin Group NextGenPSD2](https://berlin-group.org/library/) | Account-information APIs with transaction, balance, status, and exchange fields. | Reference for integration mappings and missing-data cases. Provider support still varies. |
| [XBRL Global Ledger](https://specifications.xbrl.org/transactional.html) | Represents charts of accounts, journal entries, and historical financial/business records. | Closest surveyed standard to exchanging detailed ledger contents. Full adoption adds scope with no current consumer requirement. |
| [FIBO](https://spec.edmcouncil.org/fibo/index.html), [BIAN](https://bian.org/deliverables/service-landscape/) | Financial ontology; banking service reference architecture, respectively. | Consult when a term is unclear. Neither supplies the app's database or spending-plan behavior. |
| [ISO 4217 / SIX](https://www.six-group.com/en/products-services/financial-information/market-reference-data/data-standards.html) | Current and historic currency codes and minor-unit information. | Use standard fiat currency identities. Preserve historic codes; do not assume every currency has two decimal places. |

FDX field-level schemas were not accessible through the public pages inspected.
No conformance, bank coverage, implementation license, or interoperability test is claimed.

## Source records have their own lifecycle

- OFX uses institution transaction identifiers (`FITID`) and correction references
  (`CORRECTFITID`, with replace/delete actions). Pending records are a separate snapshot.
  See [Banking 2.3, sections 11.4.1–11.4.4](https://financialdataexchange.org/wp-content/uploads/2025/12/OFX-Banking-Specification-v2.3.pdf).
- UK Open Banking v4.0.1 allows pending records to change or be backed out. Booked records
  can explicitly remain mutable. `TransactionId` is optional. Booking time is not purchase
  time; some timestamps contain a default midnight. Preserve supplied semantics and unknowns.
  See [Transactions: Notes, Mutability, Data Dictionary](https://openbankinguk.github.io/read-write-api-site3/v4.0.1/resources-and-data-models/aisp/Transactions.html).
- An Account can have several balance types. An available balance can include a credit
  line. This is not automatically Budgetly's Available money.
  See [UK balance model](https://openbankinguk.github.io/read-write-api-site3/v4.0.1/resources-and-data-models/aisp/Balances.html).
- Berlin Group has optional source IDs and date/exchange details. Pending support varies.
  See [v1.3.16 implementation guidelines](https://berlin-group.org/wp-content/uploads/2026/09/Berlin-Group-NextGenPSD2-Implementation-Guidelines-1.3.16-2025-12-02.pdf).

Proposed rule: retain source scope, original records, observed revisions, and mapping
decisions. Assign local identities independently. A matching amount/date is only evidence.
Multiple records can describe one operation; a grouped source entry can describe several.
Missing records in a partial response must not be interpreted as deletions.

## Calculation model to test

[GnuCash](https://wiki.gnucash.org/docs/STABLE/group__Transaction.html) represents a journal
transaction through splits. Each split has its own quantity and a value in the journal
transaction's currency; those values balance. [Beancount](https://beancount.github.io/docs/precision_tolerances/)
shows why conversion precision and rounding need an explicit policy.

Recommendation: test the double-entry principle without requiring accounting terminology
in the user interface. Preserve actual amounts in each currency. Never add unlike
currencies directly. Keep historical conversion values separate from current valuations.
Retain a bank's quoted rate as source evidence even when it is rounded differently from
the rate implied by the actual amounts. Keep fees explicit without charging them twice.

Double entry detects an unbalanced journal entry. It does not prove that the record is
real, unique, correctly categorized, or complete. Reconciliation remains necessary.

Storage is a later implementation decision. A local relational store is a reasonable
candidate; save each operation and all its financial effects atomically. Use exact
decimal arithmetic or scaled integers with explicit scale and rounding. Rates need their
own precision. [SQLite documents why binary floating point is approximate](https://sqlite.org/floatingpoint.html).
Maintain correction history, stable identities, and explicit conflicts. A financial
journal does not require event-sourcing every part of the app.

## Proposed language and existing conflicts

These are discussion candidates. The canonical [glossary](../../GLOSSARY.md) now
contains the foundational terms; source reconciliation and journal concepts remain later topics.

| Concept | Meaning or decision to resolve |
| --- | --- |
| Source record | Evidence received from a statement, bank API, or capture channel, with its provenance. |
| Financial operation | Candidate umbrella for the user's economic event. Its precise relationship to pending capture, fees, and refunds needs examples. |
| Transaction / Transfer | Keep the existing distinction: income or expense on one Account versus movement between own Accounts. External APIs use “transaction” more broadly. |
| Journal entry / Posting | Candidate calculation terms. A journal entry has related postings; a posting expresses one accounting effect. Do not overload the product's Transaction or Account. |
| Reported balance / calculated balance | A source's typed balance at a time versus a value derived from known history. A discrepancy needs explanation, not silent adjustment. |
| Reconciliation | Establish how source records and financial operations correspond, and whether calculated balances agree with comparable source balances. |
| Budget limit / Reserve | A spending target for a period versus money assigned to a purpose. Their interaction remains open in [ticket 07](../../.scratch/product-direction/issues/07-distinguish-envelopes-and-reserves.md). |
| Refund / reversal / reimbursement | Distinct scenarios; decide their links to the original expense, income reports, and budget periods. |

Keep the accepted [Book boundary](../adr/0003-book-is-the-financial-and-sharing-boundary.md)
and [exchange-provider boundary](../adr/0004-provider-agnostic-exchange-rate-module.md).
Source handling, accounting, and planning describe responsibilities, not new services.
The inspected mobile overview is a static prototype; it does not validate these semantics.

## First modeling session

The user clarified the starting point on 2026-10-08: define the basic concepts and
relationships before investigating reconciliation or other complex scenarios.
Start with Accounts, amounts and currencies, income and expense Transactions,
internal Transfers, Categories, and Counterparties within a Book. For each, settle its meaning,
minimum information, and relationship to the others using ordinary examples.

The user confirmed Counterparties as a basic requirement: identify the shop,
business, or person involved in a Transaction, independently of its Category.
The current glossary uses Counterparty for both payers and payees.

Category nesting has no product depth limit. A Category can have one parent, and
that parent can have another parent. The existing glossary already specifies this,
prevents cycles, and allows direct assignment to Categories that have children.

Use [DDD's shared language within an explicit context](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf).
The first output is a reviewed glossary and a simple relationship sketch.

## Later scenario checks

Once the basic concepts are clear, a small [EventStorming session](https://www.eventstorming.com/)
can examine lifecycles. The following examples are synthetic.
Record their expected effects before choosing tables.

| Story | Question or invariant |
| --- | --- |
| Manual purchase, then notification, pending bank entry, and posted entry | One purchase effect; preserve revisions and links. What changes when the final amount differs? |
| Two purchases with the same merchant, amount, and date | Both remain unless evidence establishes a duplicate. |
| €100 purchase posted as PLN 432 | Account changes by PLN 432; later rates do not rewrite it. |
| Exchange: debit PLN 444, receive €100, fee PLN 4 included | Transfer principal is PLN 440; expense is PLN 4; total debit stays PLN 444. |
| Partial refund in the next month | Which month and Category receive the reduction? What happens to a previously used Reserve? |
| Credit-card purchase followed by card repayment | Purchase is an expense; repayment settles the liability without another expense. |
| Allocate a Reserve, then pay the obligation | Allocation changes the plan only; payment and Reserve use must remain consistent. |
| Missing opening balance, stale valuation, or two offline edits | Preserve uncertainty and resolve conflicts without inventing money or losing edits. |

Output: resolved glossary terms, scenario expectations, and open product decisions.
Then compare a small journal model against the current Transaction/Transfer model.
Write an ADR only after that choice is made. No schema or code change is proposed yet.
