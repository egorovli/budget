# Clarity — a precise daily instrument

Clarity makes the next decision easy to read. The first screen answers “What is free to spend?” and shows how that answer follows from Accounts and funded Reserves. The visual identity comes from strong type, aligned amounts, and one cobalt action colour.

## System specification

These tokens describe the intended implementation. Generated pixels can vary slightly.

| Role | Specification |
| --- | --- |
| Main surface | Chalk white `#FFFFFF` |
| Group background | Cool grey `#F4F6FA` |
| Main ink | Near-black `#101319` |
| Secondary ink | Slate `#646D7B` |
| Action and selected state | Cobalt `#245BFF` |
| Preview surface | Pale blue `#EAF1FF` |
| Separator | Grey `#E3E7EE` |
| Typeface | Native SF Pro on iOS; neutral system sans elsewhere |
| Display amount | 56–64 pt, bold, tight line height, no abbreviation |
| Screen heading | 30–34 pt, bold |
| Section heading | 19–21 pt, semibold |
| Row and control text | 16–17 pt, regular or medium |
| Supporting text | 13–14 pt, regular; scale with user settings |
| Numerals | Tabular lining figures in rows; right aligned; consistent currency and minus sign |
| Spacing | 4, 8, 12, 16, 24, 32, 48 pt; main page inset 20–24 pt |
| Corners | 12 pt action; 14 pt preview inset; capsule Book switcher |
| Borders | One physical pixel for separators; no unnecessary row container |

Colour shows an action or selection. It does not mean money is guaranteed safe to spend. Generic line icons use a consistent 1.5–2 pt stroke, with one solid selected navigation icon. The product uses no decorative illustration, mascot, bank logo, or AI chat surface.

## Information and chart grammar

Overview gives the Free amount the largest type. A visible reconciliation explains it: $5,000 Available money − $4,400 funded Reserves = $600 Free amount. The Account strip preserves the separate meaning of balances: Everyday $3,000, Joint $1,800, Cash $200.

A single allocation rail can divide current Available money into funded Reserves and Free amount. Its only denominator is $5,000. Exact production segments must be 88% and 12%. Text must remain sufficient when the chart is hidden. Generated rail lengths are approximate, especially in the ad.

Plan uses a ledger, with each Reserve name and amount on one line. The generated blue row marks suggest progress but have no defined target denominator. They are a visual exploration only. Remove them in production unless a target is present and the fraction can be explained; never infer a target from the image.

## Navigation and interaction

The Book switcher stays at the top. Overview, Activity, and Plan form the three main tabs. A plus action starts actual Transaction entry. The image shows duplicate plus affordances; implementation should keep only the one that proves easiest to reach in a usability check.

Purchase check is a hypothetical calculation. Entering $120 shows “Free after purchase $480”. “Done” closes the preview. It does not save an expense, alter the Account balance, or move money from a Reserve. Actual expense entry is a separate flow with an explicit save action.

Suggested motion: 160–220 ms sheet and selection transitions, no bouncing financial amounts. Amount changes may cross-fade or use a short digit transition. Reduce Motion removes movement. A light haptic can confirm a saved Transaction, but a calculation should not imitate a save confirmation.

## Three product moments

1. **A clear current answer.** The large $600 catches attention. The rows directly beneath show the basis for that answer.
2. **A shared plan that remains concrete.** Rent $1,800, Groceries $600, Bills $400, and Emergency fund $1,600 remain visible, rather than hidden behind a single total.
3. **A decision before spending.** A $120 purchase preview leaves $480 Free amount. The user can check a choice without modifying their records.

## Campaign

The matched headline is “Know what’s free to spend.” The subline is “Accounts, commitments, and your next decision.” The phone is the evidence: its large answer, source totals, and purchase check action support that claim. “Explore the concept” and “Concept preview · Not yet available” keep the offer clear.

Later hooks worth testing within this style: “Three accounts. One clear answer.” and “Every total has a trail.” The first needs the Account strip; the second needs a separate drill-down screen showing source Transactions. The current image does not prove working bank sync or a working drill-down.

## Accessibility and review limits

Production must support Dynamic Type, VoiceOver reading order, 44 pt minimum hit areas, labelled icons, clear focus, non-colour selection indicators, and measured text contrast. Long Book and Reserve names must wrap or truncate without losing the amount. None of these behaviours is validated by a raster image.

The final board is 1536 × 1024. The ad is 1122 × 1402, close to 4:5. All required financial amounts and the revised “Done” action were visually checked. The ad and board have minor composition differences because they were generated independently. These are original visual proposals inspired by inspected references, not a claim of finished software or measured demand.
