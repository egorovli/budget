# Clarity demand experiments: research and decisions

Research date and source access date: **12 September 2026**. Audience: individuals and households. Design direction: **Clarity only**. This is preparation for demand tests, not a campaign launch or evidence of demand.

## Decision

The active batch follows [EXPERIMENT-PLAN.md](../EXPERIMENT-PLAN.md): four cells within the existing $600 proposed media total, or sync versus envelopes if a smaller ceiling is chosen. Alternative copy and sequencing below are research suggestions; the active plan and campaigns.json own final campaign choices.

Test four concrete jobs with the same simple visual system: **keep records current**, **give existing money a purpose**, **understand transactions**, and **check a purchase**. The open question is which job makes an identifiable person consider switching and paying. A generic promise of a nicer finance app is too broad to answer that question.

The first-party sources establish that these jobs have existing products. They do not establish an unmet market, a switch rate, or demand for Sort of Budget. Our working hypothesis is that a clear, low-effort experience could attract a specific group whose current method fails at one of these jobs. That hypothesis requires direct behavioral evidence.

## What primary sources establish

| Source observation | Implication for Sort of Budget | What it does not prove |
| --- | --- | --- |
| YNAB explains zero-based budgeting as assigning all money to purposes, including expenses and savings. Its current assignment guide says money without a category remains Ready to Assign. [Method](https://www.ynab.com/blog/what-is-a-zero-based-budget), [assignment guide](https://support.ynab.com/en_us/assigning-your-money-a-guide-SypgkrNJi). | An envelope story must show a completed allocation if it claims every dollar has a job. | That people prefer complete allocation to a Free amount, or that they will switch from YNAB. |
| Monarch presents combined Accounts, a searchable transaction list, reviewed transactions, and household collaboration as current product features. [Product page](https://www.monarch.com/). | These are established feature promises. We must show the particular task becoming easier. | That these features are absent elsewhere or that Monarch users are dissatisfied. |
| Monarch documents a monthly cash-flow budget based on expected income. It distinguishes this from a budget based on money already received. [Budget documentation](https://help.monarchmoney.com/hc/en-us/articles/360048883631-Budgets). | Label the basis of a number. Sort of Budget's current Available money is different from an expected monthly spending allowance. | That one method is always better. |
| Copilot documents Account connections, an initial budget based on past spending, a transaction review queue, category suggestions, and recurring items to review. [Quick-start guide](https://help.copilot.money/en/articles/11157550-quick-start-guide). | “AI categorization” alone is weak differentiation. A clear review result is a better visual demonstration than an AI badge. | A category suggestion is not verified bookkeeping, and this documentation does not measure Sort of Budget demand. |
| Monarch documents three main connection providers and lets users choose an alternative. Its guide also explains variation in history and pending transaction availability. [Connection guide](https://help.monarch.com/hc/en-us/articles/360048393352-Connection-issues). | Sync is a product workflow with exceptions and support work. Show source and freshness. | A provider integration does not give Sort of Budget equivalent coverage or reliability. |

These are product and support sources, not neutral evaluations. Marketing pages describe the seller's positioning. We use them to establish feature framing and documented behavior, not to repeat their superiority claims, savings claims, or selected testimonials.

## Bank sync: what a credible concept should show

Plaid says transaction checks typically occur **one to four times per day**, depending on institution. It offers an optional on-demand refresh product; access and charges are separate. Exact pricing requires production access or sales contact. Therefore “automatic” does not establish “instant,” and recurring provider costs remain an open business input. [Plaid Transactions documentation](https://plaid.com/docs/transactions/).

Plaid also documents that pending transactions can change amount or name, disappear, or be replaced by posted records. Some institutions supply no pending records. Imports must process additions, modifications, and removals. [Plaid transaction states](https://plaid.com/docs/transactions/transactions-data/).

TrueLayer's provider endpoint filters by country, scopes, and the providers enabled for a client. Its overview directs readers to the Console for supported countries and providers. Do not infer a launch coverage list from a country enum or from payment coverage. [Provider endpoint](https://docs.truelayer.com/reference/getproviders), [Data API overview](https://docs.truelayer.com/docs/data-api-basics).

TrueLayer documents that card scopes and available transaction history differ by provider. Its bank `available` balance can include an overdraft facility. That field must not be copied directly into Sort of Budget's Available money as if it were owned cash. [Account and card data](https://docs.truelayer.com/docs/account-and-card-data).

**Creative rules, inferred from those constraints:**

- Lead with **“Less logging. More knowing.”** Show imported records from two sample connected Accounts and a Cash Account marked Manual.
- Add a restrained freshness label, such as **Updated at 09:30**, and an explicit **Sample data** label around the concept.
- Show an item that needs review only if the image explains the task. Do not claim there is no routine review.
- Use **“Planned bank connections. Launch coverage to be confirmed.”** on the matching page. Ask for country and institution names after interest; no credentials or Account identifiers.
- Avoid “every bank,” “real time,” “never miss a transaction,” “100% accurate categories,” or a screen that suggests a real bank has already connected.

Later provider evaluation must verify the actual target institutions, Account types, consent flow, history, refresh behavior, pending handling, and cost. This research does not select a provider.

## Keep the two budgeting stories correct

The current [domain model](../../../../../GLOSSARY.md) defines **Free amount = Available money − active Reserves**. A Reserve is an allocation of existing money, not a separate Account or a bank transfer. A Category classifies a transaction; it is not a Reserve.

| State | Available money | Active Reserves | Free amount | What a $120 purchase preview means |
| --- | ---: | ---: | ---: | --- |
| Reserve-first plan | $5,000 | $4,400 | $600 | With no Reserve selected, Free after purchase is $480. |
| Fully allocated envelope plan | $5,000 | $5,000, including a $600 Everyday spending Reserve | $0 | Candidate rule, not yet adopted: with Everyday spending selected, its amount after purchase is $480; Free remains $0. |

The $4,400 consists of Rent $1,800, Groceries $600, Bills $400, and Emergency fund $1,600. Accounts total $3,000 + $1,800 + $200. In the second state, the extra Everyday spending Reserve assigns the remaining $600.

Do not show **“Everything assigned”** beside **$600 Free**. Do not show **$0 left to spend** after full allocation: money remains available in its Reserves. For plain consumer copy, “envelopes” can explain Reserves, but keep the internal mapping explicit. These are two coherent planning modes to test, not a silent domain change.

A purchase preview is hypothetical. It must not change balances or create a transaction. A candidate rule would reduce both the Account and selected Reserve for an actual Reserve-funded expense. That behavior still needs the domain decision in issue 07; this report does not adopt it. An internal transfer belongs in an Activity view with a clear Transfer type, rather than being counted as income or expense.

## Campaign hypotheses and evidence

All priorities below are design and research judgments. They are not measured market rankings.

| Priority and job | Promise | Clarity demonstration | What would support further work | Main alternative explanation |
| --- | --- | --- | --- | --- |
| 1. Maintain records | Less logging. More knowing. | Two connected Accounts, one manual Cash Account, imported transaction list, freshness label. | People with repeated update work show price-aware interest and name the institutions needed. Sessions reveal a real recurring maintenance task. | Visitors expect universal instant sync, or want a free bank feature. |
| 1. Allocate existing money | Every dollar has a purpose. | $5,000 Available → five funded Reserves → $0 Free, with $600 Flexible still spendable. | People understand why $0 unassigned does not mean no money; they describe a planning failure their present method does not solve. | Interest is in the familiar budgeting method, with no reason to switch. |
| 1. Find and understand transactions | See where it went. | Searchable, readable list with date, Counterparty, signed amount, Category, and source Account; one drill-down. | People can find a specific charge and explain it; they want this enough to attend a follow-up after seeing the price. | Attractive list design creates clicks, but the existing bank app already solves the task. |
| 2. Decide before purchase | Know what a purchase changes. | $600 Free → hypothetical $120 → $480 Free, with Reserves still visible. | People correctly distinguish Account balance from Free amount and describe a recent purchase decision where this helps. | A dramatic number attracts interest, but users distrust stale or incomplete inputs. |

The purchase story remains a valuable control against the three new feature-led stories. If spend is tightly capped, prepare all four but expose **three cells first**: sync, allocation, and purchase. Test the transaction-list story next against the most promising one. If all four run together, divide a separately approved budget explicitly; do not silently expand the old three-cell allowance.

Household sharing is a later variation of a useful job: “A plan you can both see.” Do not change the audience, promise, design, and format together and then claim to know which caused the result. Keep agent access and offline use as secondary product facts until a specific audience gives a reason to test them as lead promises.

## A small experiment that can inform a decision

Reuse the existing [experiment plan](../../../../../.scratch/finance-product-direction/demand-kit/EXPERIMENTS.md) and [offer guide](../../../../../.scratch/finance-product-direction/demand-kit/LANDING-AND-OFFERS.md), with Clarity and these revised promise cells. The earlier kit is preparation, not live evidence.

1. **Prepare one static ad and matching page per cell.** Hold visual style, placement, market/language, offer, price, CTA, layout, dates, and intended exposure constant. Change the job story, its headline, and the screenshot evidence together. The comparison estimates response to a promise bundle, not to a headline in isolation.
2. **Show development status and price before qualification.** Retain the kit's proposed **$9 USD/month** as a planning assumption for a US-English test. It is not a validated price or a decision that the US is the best market. A different market requires a separate offer and coverage assessment.
3. **Use a valid allocation method.** Google documents campaign experiments that split traffic or budget; that does not imply every campaign type offers the same controls. Use the chosen platform's actual available experiment setup and record it. Ordinary optimized creative delivery is observational. [Google Ads experiments](https://support.google.com/google-ads/answer/10682377?hl=en).
4. **Primary screen:** verified, qualified, price-aware interest per valid price-exposed visitor, with all numerator conditions explicit. Also report spend per qualified intent. Keep clicks, submissions, verified email, stated willingness to pay, attended sessions, and payment separate.
5. **Ask one job-specific question after interest.** Sync: which maintenance task and institutions? Envelopes: what is hard about allocation today? Transactions: what charge did you recently need to find or explain? Purchase: what decision is difficult after bills and goals? Store financial stories separately from ad analytics.
6. **Observe a synthetic task.** Ask participants to use the pictured workflow and explain the relevant amounts without teaching them first. Record confusion, current workaround, switching cost, and one genuine next commitment. Compliments and feature votes alone do not establish need.

### Decision rules are assumptions, not industry benchmarks

The existing kit's operational thresholds remain useful warnings: fewer than **100 valid price-exposed visitors per cell** makes rate ranking fragile; fewer than **10 qualified intents** makes cost ranking unstable. Reaching either number does not establish statistical power. Report counts and intervals; zero qualified intents has no finite cost per intent.

Use **five completed synthetic sessions** as a manageable learning batch, not a market-validation sample. Continue only when the promise is understood, concrete recurring problems appear, and participants make a real next commitment. If attractive ads produce poor qualified interest, inspect the promise, price, and expectation mismatch before making more images.

A later genuinely deliverable paid pilot can test payment. The prior kit's **ten eligible offers and three net paying, delivered participants** is only a proposed trigger to consider a small build. Assisted-service demand is not app subscription demand. Keep refunds, declines, unfinished sessions, and operator time in the result.

Choose **continue, revise, stop, or inconclusive** at the end. Do not call the highest click rate a winner. Do not extend spend automatically. No public source here supplies a valid universal conversion benchmark for this unbuilt product, and no campaign result can establish profitable retention before delivery and repeat use are measured.

## Open questions that matter after the first signal

- Which job produces price-aware interest and an actual reason to leave the current method?
- Are people seeking full allocation, a small set of Reserves plus Free amount, or both?
- Which countries, institutions, and Account types appear among qualified prospects?
- What data freshness do people need for the purchase answer to be useful?
- Does sharing require all records, selected Accounts, or a joint planning view? Current concept does not settle permissions.
- Can the price cover provider costs, support, taxes, payment costs, and other delivery costs?
- Will people complete setup, return to the task, and pay for a deliverable product?

More visual variants cannot answer these questions by themselves. The next useful output is a small set of credible task stories and a measurable offer, followed by observed behavior.
