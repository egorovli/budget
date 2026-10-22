# Horizon

A clear view of money, with the atmosphere of a precision celestial app. Light brings attention to the amount the person can use. The rest is quiet, exact, and easy to inspect.

## What this direction takes from the references

- [Tide Guide](../../../design-references/apple-design-awards/images/tide-guide-charts-tables/03.jpg): clear labels beside data and a strong native screen structure.
- [Lumy](../../../design-references/apple-design-awards/images/lumy/02.jpg): one dominant answer, a restrained horizon, and depth from light rather than extra cards.
- [Sunlitt](../../../design-references/apple-design-awards/images/sunlitt/04.jpg): dark grouped information, aligned values, and quiet symbolic icons.

The images are original Sort of Budget concepts. They do not copy those apps' artwork or claim an Apple award.

## Design system

| Role | Specification |
| --- | --- |
| Canvas | Midnight `#090D1A` |
| Screen | Ink blue `#0C1225` |
| Grouped surface | `#131D36`; use only for input groups and a decision result |
| Primary text | Cool white `#F4F5FC` |
| Secondary text | Lavender gray `#A8B1CA` |
| Active control / Reserved | Periwinkle `#AAA6FF` |
| Free allocation / light | Peach `#FFD4AB` |
| Separator | `#293752`; 1 physical pixel where possible |
| Typography | Native SF Pro or platform system sans; 32 pt bold title, 56–64 pt semibold main amount, 20 pt semibold section, 17 pt body, 13 pt supporting label |
| Numerals | Tabular lining figures in rows; right aligned; no rounding or shortened currency values |
| Spacing | 4, 8, 12, 16, 24, 32, 48 pt; 24 pt side gutters; 56–64 pt main rows |
| Shape | 14 pt input-group radius; 16 pt result radius; pill only for Book selector and Preview indicator |
| Icons | 1.5–2 pt outline, 22–24 pt square; filled active tab; no emoji or bank logos |

These are implementation targets. Image generation approximates them; the bitmaps are not measured component exports.

The main area has one broad periwinkle illumination with a small peach horizon. Do not repeat gradients behind every row. Text remains on a stable dark surface. Cards identify a control group or decision result, rather than every number. Lists use open rows and fine separators.

## Chart grammar

The Overview arc shows one current allocation of $5,000. Reserved is $4,400, or 88%; Free is $600, or 12%. In implementation, map these to 158.4° and 21.6° of a 180° arc. Label both parts and repeat the values in text. The light below is decorative and has no time or money axis. Do not use it as an invented cash-flow forecast. The month strip in Plan is navigation only, with no inferred daily values.

## Three useful moments

1. **See what is Free.** Today leads with $600, then shows Available money $5,000 and Reserved $4,400. Everyday $3,000, Joint $1,800, and Cash $200 explain the Account total. The Free amount is not an Account balance or Net worth.
2. **Inspect the shared plan.** Four funded Reserves total $4,400: Rent $1,800, Groceries $600, Bills $400, and Emergency fund $1,600. Free amount remains $600. The named Book makes the household scope visible.
3. **Check before a purchase.** A hypothetical $120 purchase from Everyday, with no Reserve, leaves a preview of $480 Free. The Done action closes the check. It does not record an expense or change Account balances. Expense entry is a separate flow, to be designed later.

## Navigation and motion intent

Today, Plan, and Activity form the main navigation. The Book selector stays in a consistent place. Purchase check is a focused sheet or pushed screen, with an explicit Preview indicator and clear exit. Amount changes update the result in place. A 180–220 ms fade or number transition can help the person follow the change. Do not use continuous shimmer, fake live pulses, or haptics for ordinary recalculation. With Reduce Motion, use an immediate update. Haptics may confirm an explicit tap, never imply a bank action succeeded.

## Accessibility and offline intent

Use at least 44 × 44 pt touch targets and test text contrast at the actual rendered colours. Support Dynamic Type with stacked value rows at large sizes. Every icon has a text label. Colour never carries financial meaning alone. Read the allocation as one accessible summary followed by the exact values. Native input semantics and screen-reader order must match the visual order. Data and purchase calculations should work offline from local records; an honest sync timestamp belongs in the implemented Account detail, not a fabricated live claim in the concept.

## Campaign

Matched hook: **Know what’s free to spend.**

The image shows why the promise is plausible: one dominant Free amount, the Account total, and money already reserved. It invites a next decision rather than promising financial success. Midnight contrast and a luminous but controlled phone earn attention. Further hook ideas for later tests are “See the month before it happens” and “A clearer view of your next decision”; those require their own truthful proof before launch.

## Deliverables and limits

- [Three-screen board](app-board.png), 1536 × 1024.
- [Portrait campaign](ad-portrait.png), 1122 × 1402, approximately 4:5.
- [Exact prompts and correction history](prompts.md).

Financial values and main copy were visually checked. These are synthetic raster concept images. Interactions, accessibility, sync, acquisition performance, and willingness to pay are not tested. The generated ad changes some row grouping and icon details from the board; a later coded design should use shared components. The final ad requires a precise placement export before launch.
