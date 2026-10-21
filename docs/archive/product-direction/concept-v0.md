# Budgetly — product concept 0.1

Status: proposal for discussion, not a validated specification.

Decision context: [Define the product promise and core experience](issues/03-define-testable-product-promise.md).

## Product promise

**Your money, up to date. Your plans, in one place. See what you can spend.**

Budgetly helps an individual or household keep a reliable financial picture, plan how to use their money, and make everyday spending decisions. Automatic collection, fast manual entry, and access for an existing agent support the same workflow.

## First user hypothesis

A person who manages their own or their household's money across several Accounts and needs to consider upcoming costs before spending. A household can plan together; an individual uses the same financial workflow alone.

The three connected needs are selected by the founder. The frequency of the problem, current workarounds, willingness to switch, and willingness to pay still need evidence from prospective users. No interview findings are claimed here.

## The everyday loop

1. **Get the picture current.** Collect records from supported institutions. Make manual entry quick. Show which Accounts are current and which records need review.
2. **Make a plan.** Give available money a purpose: upcoming costs, daily spending, or goals. Let household Members work from the same Book and understand changes to the plan.
3. **Make a spending decision.** Show what remains for the relevant purpose and what a proposed purchase would change.
4. **Keep the plan useful.** As expenses arrive, update the financial picture, reveal differences from the plan, and let the user adjust it.

## Four-screen storyboard

These are candidate screens for a later mockup. Their names and layout are proposals. All people, Accounts, and amounts below are synthetic. EUR is used for the example and does not select a launch market.

### 1. Overview — understand the picture

The first screen shows the selected Book, recorded Account balances, the status of bank updates, and a short view of the plan.

Example Book: Our home. Alex and Sam are Members. Two eligible liquid Accounts hold €3,200 and €1,800: €5,000 in recorded available money.

Both Accounts show their last successful update. The screen links to the source records behind each balance. A review item must explain whether it affects the displayed totals; it cannot leave that ambiguous.

Primary action: inspect money available for a spending purpose. A visible add-expense action remains easy to reach.

### 2. Activity — maintain accurate records

Show incoming records and the financial operations they represent. A transfer between the two Accounts must not appear as household income or expense.

Example interaction: Alex records a €40 grocery purchase while offline. When the corresponding bank record arrives, the app should help reconcile the two records into one expense, preserving the user's useful details. The recorded Account balance must decrease once.

The mockup must distinguish a confident match from a proposed match that needs review. Neither the matching policy nor the actual bank integration is decided by this storyboard.

### 3. Plan — give money a purpose

An illustrative envelope view assigns the full €5,000 already available:

| Purpose | Remaining allocation |
| --- | ---: |
| Rent | €1,800 |
| Groceries | €600 |
| Bills | €400 |
| Savings goal | €1,600 |
| Flexible spending | €600 |
| **Total assigned** | **€5,000** |
| **Not yet assigned** | **€0** |

This snapshot is independent of the Activity example. It contains no debt, pending payments, currency conversion, or forecast income.

Zero not-yet-assigned money does not mean zero money available to spend. The plan still has €600 for groceries and €600 for flexible spending. The design must make that difference clear.

A household Member can inspect the same plan and its change history. What each Member may see or change, and how simultaneous offline changes are resolved, remain open decisions.

This envelope example is a hypothesis. It does not silently replace the current Reserve model or require every user to allocate all their money.

### 4. Purchase check — understand a decision

Sam considers a €120 purchase from flexible spending. The screen shows a preview:

- Flexible spending: €600 → €480.
- Other allocations: unchanged.
- Recorded available money: €5,000 → €4,880 if the expense is recorded.

The preview changes no records. It is a calculation against the displayed snapshot, not a guarantee that no unknown expense exists. Show an Account's stale-update state when it affects this answer.

An external agent could request the same preview after the user grants access to the Book. Example request: “What would a €120 purchase change in our plan?” The result should identify the Book, source snapshot, assumptions, and affected allocation. The proposed first workflow reads and models a scenario; agent write permissions remain undecided.

## Product requirements to test

- The user understands the difference between an Account balance and money allocated to a purpose.
- Maintaining records requires little routine work, and errors are easy to find and correct.
- An individual can use the core workflow without adding another Member or connecting an agent.
- Household use makes shared plans easier to understand; it does not require all personal financial data to become shared by assumption.
- Core records, manual changes, reports, and scenario calculations remain usable from local data while offline. Bank updates and remote-agent connections need connectivity.
- Income and expense reports retain a traceable relationship to source records. Payment dates and cost attribution must be investigated before promising multiple accounting methods.
- Gestures can accelerate frequent actions, with visible alternatives for essential actions.

These are proposed outcomes and concept evaluation questions, not completed implementation requirements.

## First concept-test proposal

Show the four-step story and ask a prospective user to explain the numbers, make a spending decision, and describe the last time they faced a similar situation. Observe where they misunderstand the plan or do not see a reason to change their current workflow.

An initial landing-page draft could use the product promise above, the story, and a clearly marked early-access invitation. Screens must be identified as a proposed product. Supported banks and availability cannot be advertised as established facts before verification.

Campaign targeting, price, channel, budget, metrics, and the decision rule are separate open tickets. This concept does not establish demand or authorize a campaign.

## Decisions exposed by this draft

- How envelope allocations relate to the existing Reserves, Categories, and free balance, including whether full allocation is optional.
- What a household shares and how it controls access.
- Which bank connections can support the chosen audience and promise.
- Which uncertainty and review states must remain visible without making everyday use burdensome.
- Whether the story itself makes existing-agent access valuable, or whether a different agent workflow is needed.

The next review should identify what feels useful, confusing, or missing in this concrete story. It need not settle the full application design.
