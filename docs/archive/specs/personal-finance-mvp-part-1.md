# Personal finance POC concept — Part 1

Status: ready-for-agent

## Problem Statement

People who manually track personal or family finances are often forced to choose between heavyweight accounting software, envelope systems that require every unit of currency to be allocated, and simple trackers that cannot answer how much money is genuinely free after known commitments. Manual entry also becomes too slow or demanding, causing the data to become incomplete and the product to lose its value.

The first version needs to make ordinary expense entry pleasant on iPhone, preserve an explainable multi-currency history, distinguish spendable money from total wealth, and support explicit targeted reserves without operating a conventional backend. The owner must be able to read and debug the product logic, so the application cannot be primarily implemented in Swift or Objective-C.

## Solution

Build an iOS-first personal-finance application with Expo, React Native, and TypeScript. Small native Apple adapters are acceptable where required, especially for CloudKit, while the application behavior, financial model, validation, and exchange-rate orchestration remain in TypeScript.

The root financial dataset is a `Book`. Each Book owns its immutable base currency, Accounts, Transactions, Transfers, Categories, Counterparties, Reserves, history, and future membership. A user may maintain multiple Books. The first usable version synchronizes a Book between devices using the same iCloud account; invitations to other iCloud users are deferred.

The application distinguishes Transactional accounts from Valuation accounts. It derives transactional balances from recorded history, tracks investments through dated Valuation snapshots, preserves posted and original currency amounts, embeds historical Operation rates, and uses current valuation rates only for today's totals.

The principal product answer is Free amount: Available money minus active Reserves. Reserves are Book-wide, non-negative, and never consumed implicitly. An ordinary expense uses free money; a Reserve-funded expense occurs only when the user explicitly chooses one Reserve and the amount to use from it.

## User Stories

1. As a Book owner, I want to create a Book with a chosen base currency, so that all summary values have one consistent frame of reference.
2. As a Book owner, I want PLN suggested for my first Book, so that setup is quick for the initial Polish use case.
3. As a Book owner, I want a Book's base currency to remain stable, so that historical reports and Reserves are not silently reinterpreted.
4. As a Book owner, I want to create multiple Books, so that I can maintain separate financial datasets with different base currencies or participants.
5. As a Book owner, I want every Account, Category, Counterparty, Reserve, and operation to belong to one Book, so that data cannot leak or form invalid relationships across Books.
6. As a user, I want to create a Transactional account in one source currency, so that I can track a bank account or cash wallet.
7. As a user, I want to enter an opening Balance adjustment, so that pre-existing money affects the Account without being reported as income.
8. As a user, I want to reconcile an incorrect transactional balance with a dated Balance adjustment, so that the correction remains explainable in history.
9. As a user, I want a transactional balance derived from adjustments, income, expenses, and Transfers, so that it never depends on an unexplained mutable balance field.
10. As a user, I want to create a Valuation account, so that I can include an investment or other manually valued asset without inventing fake Transactions.
11. As a user, I want to add dated Valuation snapshots, so that the current and historical value of a Valuation account is visible.
12. As a user, I want a new Valuation snapshot to become the current value without rewriting older snapshots, so that valuation history is preserved.
13. As a user, I want Valuation accounts excluded from Available money, so that investments are not treated as immediately spendable cash.
14. As a user, I want to decide whether a tracked Account contributes to net worth, so that the Book reflects the financial scope I intend to measure.
15. As a user, I want to record an ordinary expense starting with amount and Account, so that frequent entry takes only a few seconds.
16. As a user, I want Category, Counterparty, note, and date to be optional for an ordinary expense, so that accounting metadata never blocks quick capture.
17. As a user, I want today's date and recent choices suggested by default, so that repetitive entry requires less interaction.
18. As a user, I want to record income on a Transactional account, so that incoming money changes its balance and financial reports correctly.
19. As a user, I want to edit or remove an operation and immediately see every dependent total recomputed, so that corrections cannot leave stale balances or Reserves.
20. As a user, I want to browse operations across the Book and within one Account, so that I can inspect and reconcile history.
21. As a user, I want the posted amount in the Account currency to be authoritative, so that the application reconciles exactly with the Account.
22. As a user, I want to preserve an optional original merchant amount and currency, so that I can see what the Counterparty charged before conversion.
23. As a user, I want an Operation rate embedded with a historical multi-currency operation, so that later market changes do not rewrite its value.
24. As a user, I want to edit a conversion's rate or resulting amount, so that I can replace a reference rate with the actual conversion.
25. As a user, I want a conversion to keep source amount, resulting amount, and rate mathematically consistent, so that contradictory values cannot be stored.
26. As a user, I want to know whether a rate was automatic or manually overridden, so that its provenance is understandable.
27. As a user, I want to transfer money between my Accounts as one linked operation, so that the movement does not appear as income or expense.
28. As a user, I want a cross-currency Transfer to preserve both actual amounts and its effective rate, so that the exchange remains historically accurate.
29. As a user, I want an exchange fee recorded separately as an expense, so that the currency exchange itself remains neutral while its real cost is reported.
30. As a user, I want one optional Counterparty model for both income and expenses, so that the same person or organization is not duplicated as a payer and payee.
31. As a user, I want the direction of the Transaction to determine whether the Counterparty is payer or payee, so that role does not need separate stored entities.
32. As a user, I want to create Categories with arbitrary nesting depth, so that I can organize finances with as much detail as I find useful.
33. As a user, I want each Category to have at most one parent in the same Book, so that the hierarchy remains a tree.
34. As a user, I want invalid Category relationships rejected, so that self-parenting, cycles, missing parents, and cross-Book parents cannot corrupt the hierarchy.
35. As a user, I want to assign a parent Category directly to a Transaction even when it has children, so that adding children does not invalidate historical usage.
36. As a user, I want Categories usable for both income and expenses, so that mixed branches do not require inherited direction rules.
37. As a user, I want Category reports to aggregate a Category's direct Transactions and all descendants, so that parent totals remain useful.
38. As a user, I want Category archive to be the default removal action, so that historical Transactions keep their classification.
39. As a user, I want archiving a parent to archive its subtree atomically, so that active descendants cannot be stranded under an archived ancestor.
40. As a user, I want archived Categories hidden from new Transaction entry but visible in history and reports, so that old data remains understandable.
41. As a user, I want to create a Book-wide Reserve for a known purpose, so that some Available money is explicitly unavailable for ordinary spending.
42. As a user, I want a Reserve expressed in the Book's base currency, so that the commitment has one stable meaning.
43. As a user, I want a Reserve to remain separate from real Accounts, so that reserving money does not create a bank movement or change net worth.
44. As a user, I want to add money to a Reserve only through an auditable Reserve adjustment, so that its current amount follows from history.
45. As a user, I want to return money from a Reserve to the Free amount, so that commitments can be revised without altering an Account balance.
46. As a user, I want an ordinary expense to leave every Reserve untouched, so that the application never guesses my intention.
47. As a user, I want to explicitly choose at most one Reserve and the exact amount to use for an expense, so that Reserve consumption is deliberate and understandable.
48. As a user, I want the remainder of a Reserve-funded expense to come from free money, so that purchases do not need to exactly match the Reserve amount.
49. As a user, I want a Reserve prohibited from becoming negative, so that it cannot ambiguously turn into debt or a future savings target.
50. As a user, I want the expense and its Reserve adjustment saved atomically, so that they cannot diverge after a failure or synchronization event.
51. As a user, I want Available money calculated only from eligible liquid Transactional accounts, so that non-spendable assets do not distort purchasing decisions.
52. As a user, I want Free amount calculated as Available money minus active Reserves, so that I can check what is genuinely uncommitted before a purchase.
53. As a user, I want the Free amount allowed to become negative after later spending or exchange-rate movement, so that the application reveals a deficit rather than silently shrinking a Reserve.
54. As a user, I want net worth, Available money, total Reserves, and Free amount shown as distinct values, so that different financial questions are not conflated.
55. As a user, I want the current value of foreign-currency Account balances converted with a Current valuation rate, so that today's net worth and Free amount reflect current purchasing power.
56. As a user, I want historical reports to use embedded Operation rates, so that old income and expenses do not drift.
57. As a user, I want automatic reference rates for common currencies, so that ordinary multi-currency entry does not require manual research.
58. As a user, I want NBP average rates used as the initial automatic source, so that PLN-first conversions rely on an official public source.
59. As a user, I want the application to store the provider and effective date of an automatic quote, so that the result is auditable.
60. As a user, I want exchange-rate providers hidden behind one stable behavior, so that adding or changing providers does not alter the rest of the application.
61. As a user, I want provider selection and fallback handled automatically by application-defined rules, so that I do not need to configure infrastructure.
62. As a user, I want a manual rate to remain available when automatic sources are unsuitable, so that provider limitations never block data entry.
63. As a user, I want a Book synchronized between my Apple devices through iCloud, so that I can enter data on iPhone and see the same financial picture elsewhere.
64. As a user, I want a synchronized operation to appear once, so that retries or multiple devices cannot duplicate its financial effect.
65. As a user, I want dependent totals to converge after synchronization, so that every device reports the same Account balances, Reserves, and Free amount.
66. As a user, I want the product logic and financial calculations implemented in TypeScript, so that I can read and debug the application.
67. As a user, I want Apple-specific native code isolated to small adapters, so that CloudKit integration does not turn the whole application into a Swift codebase.
68. As a user, I want to export Transactions as CSV, so that my basic financial history remains portable.
69. As a user, I want a complete portable backup of every Book entity and its history, so that I can restore my data independently of normal synchronization.
70. As a user, I want the first screen to prioritize Free amount and quick Transaction entry, so that the product answers the pre-purchase question without accounting ceremony.

## Implementation Decisions

- The first target is iOS. The application uses Expo, React Native, and TypeScript, with Expo development builds rather than Expo Go when custom native code is required.
- Product behavior, the domain model, calculations, validation, and orchestration remain in TypeScript. Swift or Objective-C is limited to small Apple-specific adapters such as CloudKit integration.
- macOS is a preferred later target but does not constrain the first implementation. Android and web are also deferred.
- `Book` is the aggregate, persistence unit, synchronization unit, and future sharing unit. It replaces `Household` and avoids overloading the word `Budget`.
- An installation may contain multiple Books. Each Book owns its data and has one base currency selected at creation.
- The base currency is immutable in the POC. PLN is the default for the first Book, not a globally hardcoded currency.
- Book-scoped relationships must not cross between Books.
- Accounts use one tracking mode: Transactional or Valuation.
- A Transactional account balance is derived from Balance adjustments, income, expenses, and Transfer legs. Direct mutation of a stored current balance is not part of the model.
- Opening balances and reconciliation corrections are Balance adjustments and do not count as income or expense.
- A Valuation account uses dated Valuation snapshots. It contributes to net worth when included but is excluded from Available money.
- Transactions represent income or expenses on one Transactional account. Transfers are separate linked operations and are never income or expenses.
- A cross-currency Transfer preserves both actual amounts. Any fee is a separate expense.
- Counterparty is one optional Book-scoped entity; payer and payee are contextual roles determined by Transaction direction.
- Categories form an arbitrarily deep, single-parent, acyclic tree within one Book.
- Category validation rejects self-parenting, ancestor cycles, missing parents, and cross-Book parentage.
- Every Category remains directly assignable regardless of whether it has descendants.
- Categories are direction-agnostic and may classify either income or expenses.
- Category report aggregation includes a Category's own Transactions plus every descendant.
- Archive is the POC Category-removal behavior. Archiving a parent archives the full subtree atomically; active children must be reparented first if they should remain selectable.
- Permanent Category deletion and unsetting historical Transaction references is a possible later feature, not a POC interaction.
- The posted amount in the Account currency is authoritative for balance changes. An optional original amount and currency preserve merchant context.
- A conversion has source amount, resulting amount, and rate, but only two are independent; the third is always derived.
- Operation rates are embedded and immutable against later market movement, although the user may explicitly edit the rate or resulting amount.
- Rate provenance distinguishes automatic quotes from manual overrides.
- Current valuation rates may update today's foreign-balance contribution to net worth, Available money, and Free amount without changing historical operation values.
- NBP average rates are the first automatic rate source. The selected quote stores provider identity, effective date, and enough provenance to audit triangulation.
- Exchange rates are exposed to callers through one deep TypeScript module interface that accepts a normalized currency-pair/date request and returns a normalized quote.
- The exchange-rate module owns application-defined routing, provider fallback, triangulation, caching, and normalized failures. Callers never select providers directly.
- External rate sources are internal provider adapters. The initial adapters are NBP for production and an in-memory adapter for tests; later providers can be added without changing callers.
- User-configurable provider routing is deferred. Transaction-level manual override is the POC escape hatch.
- A Reserve is Book-wide, denominated in base currency, not attached to an Account, not an Account itself, and neutral to net worth.
- Reserve balances are non-negative and follow from auditable Reserve adjustments.
- Creating a new Reserve allocation cannot consume more than the current Free amount. A later Transaction or rate change may make Free amount negative, but the application does not shrink Reserves silently.
- Expenses never consume Reserves by inference. Default expenses use free money only.
- A Reserve-funded expense explicitly selects at most one Reserve and an amount no greater than that Reserve's current amount. Any remainder uses free money.
- The expense and Reserve adjustment form one atomic domain action.
- The first usable synchronization scope is the same Book across devices signed into the same iCloud account.
- `Book` remains shaped as the future CloudKit sharing root, but invitations, participant permissions, and concurrent editing across different iCloud identities are deferred.
- CSV export covers Transactions. Complete backup and restore covers Books, Accounts, Transactions, Transfers, Categories, Counterparties, Reserves, adjustments, snapshots, embedded rates, and required history.
- The primary UX remains amount-first. Amount and Account are the only required fields for an ordinary expense; date defaults to today, and the UI may remember recent Account and Category choices.
- The main screen distinguishes Free amount, Reserves, Available money, net worth, Accounts, and recent operations, with one prominent add-Transaction action.
- The Account eligibility rule is provisional: the current recommendation is that only Transactional accounts included in net worth may contribute to Available money. The user considered this plausible but did not make it a firm decision; Part 2 must validate it before implementation relies on it.

## Testing Decisions

- Good tests assert externally observable financial behavior and invariants rather than database rows, reducer internals, provider classes, or UI implementation details.
- The highest primary seam is the Book-level application/domain behavior: arrange a Book and its recorded history, perform one user action, then assert returned state and totals. This seam should cover Account balances, net worth, Available money, Free amount, Reserves, Transactions, Transfers, Category validation, conversions, edits, and deletions.
- The exchange-rate module interface is the second justified seam because it hides true external dependencies. Tests inject the in-memory provider adapter and assert normalized quotes, routing, triangulation, provenance, and failure results through the same interface used by callers.
- The CloudKit adapter is tested through the synchronization/persistence module interface using two logical local replicas. Tests assert idempotency, convergence, atomic operations, and preservation of embedded rates without asserting CloudKit record layout.
- Native adapter contract tests should remain small and verify only translation between the TypeScript-facing interface and Apple behavior. Domain calculations must not be retested through Swift internals.
- UI acceptance tests should focus on the amount-first expense path, explicit Reserve selection, immediate Free amount feedback, and absence of mandatory optional metadata.
- Property-based tests are appropriate for Category-cycle rejection, balance derivation, conversion consistency, and Reserve non-negativity because these invariants have large input spaces.
- Complete backup tests restore into an empty store and compare externally observable Book state and history. CSV tests verify stable exported financial meaning rather than internal identifiers.
- The repository contains no implementation or test-suite prior art yet. The existing handoff scenarios—tax Reserve, same-currency Transfer, currency exchange with fee, manually valued investment, and cross-device synchronization—are the behavioral prior art and should become acceptance fixtures.

## Out of Scope

- Periodic or category spending budgets; the POC implements targeted Reserves only.
- Requiring every unit of Available money to be allocated.
- Refund and chargeback semantics.
- Multiple Reserves funding one expense.
- Automatic Reserve consumption inferred from Category, Counterparty, amount, or any other heuristic.
- Negative Reserve balances.
- Destructive Category deletion that clears historical Transaction references.
- User-configurable exchange-rate provider routing.
- Final stale-rate, offline fallback, provider outage, and cache-expiry policy.
- Family invitations, different-iCloud-user sharing, roles, private areas, ownership transfer, and permission management.
- macOS implementation in the first target, despite remaining a preferred future platform.
- Android and web applications.
- Bank synchronization, PSD2, automatic categorization, receipt OCR, tags, complex rules, and split Transactions.
- Forecast cash flow, loan schedules, amortization, retirement planning, and detailed credit products.
- Detailed investment holdings, market quotes, tax lots, cost basis, tax calculation, and portfolio analytics.
- AI financial advice.
- Choosing a final local database schema, ORM, or record layout in this Part 1 concept checkpoint.
- Final resolution of cross-Book money movement and the provisional Account eligibility rule.

## Further Notes

- This is a Part 1 checkpoint intended to preserve decisions before the design conversation continues. It is authoritative for the decisions it states but must not be read as permission to infer answers for explicitly deferred topics.
- `ready-for-agent` applies to this bounded specification and its documented behavior. A later Part 2 may extend or supersede parts of it before the POC is considered implementation-complete. The POC proves the core experience and technical feasibility; it is not the later product-ready MVP.
- The two proposed test seams are the Book-level application/domain behavior and the exchange-rate module interface. They reflect the highest observable seams available in a greenfield repository and should be revisited only if Part 2 introduces a materially different architecture.
- The exact local persistence technology and the TypeScript-to-CloudKit record mapping remain open. CloudKit is a product constraint; its storage representation is not yet a domain decision.
- NBP is the initial provider, not part of the exchange-rate module interface. Historical operations retain their chosen quotes, so adding future providers does not rewrite them.
- The Free amount remains the central product promise: record an expense quickly, then immediately see how much remains uncommitted after explicit Reserves.
