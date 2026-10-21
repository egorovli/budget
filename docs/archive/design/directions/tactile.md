# Tactile — money with a sense of touch

Original Budgetly design concept for individuals and households. The app makes the Free amount the first decision number and gives each Reserve a compact physical form. Two final generated assets are included: [three-screen board](app-board.png) and [portrait campaign](ad-portrait.png). All financial records are synthetic.

## Design system

| Role | Specification |
| --- | --- |
| Screen background | Warm ivory `#F3F0E8` |
| Primary text and solid surfaces | Ink `#20211F` |
| Accent | Persimmon `#FF642E`; actions and the Free segment |
| Secondary text | Graphite `#62635E` |
| Dividers | Warm gray `#D9D5CB` |
| Raised surface | Chalk `#FAF8F2` with a restrained contact shadow |
| Type | SF Pro Display for iOS headings and amounts; SF Pro Text for body and controls. Generated images approximate these roles rather than embedding a verified font. |
| Type scale | Hero amount 76 pt/76, title 34/38 bold, section 22/28 semibold, body 17/22, metadata 13/18. Numeric values use lining tabular figures; currency signs stay on the baseline. |
| Space scale | 4, 8, 12, 16, 24, 32, 48 pt. Main horizontal inset 20–24 pt. |
| Surface grammar | One main canvas; account rows share a grouped surface. Reserves use compact horizontal trays, radius 14 pt. Primary buttons use continuous corners, 28 pt radius. Keypad controls use 10 pt. |
| Icons | Familiar 1.75–2 pt line icons with matching optical weight, no proprietary borrowed artwork. Color reinforces selected navigation but does not replace text. |

Tactility is structural: shallow Reserve trays, compact orange edges, a physical stack as the allocation motif, and short button depth. The motif must not imply that the four objects have equal dollar values. The numerical labels carry the exact amounts. Avoid decorative tactile surfaces on every row.

## Three product moments

1. **Understand today.** Overview reads $5,000 Available money and $4,400 Reserved, leaving a $600 Free amount. Account values are Everyday $3,000, Joint $1,800, and Cash $200. Future income is excluded.
2. **Give money a purpose.** Your plan shows Rent $1,800, Groceries $600, Bills $400, and Emergency fund $1,600. These funded Reserves total $4,400; $600 stays Free.
3. **Check a choice.** Purchase check previews a $120 purchase from Everyday, using no Reserve. Free after purchase is $480. **Done closes the hypothetical preview. It does not save an expense or change any balance.** Recording an actual expense is a separate action reached with the global plus.

## Charts and navigation

One linear allocation bar represents the available total: 88% Reserved in ink and 12% Free in orange. Exact text values remain next to it. Future implementation must generate lengths from data, never hand-draw proportions. No investment chart, Net worth claim, arbitrary score, or forecast appears.

Overview, Plan, and Activity form the bottom navigation. The orange plus opens entry. A pushed Purchase check screen uses a familiar back route and a Done control; it does not keep unrelated navigation below a keypad.

## Interaction and accessibility

Proposed motion: one 120–180 ms press response with a small depth change, and a 200 ms position change when a Reserve is moved or funded. Haptic confirmation follows completed actions. No confetti. Reduce Motion removes dimensional travel and preserves immediate feedback. Motion is an intent, not a tested result in these stills.

Future controls have at least 44 pt hit areas, support Dynamic Type, announce full amount labels to VoiceOver, and preserve the same reading order as the visual hierarchy. The generated board uses light text on orange in several controls. This is a known contrast concern; production should use ink on orange or a darker accent after measured contrast checks. Screenshots do not establish accessibility compliance.

## Campaign idea

Matched hook: **Know what’s free to spend.**

Subline: **Accounts, commitments, and your next decision.**

The dominant phone proves a concrete hierarchy: a Free amount with visible source totals and Accounts. The physical slab behind it ties the ad to the app’s allocation motif. The presentation says **Concept preview · Not yet available**, and the CTA is **Explore the concept**.

Possible later message tests: “Put your money where your plans are.” and “Make room for what matters.” These are ideas, not extra claims added to the matched ad.

## Reference interpretation

- [Not Boring Habits reference](../../../design-references/apple-design-awards/images/not-boring-habits/02.jpg): bold figure-ground contrast and a meaningful physical object. No checkmark mascot or source artwork copied.
- [Structured reference](../../../design-references/apple-design-awards/images/structured/02.jpg): direct hierarchy, explicit tap targets, and readable repeated rows.
- [Crouton reference](../../../design-references/apple-design-awards/images/crouton/02.jpg): compact controls placed beside the task and practical grouping.

The reference paths above are local research sources; the final images are original generated designs.

## Actual result and limits

- Board: **1536 × 1024 PNG**. The requested larger canvas was not returned.
- Ad: **1122 × 1402 PNG**, approximately 4:5 (the tool did not return an exact pixel-perfect 4:5 canvas).
- Generated finance labels and principal amounts were visually inspected. The ad allocation bar was corrected from a misleading half-width orange section to a small Free segment; exact production proportions still require deterministic rendering.
- The ad and board share a palette and component family, with minor differences in the rendered stack, header, and controls. They are direction studies, not pixel-identical screenshots from one implemented app.
- These images do not demonstrate sync, working interaction, offline behavior, accessibility, or demand. No campaign was launched.
