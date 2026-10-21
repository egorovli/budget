# Anti Slop audit: working prototype

Mode: after, selected by the user. Scope: working browser/native flow. Separate Reserve, valuation and native UI experiments are outside this audit.

## Findings

1. **HIGH · R-25 · Dark primary button contrast.** `packages/mobile/src/components/prototype-ui.tsx` uses the theme label color on the accent background. In dark mode, white on `#0a84ff` is 3.65:1. Normal text requires 4.5:1. Minimal proposed fix: keep the current blue and use black primary-button text. Black on this blue passes. Secondary buttons keep their theme label color. Awaiting approval under after mode.
2. **Validation limit · R-35.** Native export creates a valid JSON snapshot and opens the share sheet. Device Hub exposes no accessible Save-to-Files controls for automation. Coordinate clicks did not activate Save-to-Files. Native file saving and picker restore need a manual check. No code defect is established by this limit.

## Delivery gate

- PASS R-02/R-17/R-18/R-23/R-24/R-28/R-36/R-38: core copy uses no em dashes, fabricated claims, testimonials, new visual assets, FAQ or placeholder navigation. Data is labeled synthetic/manual or read-only source.
- PASS R-03: inspected 390×844 Counterparty and 120-level Category screens; text wraps and there is no horizontal overflow.
- FAIL R-25: finding 1. Checked secondary text: 4.69:1 on the light surface; 7.31:1 on black. Light primary button text passes at 5.23:1.
- PASS R-26/R-27: working actions have handlers; loading, empty, missing-record, validation and storage errors have visible states. Native file UI validation is limited as above.
- PASS R-32: browser Tab reaches labeled inputs with visible focus; native keyboard text entry and scrollable forms were exercised.
- PASS R-33/R-34: changes are in source. Existing adaptive themes remain; dark contrast is the explicit exception.
- PARTIAL R-35: browser core, offline, reload, restore, capture and conflict flows ran. Native create/edit/restart and export ran; finding 2 remains.
- PASS Purpose gate: reused system typography, phone layout, spacing and accent. No gradients, glow, decorative imagery or new icon system.
- PARTIAL Liveliness gate: existing visual direction was retained as the spec requests. No separate visual redesign or pre-build energy/rhythm/motion dials were specified. This is a functional prototype, not a final visual design.
- PASS Craftsmanship: source totals are separate, money is exact, writes await persistence, recovery is explicit. User feedback is still needed on entry speed, deep paths and capture review.

The after-mode skill requires approval of finding numbers before UI fixes. No audit-only visual change has been applied.
