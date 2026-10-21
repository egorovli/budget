# Research live synchronization with the founder's banks

Type: research
Status: open
Parent: ../../../docs/product.md

## Question

Can one person get the records and balances of their own Accounts at Erste (Poland), Revolut and TBank automatically, for personal use, without a company or a licence?

For each bank, find:

- The available access paths: a PSD2 aggregator that allows access to one's own accounts (for example Enable Banking or GoCardless Bank Account Data), a bank API, or a regular statement export.
- The conditions: account type, cost, contract, how long a consent stays valid, rate limits.
- The data: booked and pending records, transaction IDs, balance types, exchange details, and how much history is available.
- The risks: where the data goes, which credentials the app must keep, and what the threat model must cover ([principle 1](../../../docs/principles.md)).

## Expected result

A research file in `docs/research/` with primary sources, and one recommendation for each bank: synchronization, statement import only, or not possible. Note what is uncertain. This ticket does not block [issue 10](10-build-the-first-slice.md).
