# The next decision: which problem earns a working trial?

Prepared 12 September 2026. This is the active campaign proposal, `clarity-usecases-v3-ai`. It replaces the single-image first-run plan. The product scope remains individuals and households; Clarity remains the design. No campaign has run and no demand has been measured. Bring-your-own-AI is now shared positioning across all five campaigns. Read [AI-EXPERIMENT.md](AI-EXPERIMENT.md) for the revised inference and the separate AI-value test.

Start with [the five campaign kits](index.html). Each has four story cards, a 28-second animated MP4, post copy, a matching page, one hypothesis, and a specific follow-up task. [briefs.md](briefs.md) contains the per-campaign instructions. [DELIVERY.md](DELIVERY.md) is the execution handoff. Active copy is in [campaigns.json](campaigns.json).

## What each campaign represents

| Campaign | The problem it represents | What the story demonstrates | The product decision it can inform |
| --- | --- | --- | --- |
| Keep up with accounts | Repeated recordkeeping makes people stop tracking | Account status → category review → your agent groups the spending → offer | Is supported-bank sync the reason to start, with search as supporting utility? |
| Plan the money you have | People need to assign money before spending it | $600 unassigned → assign it → your agent models twelve extra savings deposits → offer | Is an envelope planning routine worth maintaining and paying for? |
| Keep a household plan together | Two people must coordinate the same money | Common plan → Alex changes it → Sam sees the result → your agent explains the change | Is shared planning a distinct reason for both members to adopt the app? |
| Check a purchase | Account balances include money already set aside | $600 free → try $120 → try $250 → your agent explains the same check | Will people use this before spending, rather than only review spending later? |
| Bring your own AI | People must copy records into their chosen agent | Select Book → read-only access → question → breakdown with source records | Is controlled access for an existing external-agent habit a reason to adopt? |

Transaction search is now a step in the sync story. It is no longer a separate first-run campaign. This leaves room to test household coordination, which was part of the original product need. The earlier transaction-only material remains an archive for a later test if user evidence warrants it.

Each campaign represents a whole promise and demonstrated workflow. It cannot identify the effect of an isolated feature or word. A successful sync campaign does not show that categorization caused the interest; ask about that and test a working import next.

## Four different questions require different evidence

1. **Acquisition:** can this campaign bring suitable prospects at a cost we can justify? Use actual spend and verified, price-aware contacts.
2. **Problem and workflow:** do these people have the stated problem and choose to do the task? Use recent examples, observed task completion, and a second use.
3. **Payment:** do they pay for the actual offer delivered? A signup and a yes to $9/month are not payments.
4. **Business:** do paid use, retention, bank-data costs, support, and other expenses leave enough contribution? No ad result can answer that alone.

The campaign stage should earn or decline the next small investment. It does not certify that the app will sell.

## Proposed first run

**Channel:** one Meta Feed placement family, subject to the actual account's eligibility and previews. This keeps the first acquisition test bounded. Search and founder/community posts can reach different populations later; report them as separate runs.

**Material:** use the three selected 28-second motion films as the common initial format. All five campaigns are ready in the library. Four-card carousels are a later format comparison within one use case. Do not mix formats in the initial promise comparison.

**Audience:** one common permitted adult audience in one country. Carry forward US/English/USD as preparation defaults, not a final market choice. All selected arms use the same eligibility and $9/month individual-or-household offer. The shared campaign will self-select households; record intended use after the access request. A lower broad-audience yield does not by itself refute household-specific demand. Do not compare tiny post-hoc segments as if they were randomized markets.

**Budget proposal:** retain the proposed $600 total over ten days. Prepare an initial three-arm comparison: sync, envelopes, and own-ai at $200 each. Keep household and purchase for a later run. This tests two core planning needs against AI-led acquisition within the same AI-enabled product. It is a cost-of-learning proposal, not adequate sample size or approved spend. With a smaller cap, use sync and own-ai as an exploratory pair. Cohorts from different dates are not a controlled five-way result.

**Objective:** use the same objective and event source across arms. A reliable accepted-access-request event is a candidate; final selection depends on the account and implemented measurement. If only landing views can be measured, call that a traffic pilot. Do not claim optimization for qualified contacts if that event was never received by the platform.

**Allocation:** use a suitable platform experiment to separate eligibility pools if available; record actual settings. If only optimizing delivery is available, keep per-campaign caps where supported and label comparison exploratory. Starved delivery is insufficient exposure, not rejection of the need. Eligibility randomization does not remove the platform's selection of actual viewers.

**Timing:** ten-day delivery cap or approved total spend cap, whichever comes first. Then allow seven days for the last arrival's request and qualification outcomes. Start/end dates, timezone, account caps, and actual attribution rules must be filled before activation. Monitor technical faults and spend daily; do not stop on an apparent early winner or extend a failing test without a new decision.

## The same offer and funnel

`Ad → matching task story → proposed $9/month + separate AI plan → request access → verify contact → price/use questions → optional task session`

A qualified contact is one deduplicated application that requests access, verifies a contact address, indicates individual or household use, and explicitly says it would consider $9/month if this experience works as shown. “Not sure” and “No” are recorded separately; no answer remains unknown. Nothing is preselected. In the household trial, two members of the same application still count as one acquired household, not two leads.

The local pages currently preview this form. They do not collect an email, submit answers, or emit conversions. [MEASUREMENT.md](MEASUREMENT.md) specifies the production event boundaries. Replace the preview only after the destination and services are selected and the flow is ready for public use.

The optional sample question checks understanding, not interest. Do not require a correct answer to count a lead or move people with wrong answers out of the denominator. Use it to diagnose whether the story made sense.

## Decide what success would have to be worth

Before a confirmatory test, fill the viable rate/cost and sample-size inputs in [launch.json](launch.json). They are deliberately unset; we have no measured baseline, lead-to-paid conversion, or delivery cost. The initial $600 run is explicitly exploratory until those values exist. Its success is a useful estimate and a reason for a bounded follow-up, not a significance claim.

Work backwards from contribution, not gross subscription price:

`allowable cost per qualified contact = allowable cost per paying customer × assumed contact-to-paid rate`

Illustration only: a $36 acquisition ceiling and a 5–20% contact-to-paid rate imply $1.80–$7.20 per qualified contact. At $5 per contact, 10% conversion implies $50 media cost per payer; 2% implies $250. None of those conversion or cost assumptions is verified. A relative winner can still be too expensive. Keep bank-provider cost and retention as explicit unknowns.

## How to interpret the result

| Observation | What we can conclude | What to do next |
| --- | --- | --- |
| Little delivery or broken measurement | The hypothesis was not adequately tested | Repair the specific setup fault; preserve the failed run in the record |
| Views but few useful visits | This hook/format/distribution package was weak at this cost | Try one new opening or the alternative format for the same use case |
| Visits but low understanding | The explanation is weak or the model is confusing | Observe the misunderstood step, revise it, and register a new version |
| Understood, but few requests after price | This offer has weak observed pull in this population; price, trust, availability, or need may explain it | Ask about the actual objection, then change one specified factor |
| Requests but few verifications | There is a verification/delivery/intent problem | Check failures before rejecting the use case |
| Qualified interest plus repeated concrete problems | The campaign earned consideration for a working trial | Invite a small consented batch to the specific task below |
| Good first task, little return use | Usability may be adequate; repeated value remains weak | Observe the task's natural cadence and reasons for not returning |
| Few observations, wide intervals, or material missing data | Inconclusive | Stop at the cap; decide whether more clean evidence is worth buying |

A negative result can weaken a *specific* rate claim when the upper uncertainty bound is below a target chosen before the test, with suitable assignment and reliable observation. It cannot prove that nobody wants this app. For example, with zero responses from 100 independent fully observed visitors, the one-sided 95% upper bound is about 2.95%. That does not rule out a 2% rate. A non-significant difference also does not mean two promises are equivalent. See the [primary-source method note](../research/campaign-experiment-method.md).

For this exploratory round, choose at most two follow-up candidates using the full funnel, cost, missingness, and relevant problem evidence. Do not crown the highest percentage as a proven winner. Five completed task sessions per selected candidate are a practical next batch, not a population estimate. If the campaign is understood but the problem is repeatedly absent and there is no suitable follow-up commitment, stop expanding that claim.

## The trial must deliver the promise

- **Sync:** supported-bank connection, imported records, a review, and a later update. A manual PDF or CSV import can test accounting and parsing but cannot validate automatic bank sync.
- **Envelopes:** saved allocations, an explicit plan adjustment, and a later planning visit. See if users understand that zero unassigned does not mean zero to spend.
- **Household:** two willing members use one Book, one changes the plan, the other uses the result. One person's signup is insufficient evidence of joint adoption.
- **Own AI:** verify one real client with a sample Book, read-only access, a source-linked answer, an explicit scenario, and successful revocation. Then observe a second useful question.
- **Purchase:** use a check before a decision, then return for another one. Check understanding of reserves and the fact that a preview records nothing.

Use synthetic records for initial comprehension. Request private financial data only if a later working trial needs it and the participant chooses to provide it. Do not recruit, message household members, or charge anyone as part of this preparation.

## If we need a cleaner promise comparison

After narrowing to two concepts, a separate neutral ad can bring people to a server route that randomly assigns the concept page before it renders. Keep the same price, layout, performance, and form. Analyze all eligible assigned visitors, including those who leave before the price. Predeclare the effect worth detecting, sample size, stopping rule, and comparison family. This estimates the concept-page effect among that acquired population, not market size.

Keep this separate from the campaign-matched run. Never randomly send the sync ad to the household page. The [research](../research/campaign-experiment-method.md) explains why ad delivery and conditioning on price viewers can otherwise distort the conclusion.
