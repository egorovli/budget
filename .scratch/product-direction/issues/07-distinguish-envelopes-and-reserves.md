# Define how envelopes relate to Reserves and available money

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 03
Parent: ../../../docs/product.md

## Question

For the chosen product experience, are envelope allocations a use of the existing Reserve model or a different concept? Is full allocation optional, how does an expense affect an allocation, and how should the app explain the difference between unassigned money and money available to spend for a purpose? Use the synthetic example in [Budgetly — product concept 0.1](../../../docs/archive/product-direction/concept-v0.md). Reconcile the answer with the current glossary instead of silently changing Category, Reserve, or free-balance semantics.

## Answer

Resolved with the founder on 2026-10-21: Reserves + Free amount, in the simplest form. Envelopes are not used, and full allocation is not required. Reason: the user thinks about upcoming costs before spending and does not assign every unit of money; full allocation is what YNAB already does.

- A Reserve is a part of Available money set aside for an upcoming cost or goal. It has a name, an amount and an optional due date. It is not an Account and does not move money.
- Free amount = Available money − active Reserves. It can be negative.
- An ordinary Expense does not change a Reserve. A Reserve-funded expense reduces the selected Reserve in the same record.

The glossary has these terms again. The first slice tests them ([issue 10](10-build-the-free-amount-slice.md)). See [Decisions of 2026-10-21](../../../docs/product.md#decisions-of-2026-10-21).

## Comments

2026-10-21: The first answer deferred this choice until after an import slice. The founder changed the first slice to the Free amount on the same day, so the choice is made now.
