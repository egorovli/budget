# Project principles

These principles govern product and engineering decisions in Sort of Budget, in the
order listed below. We do not knowingly compromise a higher-priority principle
to improve a lower-priority one. Security and correctness are release gates: if
they conflict or either is unresolved, we do not ship until the risk is resolved.

## 1. Security and privacy

- Protect financial data with secure defaults and least-privilege access.
- Minimize the sensitive data we collect, retain, expose, and send to third
  parties.
- Treat secrets, logs, exports, backups, and synchronization as part of the
  security boundary.
- Evaluate new features and dependencies against an explicit, realistic threat
  model before adoption.

## 2. Correctness and data integrity

- Every financial answer must derive deterministically from auditable source
  records.
- Preserve original amounts, currencies, rates, and history. Never rewrite or
  "fix" financial data silently.
- Keep related changes atomic and synchronization idempotent; partial updates
  and duplicates must not corrupt totals.
- Make uncertainty and invalid states visible instead of presenting plausible
  but untrustworthy values.
- Cover critical domain invariants and failure modes with automated tests.

## 3. Recoverability and user ownership

- The user's data belongs to the user and must remain portable.
- Keep full export and restorable backup available independently of any single
  device or provider.
- Design destructive actions to be explicit and recoverable where practical.
- Verify recovery paths; a backup is not complete until it can restore the
  entities and history needed to reproduce the user's financial state.

## 4. Offline-first, online best-effort

- Once a Book is available on a device, its core financial workflows and
  complete working state must remain usable without a network connection.
- Persist user changes durably on the device before attempting network
  operations. Connectivity must not gate recording, viewing, editing,
  exporting, or backing up financial data.
- Synchronization, sharing, and other online-dependent capabilities run
  asynchronously and may be delayed or unavailable. They must never block,
  roll back, or silently discard valid local work.
- "Best effort" applies to online availability and timing, not to data
  integrity: surface pending, failed, and conflicting changes, and reconcile
  them without silent loss, duplication, or overwrite.

## 5. UI/UX and accessibility

- UX is part of the product's correctness, not decoration. The correct action
  and the meaning of every financial number should be clear.
- Keep frequent workflows fast and low-friction: amount first, minimal required
  fields, and no unnecessary steps.
- Use the project's domain language consistently so that balances, available
  money, reserves, and net worth cannot be confused.
- Build for accessibility from the start and do not depend on color, precision
  gestures, or hidden behavior to communicate essential information.

## 6. Performance and efficiency

- Keep core interactions responsive and measure them against explicit budgets.
- Optimize observed bottlenecks and realistic workloads rather than speculative
  future scale.
- Treat performance that blocks or destabilizes a core workflow as a UX or
  correctness problem, while never weakening a higher-priority principle for a
  micro-optimization.

## 7. Simplicity and maintainability

- Prefer the smallest design that preserves the domain invariants and supports
  the current vertical slice.
- Keep boundaries and ownership explicit; make important behavior easy to test,
  explain, and change.
- Avoid premature scope, dependencies, abstractions, and configuration.
- Record consequential exceptions and trade-offs in an ADR.

## Decision rule

When choosing between approaches, ask in order:

1. Does either approach introduce an unacceptable security or privacy risk?
2. Can it corrupt, lose, duplicate, or misstate financial data?
3. Can the user recover and take ownership of their complete data?
4. Can the core workflow continue correctly from durable local state while
   online services are unavailable or delayed?
5. Is the correct action clear, low-friction, and accessible?
6. Does the core workflow meet a measured performance need?
7. Which remaining approach is simpler to understand, test, operate, and evolve?

Related project context lives in [`GLOSSARY.md`](../GLOSSARY.md), the product brief
and financial invariants live in [`docs/initial-handoff/README.md`](initial-handoff/README.md),
and consequential architectural decisions live in [`docs/adr/`](adr/).
