> **Current campaign package:** [Four complete use-case campaigns](campaign-kits/README.md) replaces this earlier single-image plan. Use [campaign-kits/PLAN.md](campaign-kits/PLAN.md) and [campaign-kits/briefs.md](campaign-kits/briefs.md) for the current four-story test. This document remains earlier preparation history.

# Test the job, keep Clarity fixed

Prepared 2026-09-12. This is the active next batch. It replaces the earlier three-campaign starting order, not the underlying measurement rules. Clarity is the sole active style. No demand has been measured, no bank coverage is confirmed, and no campaign is live.

## The decision

Find a concrete problem that makes an individual or household want to switch from their current method and consider paying for Budgetly. Use the result to choose one small working trial. Attractive screens are an input to that test, not evidence of demand.

The product remains an offline-capable, accurate finance tool with bank updates, planning, and optional external-agent access. This campaign batch puts a useful job in front of the feature list. Shared use, offline use, and agent access remain candidates for later tests; they do not become three more competing claims on each ad.

Copy revised 12 September 2026 after the app-reference study. [COPY.md](COPY.md) explains the voice; [campaigns.json](campaigns.json) owns the current wording. The audiences, offer, and measurement plan are unchanged.

## Four promises to test

| Arm | Person and trigger | Promise | Screen evidence | Main uncertainty |
| --- | --- | --- | --- | --- |
| 01 Bank sync | A person who stops tracking because logging is too much work | Keep track without typing it all in. | Connected Accounts, update times, new Transactions, one category review | Does reduced upkeep justify connecting a bank and paying, or is this expected from any tracker? |
| 02 Envelopes | A person planning payday money across bills and ordinary spending | Rent, groceries, and the weekend. | $5,000 allocated; $0 left to assign; $600 still available in Everyday spending | Is deliberate allocation useful enough to maintain, or does it feel like another chore? |
| 03 Transactions | A person searching several bank apps for a purchase | Which account was that on? | Search, Account filter, readable merchant/Category/amount and detail | Is this a frequent enough problem to buy a separate app, or just a supporting feature? |
| 04 Purchase check | A person checking whether a purchase conflicts with their plans | What’s left if I spend $120? | $600 Free amount, $120 proposed purchase, $480 Free after purchase | Will people use this before a decision, and do they understand the answer? |

**Priority judgment:** sync and envelopes are the strongest first pair because they address upkeep and an active planning routine. Transaction clarity may be supporting proof rather than the reason to pay; include it to test that doubt. Purchase check is a more specific decision tool; test whether it fits actual behavior. These are hypotheses, not findings from competitor feature pages.

The source review is in [Research findings](research/findings.md). Existing products demonstrate that these features are established categories. Their presence does not establish an unmet need for Budgetly. Follow-up must identify a switching reason: too much upkeep, confusing allocations, poor retrieval, or a decision the current tool cannot answer simply.

## Keep the two plans distinct

Envelope arm: all $5,000 is assigned to Rent $1,800, Groceries $600, Bills $400, Emergency fund $1,600, Everyday spending $600. Left to assign is $0. Spending from a funded purpose remains possible.

Purchase arm: the first four Reserves total $4,400. $600 remains unassigned. A hypothetical $120 purchase with no Reserve leaves $480 Free amount. The preview records nothing.

These are alternate plan states. Do not animate from one to the other without showing an explicit allocation change. Do not present Free amount as total spending power under full allocation. Envelopes provisionally map to funded Reserves; expense-to-Reserve behavior and a final product choice remain open in the [domain decision](../../../../.scratch/finance-product-direction/issues/07-distinguish-envelopes-and-reserves.md).

## First run: one small comparison

Preparation defaults carried from the earlier kit: US, English, USD; proposed $9/month for an individual or household; static Meta Feed as the first channel, subject to actual account eligibility. These are test choices, not an optimal market or channel finding. The country is not a permanent product boundary. Use the same allowed adult audience and household/individual wording across all four arms. Ask who it is for after interest; do not silently use different audiences per promise.

Four ad concepts, four matching page previews, one identical offer and CTA. Hold visual system, placement, geography, price, form, time window, measurement, and planned allocation constant. Change the promise, its demonstrated screen, and matching explanation. This tests the whole promise presentation, not the causal effect of a single word.

Proposed maximum: **$600 media total = four cells × $150**, $15/cell/day for ten days. This supersedes the older three-cell plus reserve split for this batch. No reserve or automatic extension. This amount is an operational ceiling, not a power calculation or authorization. If the founder chooses a smaller budget, reduce the initial comparison to sync versus envelopes rather than spreading tiny amounts over four arms. Any later transaction/purchase comparison is a separate run; do not rank it causally against an earlier cohort.

Use an available platform experiment with comparable, disjoint allocation if the account supports the four-arm setup. Record the actual assignment method. If it does not, use ordinary matched delivery only as exploratory evidence and report differences in exposure and optimization. Four creatives in one optimizing ad set do not constitute randomized allocation. Do not promise a four-way experiment before inspecting the account.

Fixed endpoint: spend ceiling or ten-day delivery window, whichever arrives first. Allow seven further days for the last cohort's signup and qualification window. Look at broken links, delivery and instrumentation during the run; do not choose a winner from daily fluctuations. The launch sheet must contain actual dates, timezone and caps before activation.

## What counts

Primary outcome: **qualified price-aware intent per valid price-exposed visitor**. Qualified means a verified contact, individual/household use, and an explicit response that they would consider paying the displayed $9/month if the stated experience is delivered. A click is not a signup; a signup is not a purchase.

Use the same funnel for all arms:

1. Ad shows a concept, not an available download.
2. Matching page explains that feature with the shown screen.
3. Proposed $9/month is visible before the early-access action. No charge today.
4. Real signup is accepted and email is verified, once a real service is installed.
5. Optional questions: who would use it; interest at the proposed price; which problem they want solved first. Do not preselect the ad's promise as their answer.
6. Invite interested people to a concrete 15-minute synthetic-data task.

The local pages are previews only. Their button shows the proposed next step; it stores no contact and emits no conversion event. No bank login, statement upload, or payment is part of this initial funnel.

Report per arm: impressions, outbound clicks, eligible measured visitors, valid price exposures, accepted signups, verified contacts, qualified intents, unknown qualification, media spend, cost per qualified intent, booked and attended sessions. Report counts and intervals, not only percentages. Keep internal traffic and duplicates out under a rule fixed before launch. People with unanswered questions are unknown, not negative. Unmeasured traffic stays visible as a measurement gap.

Use the earlier [event definitions and interpretation rules](../../../../.scratch/finance-product-direction/demand-kit/EXPERIMENTS.md). Add experiment ID `clarity-jobs-v1`; arm IDs `sync`, `envelopes`, `transactions`, `purchase`; offer `usd9-monthly-v1`; creative `static-v1`. Persist the visitor's original arm where the privacy setup permits. Never randomize the landing page away from the ad's promise. No personal financial information in marketing events.

## Decision rules before results exist

- A high click rate with weak price-aware intent means the ad attracts attention but the offer has not earned commitment. Check the page, credibility, price and fit separately.
- Under 100 measured price exposures or ten qualified intents per arm, rankings are especially fragile. These are screening cautions carried from the kit, not validated sample sizes. Zero intent remains zero observed; cost per intent is undefined, not $0.
- Do not declare a winner simply because one rate is largest. Inspect uncertainty, delivery imbalance, missing-data rates and whether the follow-up problem matches the original promise. If uncertain at the spend ceiling, report inconclusive.
- A promising arm earns five synthetic sessions. Look for repeated recent examples, correct unaided understanding and an actual reason to switch. Five sessions are a next-step batch, not a population estimate.
- If the message is understood but few relevant people want the workflow, stop expanding that promise. If it is misunderstood, revise the specific demonstration and register a new version.
- Move to a working slice only when the repeated problem and workflow make sense. Payment and return use must then be tested on something genuinely deliverable. A manual planning service does not validate automatic bank sync; sync needs a supported-bank working trial.

## The five-session guide

Start with: 'Tell me about the last time this happened. What did you do?' Ask what they use now and what they already pay. Show one concept without teaching its answer. Observe the task. Then ask what would have to be better for them to change tools.

| Arm | Unaided task | Behavioral follow-up | Disconfirming result |
| --- | --- | --- | --- |
| Sync | Explain which Account updated most recently and what still needs review | Identify the banks/country they would need; book a later supported trial | They only want balances, will not connect, or their current tool solves upkeep well |
| Envelopes | With $0 left to assign, explain whether $120 can come from Everyday spending | Allocate a new sample payday; return for one sample adjustment | They interpret $0 as no usable money, or reject the planning routine after understanding it |
| Transactions | Find the Corner Market expense and its Account and Category | Bring another synthetic retrieval question on a second visit | No recent retrieval problem, or their bank app already makes this easy |
| Purchase | Explain $480 and whether pressing Done records an expense | Use the preview for a second sample purchase decision | They would only open the app after spending, or treat the number as a guarantee |

Ask the price question after the task too. Record changed answers; do not discard them. Avoid asking whether a pretty design 'looks useful'. Do not ask for actual statements in these first sessions.

## Next formats, only after the message is clear

| Channel/format | What it adds | What remains fixed |
| --- | --- | --- |
| Same Feed, 12-second video | Tests whether a visible workflow explains the selected promise better than a still | Same promise, audience, price and matching page |
| Google Search, separate intent groups | Tests people already looking for the specific job | Same offer; report this population separately from Feed |
| A disclosed founder post in a permitted community | Obtains language, objections and participants | Same sample scenario; no claim about paid acquisition efficiency |

Do not launch four promises × four channels × several prices at once. The [campaign copy and motion briefs](CAMPAIGNS.md) provide the next material without requiring another broad ideation round.

## Delivery handoff

1. Use this folder as the active source. Earlier galleries and the large combination catalogue are reference archives.
2. Open index.html, inspect the four ads, then open each matching page preview. Check text at phone size.
3. Rebuild approved raster screens as editable Clarity components for exact exports and motion. Use the financial examples above; remove any generated defect. Do not add features to fill space.
4. Preserve each ad-to-page mapping and all exact offer text. Add a real contact service, verification, privacy text, outcome instrumentation and confirmation flow before public use. Existing preview buttons must never count as real signups.
5. Fill the launch sheet: advertiser/account, one country, allowed audience, placements, assignment method, objective, dates, caps, attribution window, outcome source, tested destination URLs, and approval to publish/spend. These are execution inputs; none blocks preparing this package.
6. Use real event exports to fill results-template.csv. Include missing and negative outcomes. No synthetic success figures.
7. Return a short decision: continue to a named trial, revise a named claim, stop, or inconclusive. Explain what evidence supports it and what remains untested.

No ad account, contact service or payment system was used in preparation.
