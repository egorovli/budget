# Landing pages, offers, and buying-intent tests

## One page system with a matching promise

Use a reusable responsive template and a route such as `/concept/h01`. The campaign's title and result must match the hero. Keep layout, load behavior, offer, form and CTA consistent during the initial promise comparison. Show only the relevant story prominently; the remaining product qualities can appear below it.

Use `/demo/<promise>` for a synthetic-session offer and `/pilot/<promise>` for the later assisted service. Those pages use their own offer wording, not the default subscription-interest panel. An allowlisted experiment/arm registry selects the offer, price and version. URL metadata must not invent a price or silently switch offers. Unpriced concept variants omit the numerical price and cannot count as price-exposed interest.

### Above the fold — exact default copy

- Eyebrow: **Budgetly · In development**
- Headline: use headline A from the selected brief.
- Description: use that brief's body.
- Image label: **Concept screens · sample data**
- Price panel: **Planned price: $9 USD/month for an individual or household plan.**
- Supporting line: **Join the list to hear when early access is ready. No payment or subscription today.**
- CTA: **Join early access**

The $9 price is a proposed monthly bill, not an annual equivalent. No annual choice, free-trial countdown, discount claim, deadline, or launch date in the first experiment. If applicable tax treatment is not yet settled, label it as a proposed price and settle the actual full payable price before accepting payment.

### Page order

1. Matching promise, one clear demonstration, proposed price, CTA and development status.
2. Three short steps: **Bring records together → Make a plan → See what a purchase changes.** Adjust emphasis for the selected promise, preserving the same product.
3. One interactive synthetic example or screenshot sequence. Initial static pages may use the supplied purchase example without implementing any real application services.
4. The brief's main objection, answered honestly with planned behavior and any unresolved part.
5. Short product context: **Designed for individuals and households. Core records and planning are intended to work offline. You can use the app without connecting an agent.**
6. Repeated offer and form.
7. Founder identity/contact, truthful product status, privacy information and the relevant terms for the actual collection process.

No fabricated reviews, star ratings, app-store badges, customer counts, security certifications, bank logos, savings claims, or partner endorsements. The concept itself should carry the page. Do not add an investment/credit disclaimer to imply the product provides those services.

### Default FAQ copy

**Can I use Budgetly now?**
Budgetly is in development. This page shows a proposed experience using sample data. Joining the list does not create a paid subscription.

**Will it connect to my bank?**
Bank connections are part of the plan. Institutions and countries supported at launch are not yet confirmed. You can optionally tell us which institutions matter to you after joining.

**Can I use it with another person?**
Shared household planning is part of the concept. The exact access and sharing controls are still being designed.

**Can my own AI agent use it?**
We plan to explore access for existing agents. Supported tools and permissions are not yet confirmed. The financial app should also be useful without an agent.

**Will it work offline?**
The proposed design keeps core records, manual entry, reports and planning available from local data. Bank updates and remote-agent connections require a connection.

## Form and qualification

First form: email and **Join early access**. A nearby sentence must accurately explain the messages being requested and link to the real privacy information. Do not preselect unrelated marketing consent or require financial records. A local mock form must clearly say it is a demo and must not pretend to save an address.

After a successful real submission, show the confirmation state and two short optional questions:

1. **Who would you use this for?** Myself / My household / Something else.
2. **At the proposed $9/month, how interested would you be if the app delivers this experience?** I would consider paying / I would consider it at a lower price / Interested, but I would not pay / Not sure.

Then one optional question: **What would you want it to solve first?** Provide the campaign promise as one option plus the other core promises and free text. Do not silently assign the selected promise from the ad; attraction and intended use can differ.

Optional later question: institution names and country. Never request Account numbers, passwords, authentication codes, balances, statements, or bank authorization in this demand funnel.

Suggested submission success copy: **You're on the early-access list. Budgetly is still in development. Check your email to confirm your address.** Use this only after a real accepted submission and configured confirmation delivery. Until then label the whole form demo-only.

Suggested confirmation email draft (sending requires authorization and a configured real process):

> Subject: Confirm your Budgetly early-access request
>
> You asked for updates about Budgetly, a personal and household finance app in development. Confirm your email using the link below. The screens you saw were a concept, and no payment or subscription has been created. If you did not request this, you can ignore this email.

## Four offer types

| Offer | Purpose | Exact interpretation |
| --- | --- | --- |
| Unpriced early-access interest | Optional very early message exploration | Does not test reaction to a price |
| Price-visible early-access interest | Default first comparison | Tests stated interest after a proposed price, not actual willingness to pay |
| Synthetic prototype session | Follow-up with interested people | Tests willingness to invest time and ability to use the proposed workflow |
| Paid assisted pilot | Later, after a concrete service is deliverable | Tests payment for that service; not proof of app subscription demand |

Do not merge these offers into one conversion metric. In particular, a demo invitation is not a sales conversion and an assisted-pilot payment is not app recurring revenue.

## Price experiment after the message test

Default first comparison uses **$9/month** throughout. If the resulting audience and problem merit further work, compare **$6, $9 and $12 per month** with the same defined offer, audience and action. Treat these as planning values; do not add annual prices or feature tiers in the same test.

Competitor prices are context, not evidence of Budgetly demand. See the [first-party pricing note](../research/pricing-reference.md). The proposed amount also needs to cover bank-provider, infrastructure, support and any AI costs, which are not yet known.

Keep one offer version per participant during the experiment; do not show someone a new price on every visit. Make it a proposed prelaunch price without making a binding price-lock promise. Record exposed price and offer version. Seek stronger evidence through a genuinely deliverable paid offer; do not invent a fake successful checkout, a declined card flow, or a claimed purchase event.

## Paid assisted pilot — later concrete option

**Proposed offer:** $20 USD once for a 14-day assisted trial: one setup/review session of up to 30 minutes and one follow-up of up to 20 minutes, using a simple personal or household spending plan. The deliverable is a reviewed plan and a readable explanation of its source records. No app subscription, automatic renewal, bank connection or investment/tax advice is included.

This is a service test that a founder/operator must actually be able to deliver. It cannot be represented as access to a completed Budgetly app. It is not on the initial cold-ad menu.

Before offering it, the operator must confirm the deliverer, session availability, precise scope, full payable price/tax treatment, payment provider, applicable terms, and cancellation/refund handling. Proposed minimum policy: full refund before the first session or if the promised service cannot be delivered; actual terms must preserve any applicable consumer rights. Do not collect money until those facts and the user authorization are in place.

Use synthetic data for the free prototype step. Real records in a paid pilot require a defined private handling and deletion process; keep them outside the repo and ad analytics. A participant can decline financial-data sharing. Do not count willingness to use sample data as willingness to disclose actual financial records.

Measure actual offers made, accepted payments, refunds, completed delivery, operator minutes, second-session attendance, and willingness to continue. Three paid pilots could justify a small further investment; they cannot establish profitable acquisition, scalable delivery, or retention for a subscription app.

## Follow-up session guide

Use an agreed session with a synthetic Book. Ask for a recent example of the problem, then let the participant interpret $5,000 available, $0 unassigned and $600 for flexible spending. Ask them to preview a $120 purchase and explain what changed. Avoid teaching the answer before observing it.

Ask what they use now, what would stop them switching, and which records or household interactions the story misses. End with one genuine next step: another scenario, an optional second session, or the later paid pilot when ready. Record behavior separately from compliments. Do not invent participant quotations in the results report.
