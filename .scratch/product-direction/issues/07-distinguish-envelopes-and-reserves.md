# Define how envelopes relate to Reserves and available money

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 03
Parent: ../../../docs/product.md

## Question

For the chosen product experience, are envelope allocations a use of the existing Reserve model or a different concept? Is full allocation optional, how does an expense affect an allocation, and how should the app explain the difference between unassigned money and money available to spend for a purpose? Use the synthetic example in [Budgetly — product concept 0.1](../../../docs/archive/product-direction/concept-v0.md). Reconcile the answer with the current glossary instead of silently changing Category, Reserve, or free-balance semantics.

## Answer

Resolved with the founder on 2026-10-21: deferred until after the first slice. Planning sits on top of the records and does not change Accounts, Transactions, Transfers, Categories or Counterparties, so the first slice does not depend on this choice.

The preliminary choice is Reserves + Free amount, with optional allocation. Reason: the user thinks about upcoming costs before spending and does not assign every unit of money; full allocation is what YNAB already does. We confirm or change this after a few weeks of use with real data. The glossary does not change now: Reserves and Free amount stay deferred. See [Decisions of 2026-10-21](../../../docs/product.md#decisions-of-2026-10-21).
