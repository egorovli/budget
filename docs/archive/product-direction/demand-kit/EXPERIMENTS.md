# Experiment sequence, measurement, and decisions

## Decision to inform

Find a specific audience and promise worth taking to a small working or assisted product trial. A good result is evidence for the **next investment**, not a declaration that the whole app or a profitable business is validated.

Keep these distinct: attention, interest after a visible price, ability to use the workflow, willingness to grant real-data access, actual payment, repeated use, and delivery economics. The [research note](../research/prebuild-demand-evidence.md) explains why these require different evidence.

## Sequence and stop points

| Stage | Work | Evidence | Decision |
| --- | --- | --- | --- |
| Preparation, $0 media spend | First three static concepts, matching pages, sample scenario, instrumented local demo | Internal claim, layout, arithmetic and flow checks | Ready to expose a truthful offer |
| Initial promise screen | Three matched static concepts for the household use case | Price-exposed visits and qualified stated intent | Which promise merits follow-up; or what needs revision |
| Observed use | Agreed synthetic sessions from interested participants | Correct understanding, actual effort and reasons to switch | Whether the proposed workflow addresses the problem |
| Format/distribution exploration | A promising concept as video, then another channel separately | Performance of the new bundle; controlled creative comparisons where available | Whether to improve creative, change channel, or stop buying traffic |
| Price exploration | Same offer at three proposed monthly prices | Price-aware interest, with uncertainty | Which actual offer deserves a payment test |
| Paid assisted pilot | Deliver the explicit service in the offer guide | Net payments, delivery effort, return use, refunds | Whether to build a small slice and what it must do |

Do not execute every stage automatically. A weak or inconclusive stage should lead to a specific revised hypothesis or a stop, not endless new combinations.

## Initial comparison — concrete proposal

Prepare briefs **See what remains after commitments**, **Less routine recordkeeping**, and **A household plan both people understand**: the first three entries in [the brief index](BRIEFS.md).

Hold constant: US English, permitted adult audience configuration, household self-selection through copy, static Feed format, visual polish, proposed $9/month offer, CTA, page layout, form, confirmation process, dates and intended budget. Change: promise, matching headline, demonstration and page explanation. Therefore the estimand is response to the **promise bundle**.

Use the platform's current controlled experiment capability if it permits this comparison, disjoint comparable allocation and the required outcome measurement. Save the actual allocation method. An ordinary ad set that optimizes delivery toward one creative is not randomized research. If equal disjoint allocation is unavailable, label results observational, record delivery differences and do not report causal lift.

Platform audience allocation and website arm persistence are different. Store the assigned experiment/arm on the first valid landing visit and keep that offer for return visits where the privacy configuration permits. Do not independently randomize a landing page into a different promise from its ad. Campaign metadata is not itself a random-assignment guarantee.

Proposed spend: **$150 per cell**, with a planned pace of **$15/day per cell for 10 days** and **$150 reserve**, for a **$600 total ceiling**. These are planning values, not a forecast of reach or enough statistical power. Use lifetime/account caps where available and confirm actual pacing/overspend behavior in the platform. Keep reserve unallocated unless a named extension is approved. Fix a timezone and explicit start/end date on the launch sheet; none is set yet.

Before launch, select a single supported objective and keep it consistent. Prefer a reliably measurable real website signup outcome if the account, platform and lawful event setup support it; otherwise use landing-page views and disclose that limitation. Do not claim the platform optimized for verified price-aware interest if it only received a page-view event.

## Budget options

- **$0 media:** complete local assets and, after authorization, recruit through permitted organic routes. Report founder time and selection bias. This can find useful conversations but says little about paid acquisition cost.
- **$600 proposed start:** the initial three-cell comparison above. No other paid campaigns run concurrently under this allowance.
- **$1,500 total ceiling, only if separately approved:** includes the initial $600, up to $450 for two format cells, and up to $450 for two Search-intent cells. Do not treat these as $1,500 in addition to the starter. Owner time, tooling, hosting, taxes and service-delivery costs are separate costs to record.

Do not distribute a small budget across all 4,503 compatible recipes. Produce a clear question for each extension, release a bounded amount, and record what would change the next decision.

## Funnel definitions

| Name | Numerator / denominator or event | Interpretation |
| --- | --- | --- |
| Outbound CTR | Platform outbound clicks / impressions, using that platform's definition | Attention; record total versus unique definitions |
| Valid price exposure | Distinct eligible visitors whose selected page and proposed price actually rendered, within the measurement window | Main denominator for the price-visible funnel; not all ad clicks |
| Signup rate | Distinct accepted signups / valid price-exposed visitors | Interest; keep email delivery/verification failures visible |
| Qualified price-aware intent | Verified email, individual/household use case, and explicit “would consider paying” response for the shown price | Stated intention, not willingness-to-pay proven by payment |
| Qualified-intent rate | Distinct qualified price-aware intents / valid price-exposed visitors | Proposed initial outcome |
| Cost per qualified intent | Attributed media spend / distinct qualified intents | Acquisition cost of this signal, not customer CAC |
| Session participation | Attended sessions / people actually invited to a session | Time commitment; also report booked, invited and unreachable counts |
| Net pilot payments | Actual paid assisted-pilot customers minus fully refunded customers | Service-purchase evidence; track distinct offers and actual delivery |
| Return use | Participants completing the second useful session / participants given that opportunity | Early repeated-use signal, not long-term retention |

People who skip optional questions remain signups with qualification unknown. They are not counted as negative answers. Report the skipped-response rate. Price-exposure consent/tracking gaps are unknown, not failed conversions; record the measured population and unmeasured traffic separately.

## Event and record design

Use the [event schema](data/events.schema.json), [experiment log](data/experiment-log.csv), [results input template](data/results-template.csv), and [result summary tool](tools/summarize_results.py). These are preparation artifacts, not a deployed analytics system.

Events: `landing_view`, `price_exposed`, `demo_started`, `demo_completed`, `signup_accepted`, `email_verified`, `interest_answered`, `session_booked`, `session_attended`, `pilot_offered`, `pilot_paid`, `pilot_refunded`, `pilot_delivered`, `followup_completed`.

Each record has a deduplicated event ID, timestamp, experiment ID, arm ID, combination ID, copy/offer version, shown price and billing period when applicable, country/language context, and a random first-party visitor or participant reference where permitted. No bank names, balances, transactions, statements, free-text financial stories, email addresses or financial prompts in marketing analytics. Store contact details separately from event analytics, using a random participant link for operational follow-up.

Use the minimum actual data needed, a truthful privacy notice and an appropriate consent configuration before collection. Do not add ad pixels or cross-site tracking by default. Never fingerprint visitors or silently bypass consent. If this limits attribution, report the limit instead of reconstructing identity.

Suggested URL metadata: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, plus a nonpersonal `experiment` and `arm`. Store only allowlisted query fields. A URL parameter is a label, not proof of valid exposure or a conversion.

Measure accepted submissions and verified addresses through the actual service; a button click is not a signup. Payment and refund events must come from a verified payment source when the later pilot exists, never from a front-end animation.

Before launch, choose an attribution rule and outcome windows. Default proposal: first eligible experiment exposure; fixed 7-day signup/qualification window from exposure; 14 days after invitation for a prototype session; pilot refund and delivery reporting after the 14-day service and relevant refund window. Daily ad spend stops at the approved end time, but outcome reporting waits for the relevant window to mature. Do not compare mature and immature cohorts as if equal.

Predeclare exclusions: internal test traffic, obvious automated submissions, duplicate event IDs, repeat signups linked to the same verified participant, and visits outside the defined market. Keep excluded counts and reasons. Do not exclude people for answering negatively or changing their mind.

## Reading a small result

Report counts, denominators, absolute rates, missing-data rates, costs and uncertainty. The summary script calculates Wilson 95% intervals for the qualified-intent rate; those intervals describe that measured proportion under binomial assumptions, not bias-free population inference or a multiple-comparison correction.

Operational screening defaults, chosen for this plan rather than sourced industry benchmarks:

- Below 100 valid price-exposed visitors per cell, treat rate ranking as particularly fragile. Reaching 100 does not establish statistical power.
- Below 10 qualified intents in a cell, treat cost-per-intent ranking as unstable. Zero intents still means zero observed; do not compute a finite cost or ignore that outcome.
- Do not call a winner solely because one rate is highest. Look at uncertainty, exposure balance, missing responses, delivery differences and session behavior. Several exploratory comparisons increase the chance of a misleading best result.
- Seek five completed synthetic sessions across a promising audience before changing the product direction. Look for repeated concrete problems and correct interpretation of the core numbers. Five is a manageable next-step batch, not market validation.
- A later batch of at least ten genuinely eligible pilot offers and three net paying, delivered participants is a proposed trigger to assess a small build, not a statistical proof. Negative, refunded and uncompleted cases remain in the report.

If a sample is too small under the fixed budget, mark it **inconclusive**. Do not quietly extend spend, change the denominator, or swap the goal to CTR. If interest is weak but the message was unclear, revise that specific claim or demonstration and register a new experiment. If repeated adequately exposed, understandable offers get weak interest and sessions reveal little need, stop expanding this promise.

For a confirmatory comparison later, choose a baseline, minimum effect worth acting on, allocation and appropriate sample-size/multiple-testing method before launching it. The kit does not provide a universal powered sample because there is no baseline yet.

## Economics worksheet — explicit assumptions

For a future subscription, define monthly net contribution as revenue retained after applicable taxes, payment fees, per-user bank/data costs, infrastructure, support, refunds and any hosted AI. Do not treat price as contribution. Separate fixed costs and founder labor too.

Illustration only: $9 revenue, $0.60 payment/refund allowance and $2.40 variable delivery cost yield **$6 monthly contribution**. If the chosen maximum payback period were six months, the corresponding acquisition ceiling would be **$36 per paying subscriber**. None of these costs or the payback target is verified.

| Assumed qualified-intent → paying-subscriber conversion | Maximum cost per qualified intent at $36 CAC ceiling |
| --- | ---: |
| 5% | $1.80 |
| 10% | $3.60 |
| 20% | $7.20 |

Formula: allowable qualified-intent cost = allowable customer-acquisition cost × assumed conversion to a paying subscriber. The conversion assumption must later be replaced with observed subscription data; pilot buyers are a different offer.

Example: $150 spend and 30 qualified intents gives $5 per intent. At an assumed 10% eventual subscription conversion it implies $50 acquisition cost per subscriber, above the illustrative $36 ceiling. This identifies a question to investigate; it does not establish actual CAC, lifetime value, or failure. Retention and bank-provider cost could change the conclusion substantially.

Do not promise profitability from campaign results. The commercial objective is to replace assumptions with progressively stronger behavior and actual costs while limiting the cost of learning.

## End-of-test report

The delivery model must produce: hypothesis and setup; actual changes between cells; data-quality/eligibility issues; counts and intervals; costs; observed session behavior; strongest objections; payment/refund/delivery facts if any; alternative explanations; and exactly one proposed next action with a capped cost. Use **continue**, **revise**, **stop**, or **inconclusive**. Never label a prelaunch signup as a customer or recurring revenue.
