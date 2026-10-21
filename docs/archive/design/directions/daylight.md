# Daylight

A warm household companion. The primary question is simple: after funded Reserves, how much money is free for the next decision?

## System

| Role | Specification |
|---|---|
| Paper | `#FFF9F1` |
| Primary ink | `#302722` |
| Secondary ink | `#6C5E54` |
| Action tomato | `#C64F3B` |
| Apricot accent | `#F3B88F` |
| Apricot surface | `#FBE3D1` |
| Lavender surface | `#E8E2F1` |
| Rule | `#DED5CB` |

Use a restrained editorial serif for human headings, 28–32 pt with short lines. The implementation candidate is New York on iOS; the image only approximates this style. Use SF Pro or an equivalent readable system sans for financial values and controls. Use 56–64 pt semibold tabular numerals for the main answer, 18 pt semibold for row amounts, 16–17 pt for labels, and 13 pt for secondary metadata. Keep currency signs beside the amount and align row amounts at the trailing edge. The final ad has some serif financial numerals from generation; the production rule remains sans tabular numerals.

Spacing uses 4, 8, 12, 16, 24, and 32 pt. Main horizontal inset is 24 pt. Compact rows have a minimum 56 pt touch area. Use one-pixel separators, not a card around each row. Buttons have a 16 pt radius and a minimum 48 pt height. A result surface can have a 16–20 pt radius. Keep shadows outside the device presentation; app surfaces use color and rules for separation.

Icons use a simple 1.75–2 pt outline, with a filled symbol for the active tab. Small category markers use color and shape together. Avatars use initials in two quiet color circles. The sunrise is an original, small visual signature. It does not replace financial evidence.

The Overview and Plan use stable Today, Plan, and Activity tabs plus a separate add action. The purchase preview is a focused pushed screen with back and Done actions. Done closes the preview. It does not create a Transaction. Actual expense entry is a separate flow; its implementation is outside these concepts.

No chart is needed for the current question. If added later, use directly labelled bars for funded and Free amounts. A total must have a visible denominator and period. Never imply that Reserves are separate bank Accounts. Avoid decorative circular progress without a clear target.

Motion intent: a short 180–240 ms transition moves from the Free amount to the purchase preview. Recalculate the preview immediately as the amount changes. Fade the result instead of animating through false intermediate balances. Use haptics only on explicit controls. Honor Reduce Motion.

## Three product moments

1. **Room for today.** Show $600 Free amount with the explanation $5,000 Available money minus $4,400 funded Reserves. Accounts remain visible underneath: Everyday $3,000, Joint $1,800, Cash $200.
2. **A little peace of mind.** The shared Plan contains Rent $1,800, Groceries $600, Bills $400, and Emergency fund $1,600. The calm list makes commitments inspectable. The remaining $600 stays visible.
3. **Before you say yes.** Preview a $120 purchase from Everyday with no Reserve. Free after purchase is $480. No current balance changes until an actual expense is recorded elsewhere.

## Accessibility and trust

Primary labels use dark ink on pale surfaces. Do not rely on apricot line art or color alone for meaning. In implementation, measure text contrast, support Dynamic Type and VoiceOver, and make financial relationships understandable as spoken text. Generated images cannot establish those properties. Keep controls at least 44 × 44 pt. The board footer has low visual emphasis and should be strengthened for smaller published placements.

Keep offline data visible with a clear source freshness state when synchronization is added. Do not describe a stale Account as current. These concepts use synthetic data and do not claim a working bank connection.

## Reference synthesis

Gentler Streak contributed human tone and a dominant clear result. Mela contributed quiet domestic planning and thin rules. Structured contributed a calm vertical sequence with useful color markers. Daylight combines these ideas in an original financial workflow rather than copying their artwork or exact screens.

## Campaign

Matched headline: **Know what’s free to spend.**

Subline: **Accounts, commitments, and your next decision.**

The large phone proves that the answer has an explanation: Available money, funded Reserves, Free amount, and individual Accounts appear together. The warm visual style tests whether a shared financial plan can feel welcoming and worth returning to. Later hooks can test “A money plan you can both see.” and “Know what’s covered. Enjoy what’s left.” They are not present in the matched ad.

CTA: Explore the concept. Footer: Concept preview · Not yet available.

## Delivered and limits

- `app-board.png`: 1536 × 1024, three complete app screens.
- `ad-portrait.png`: 1122 × 1402, approximately 4:5.
- Both final saved files were visually inspected. Financial figures and required ad copy are correct.
- These are image concepts, not a working product or proof of demand. Some font and icon details vary between assets. The ad is close to, but not exactly, 4:5. A production ad export should use exact placement dimensions after the user chooses the direction.

