> **Current campaign package:** [Four complete use-case campaigns](campaign-kits/README.md) replaces this earlier single-image plan. Use [campaign-kits/PLAN.md](campaign-kits/PLAN.md) and [campaign-kits/briefs.md](campaign-kits/briefs.md) for the current four-story test. This document remains earlier preparation history.

# Four campaigns, ready for production

Source of truth for copy: [campaigns.json](campaigns.json). Voice rules and copy choices: [COPY.md](COPY.md). App reference study: [research/copywriting-references.md](research/copywriting-references.md). Render local pages with `python3 build_pages.py`. The selected design is [Clarity](../clarity/DESIGN.md).

Each first-wave ad uses the primary headline. Alternate headlines and motion are later variants, not extra simultaneous cells. All motion below is a storyboard, not a delivered video.

## 01 — Bank sync

**Headline:** Keep track without typing it all in.

**Subline:** Bring in transactions from your connected bank accounts.

**Primary post text:** Coffee, groceries, the bus home. You’ve already paid for them. Sort of Budget would bring those bank transactions into your budget so you don’t have to type them all in. See the preview. In development; supported banks are still to be confirmed.

**Later headline alternative:** Your bank transactions, without the typing.

**Ad → page:** [Image](refined/exports/sync-ad.png) → [sync.html](sync.html).

**Question:** Will less upkeep make people connect their banks and consider paying?

**12-second motion brief:**

1. 0–3s: show the headline and Accounts. Keep both bank update times visible.
2. 3–7s: reveal Corner Market, Café North and City Transit under From your banks.
3. 7–10s: point to Choose category and Review 1 transaction. Cash remains marked Add by hand.
4. 10–12s: show See how it works and In development · Sample screens. Do not animate an actual bank connection.

**Later Search intent seeds:** expense tracker bank sync, automatic transaction tracker. These are research seeds, not verified volume, CPC, or an active keyword list.

**Matching page limit:** Sort of Budget is still in development. Supported banks and countries are not confirmed. Bank updates may be delayed. The screen shows sample data.

## 02 — Envelope budgeting

**Headline:** Rent, groceries, and the weekend.

**Subline:** Set money aside for each, using what you have today.

**Primary post text:** Next month’s rent. This week’s groceries. Something for the weekend. We’re building a budget where you can see how much you’ve set aside for each. Take a look at the envelope plan.

**Later headline alternative:** Set money aside before it gets spent.

**Ad → page:** [Image](refined/exports/envelopes-ad.png) → [envelopes.html](envelopes.html).

**Question:** Do people want to plan the money they have before they spend it?

**12-second motion brief:**

1. 0–3s: show the headline and Your plan, with September 2026 visible.
2. 3–7s: reveal the five envelopes: Rent $1,800, Groceries $600, Bills $400, Emergency fund $1,600, Everyday spending $600.
3. 7–10s: pause on $0 Left to assign, All $5,000 assigned, and the $600 Everyday spending row. Zero unassigned does not mean zero to spend.
4. 10–12s: show See how it works and In development · Sample screens.

**Later Search intent seeds:** zero based budget app, digital envelope budgeting app. These are research seeds, not verified volume, CPC, or an active keyword list.

**Matching page limit:** In this sample plan, all $5,000 is assigned to envelopes, including $600 for everyday spending. Nothing is left to assign. Planning does not move money between bank accounts.

## 03 — Find a transaction

**Headline:** Which account was that on?

**Subline:** Find a payment without checking each bank app.

**Primary post text:** You remember buying it. You just can’t remember which account you used. Search for the shop and find the payment, with the date and account right there. See the Sort of Budget preview.

**Later headline alternative:** Find that one payment.

**Ad → page:** [Image](refined/exports/transactions-ad.png) → [transactions.html](transactions.html).

**Question:** Is finding and understanding purchases a reason to buy, or a supporting feature?

**12-second motion brief:**

1. 0–3s: show the headline and Activity with its four sample records.
2. 3–6s: type Corner Market into Search transactions. Show the one matching payment.
3. 6–10s: open it: −$84.20, Groceries, Everyday, 12 Sep 2026.
4. 10–12s: show See how it works and In development · Sample screens.

**Later Search intent seeds:** search transactions across banks, expense history app. These are research seeds, not verified volume, CPC, or an active keyword list.

**Matching page limit:** These are sample transactions. The preview shows search and transaction details. No bank is connected, and the four records do not represent a full month.

## 04 — Purchase check

**Headline:** What’s left if I spend $120?

**Subline:** Check what’s left after the money you’ve set aside.

**Primary post text:** There’s $5,000 in your accounts, but $4,400 is already set aside. If you spend $120, you’d have $480 left free. That’s the kind of check we’re building into Sort of Budget. Try the sample.

**Later headline alternative:** Check what a purchase would leave you.

**Ad → page:** [Image](refined/exports/purchase-ad.png) → [purchase.html](purchase.html).

**Question:** Will people use this answer before making a purchase?

**12-second motion brief:**

1. 0–3s: show the headline and the $600 Free now starting amount.
2. 3–6s: enter $120. Keep Use a reserve set to None.
3. 6–10s: show $480 Free after purchase. The note says This won’t record a purchase.
4. 10–12s: show See how it works and In development · Sample screens. Done closes the preview.

**Later Search intent seeds:** budget app available after bills, track money left after bills. These are research seeds, not verified volume, CPC, or an active keyword list.

**Matching page limit:** This example starts with $5,000 available and $4,400 set aside in reserves. Spending $120 from the remaining $600 would leave $480 free. The result depends on what you’ve recorded and set aside.

## Common production instructions

Keep one consistent native screen layout across stills, pages, and motion. Use refined/screens.js and refined/screens.css for editable type, numbers, and layout. Do not animate generated letters or imply a real bank connection. If Remotion is selected, each scene above becomes a timed composition with a shared Clarity component library; the supplied PNGs are design references. Suggested output is 1080×1920, 30 fps, 12 seconds, captioned with sound off. Verify current placement safe areas in the delivery account. These are production targets, not a claim of universal platform compliance.

CTA: **See how it works**. Disclosure: **In development · Sample screens**. Keep both visible at the end; retain a concept label throughout motion. Do not add fake testimonials, bank logos, universal coverage, or proven-saving claims.

A selected video should demonstrate the task changing state. Do not spend the full video panning over a static phone. Export and inspect all financial keyframes, then view at normal playback speed and phone size.
