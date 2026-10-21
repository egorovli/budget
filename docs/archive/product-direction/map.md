# Validate demand for Budgetly before a full build

Label: wayfinder:map

## Destination

Agree on a focused product concept and a demand-test plan that can be run before a full application is built. Define the audience, problem, proposed experience, evidence to collect, and the criteria for building, revising, or stopping.

## Notes

- On 2026-10-08 the user requested a detailed handoff for a working Expo browser prototype. The [implementation plan](../browser-prototype/spec.md) starts with a persisted Expense flow, then adds foundational entities, private source preview, simulated capture, and offline checks. This is a separate prototype effort; production implementation and campaign execution remain outside this discovery map.

- On 2026-10-08 the user requested a full glossary review focused on fundamentals. The active [glossary](../../GLOSSARY.md) now covers basic Accounts, Transactions, Transfers, Categories, Counterparties, amounts, dates, and optional Expense location. The [previous glossary](reference/glossary-before-foundations-2026-10-08.md) preserves later budgeting, valuation, membership, and lifecycle rules as historical reference. The user proposed consent-based expense coordinates and future nearby-Counterparty/Category suggestions; see [capture notes](research/automatic-capture-and-local-assistance.md#location-as-optional-expense-context). Accepted ADRs are unchanged.

- On 2026-10-08 the user clarified the modeling order: start with basic Accounts, Transactions, Categories, Counterparties, and their relationships before import reconciliation and other complex scenarios. Category nesting has no product depth limit; each Category can have a parent whose own parent can continue the hierarchy. Counterparties identify shops, businesses, or people involved in income or expenses, separately from Categories. These concepts match the current glossary.

- On 2026-10-08 the user requested research on financial data standards and domain modeling. [Standards and domain-model foundations](research/finance-standards-and-domain-model.md) compare exchange standards, accounting models, and candidate language, with synthetic scenarios for later checks. The research did not select an accounting architecture or replace accepted ADRs.

- On 2026-10-08 the user supplied normalized statement data and revisited automatic capture, historical currency handling, and local model assistance. [Capture and local assistance notes](research/automatic-capture-and-local-assistance.md) record verified platform capabilities and proposed tests. These are exploration notes, not completed integration or budgeting decisions.

- On 2026-09-12 the founder selected Clarity as the only active style and requested separate job campaigns. The [active Clarity campaign package](../../docs/design-experiments/2026-09-concepts/clarity-campaigns/README.md) replaces the older starting creative order. Scope includes research, generated visuals, local page previews, and delivery instructions; public execution remains out of scope.

- On 2026-09-12 the user explicitly requested a thorough, autonomous experiment kit: many promises, audiences, formats, channel combinations, and instructions for delegation to another model. Produce the full planning kit now using labelled assumptions; do not require the founder to settle every earlier discussion ticket before this preparation. This expands planning outputs to copy and production briefs. It does not authorize public delivery or spending.

- Use Wayfinder, grilling, and domain-modeling. Use research subagents for external facts and the prototype skill for artifacts that need a human response.
- This is a planning effort. The user changed direction from a complete first-release specification and technical direction toward product definition and demand validation before substantial development.
- The user selected individuals and households. Small-business finance is a possible later product scope.
- The user accepted connecting an existing agent as the initial AI direction. An assistant inside the app is not a settled requirement.
- The user did not select a launch country and considers Poland a narrow market. Do not turn the earlier Poland-first brief into a current constraint. Experiment geography and supported financial institutions remain decisions.
- Preserve the proposed product qualities: trustworthy financial reporting, budgeting, useful bank synchronization, fast entry, offline financial workflows, and no advertising-based business model. These are product intentions; the first concept's exact promises remain open.
- The user proposes mock screens, videos, or other lightweight artifacts and focused ad campaigns to test interest before months of development. A campaign is a possible experiment method, not yet a chosen channel or authorized spend.
- The user can supply financial statements to test domain assumptions and correctness. Original private documents stay outside Git; use synthetic derived examples for repository fixtures. Statements show financial records but do not establish user intent or market demand.
- Current principles and glossary remain reference material. Existing MVP exclusions and the personal-iCloud-first ADR need explicit review if the chosen concept conflicts with them.
- Initial Money Flow evidence: [Money Flow reference check](research/moneyflow-reference.md). Product identity is provisional; gesture quality and performance have not been tested.
- Each ticket owns its answer. This map indexes completed decisions only. Open tickets are found in `issues/` through status and blocking fields.

## Decisions so far

- [Focus Clarity campaigns on four useful jobs](issues/09-focus-clarity-campaign-promises.md) — Bank sync, envelope allocation, transaction retrieval and purchase checks now have separate Clarity concepts and a consistent price-aware test plan.

- [Interpret evidence from ads and product concepts](issues/02-interpret-prebuild-demand-evidence.md) — Tests establish bounded signals; define the decision rule first and follow initial interest with behavior tied to the proposed value.
- [Select the first user problem to test](issues/01-select-first-user-problem.md) — The founder selected one connected workflow: keep Accounts current, plan individual or shared spending, and understand what remains available.
- [Prepare the demand experiment kit for delegation](issues/08-prepare-delegated-demand-kit.md) — A complete catalogue, prioritized creative briefs, handoff prompts and experiment rules are ready for delegated preparation using labelled assumptions.

## Not yet specified

- Which financial reporting and forecasting cases the selected experience requires, including payment timing and cost attribution.
- What household Members share and control, and which collaboration cases the proposed experience must cover.
- Which bank-connection and agent-access claims need a small feasibility investigation before the concept is shown to users. The institutions and workflows depend on the selected audience and promise.
- How to use supplied statements in domain examples once the relevant financial workflows are known.
- What delivery scope and technical decisions a positive demand signal would justify. Revisit these after the experiment, rather than specifying the full application now.

## Out of scope

- Building or releasing the production application within this map.
- Launching campaigns, spending money, collecting payments, or recruiting participants within this planning effort. These belong to the subsequent execution of the agreed experiment.
- Full business bookkeeping in the initial product concept; the user selected individuals and households.
- Treating clicks, signups, mock interaction, or one household's records as proof of long-term product use.
