# Budgetly: design

Status: 2026-10-21. The direction is **Clarity**, selected on 2026-09-12 from four candidates. The full direction and campaign notes are in [`archive/design/`](archive/design/). The images and campaign exports were deleted.

## Character

Clarity is a precise daily instrument. The first screen answers one question and shows how the answer follows from the records. Strong type, aligned amounts and one action colour make the identity. The app has no illustration, mascot, bank logos or AI chat surface.

References that the founder likes: Flighty, Crouton, Speechify (the closest to Clarity), and also Gentler Streak, Tide Guide, Lumy, Mela, Structured, (Not Boring) Habits, Sunlitt. Use them as references only, not as UI to copy ([award notes](archive/design/apple-design-awards/award-findings.md)).

## Tokens

| Role | Value |
| --- | --- |
| Main surface | `#FFFFFF` |
| Group background | `#F4F6FA` |
| Main ink | `#101319` |
| Secondary ink | `#646D7B` (on `#F6F7F9` use at least `#667182`, about 4.6:1) |
| Action and selected state | Cobalt `#245BFF` (white text gives about 5.2:1) |
| Preview surface | `#EAF1FF` |
| Separator | `#E3E7EE`, one physical pixel |
| Typeface | SF Pro on iOS; system sans elsewhere |
| Screen title | 30–34 pt bold |
| Section heading | 19–21 pt semibold |
| Rows and controls | 16–17 pt (14–16 px in the refined web layouts) |
| Supporting text | 13–14 pt; scales with Dynamic Type |
| Large amount | 56–64 pt bold, only for amount entry or the main answer |
| Numerals | Tabular lining figures, right aligned, consistent currency and minus sign |
| Spacing | 4, 8, 12, 16, 24, 32, 48 pt; page inset 20–24 pt |
| Corners | 12 pt actions, 14 pt preview inset, capsule Book switcher |
| Motion | 160–220 ms sheets and selection; amounts do not bounce; Reduce Motion removes movement |

Colour shows an action or a selection. **Colour never means that money is safe to spend.** Line icons use a 1.5–2 pt stroke; the selected tab icon is solid.

## Information rules

- **Main answer with its basis.** Show a large answer, and directly under it the rows it comes from. Example: Available $5,000 − Reserved $4,400 = Free $600. The Free amount is never shown as a bank balance.
- **Account balances keep their meaning.** Show each Account with its source and freshness. Cash is "Add by hand", never a bank connection. Do not copy a bank's "available" figure, which can include overdraft, into Available money.
- **A chart has one stated denominator.** The text must be sufficient when the chart is hidden. Do not draw progress without a defined target.
- **Purchase check is a preview.** It has one amount input, a short result ("Free after purchase $480") and **Done**. It records nothing, moves no money, and its Reserve default is None. Real expense entry is a separate flow with an explicit Save.
- **Planning does not move money between Accounts.** Say this in the UI.

These rules use Reserves and Free amount as defined in [`GLOSSARY.md`](../GLOSSARY.md) (decision 2 in [product.md](product.md#decisions-of-2026-10-21)).

## Navigation

The Book switcher is at the top. There are three main tabs: Overview, Activity, Plan. One plus action starts Transaction entry. Keep only one plus action: the one that is easiest to reach in a usability check. Use system `Stack` and `NativeTabs` first, and do not draw custom glass on content ([Liquid Glass research](research/ios-26-liquid-glass.md)).

## Copy

- Write as one person explaining a useful app to another. Use ordinary words: rent, groceries, payment, account, money set aside.
- Use sentence case.
- Keep these labels precise: **Left to assign**, **Free after purchase**, **Use a reserve**.
- Do not turn a projected result into permission to spend. The app cannot know about an unrecorded bill.
- Do not promise all banks, instant updates, automatic cash records or guaranteed savings. Do not scold the user about spending.
- Avoid filler words such as seamless, effortless, smarter and peace of mind.

The full rules and the app label changes are in [archive/design/clarity-campaigns/COPY.md](archive/design/clarity-campaigns/COPY.md).

## Accessibility

Required from the start:

- Dynamic Type.
- A correct VoiceOver reading order.
- Hit areas of at least 44 pt.
- Labelled icons and a visible focus.
- Selection that does not depend only on colour.
- Measured contrast.
- Long Book, Account and Category names wrap without hiding the amount.

Known issue from the prototype: the dark primary button had 3.65:1 contrast ([audit](archive/specs/browser-prototype-audit.md)).

## Not decided

- The code of the browser prototype did not use Clarity. No production screens exist.
- The envelope view ("All $5,000 assigned") and Reserves + Free amount were drawn as separate campaign hypotheses. On 2026-10-21 we selected Reserves + Free amount; the envelope view is not used.
