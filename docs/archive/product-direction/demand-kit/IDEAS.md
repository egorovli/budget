# Product promises to test

These are proposed concepts. Priority is an editorial ordering, not measured demand. Read the named sources and production rules in [Start here](START-HERE.md).

## See what remains after commitments

Reference: `H01` · priority 1

**Hook A:** See what your next purchase changes.

**Hook B:** Make room for the things you want.

**Copy:** Explore a money plan that keeps bills, goals, and everyday spending in view.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet, Individuals with variable personal income

**What the concept must demonstrate:** Show $5,000 recorded money, $600 allocated to flexible spending, and a $120 purchase preview leaving $480 in that allocation.

**Objection to investigate:** Does this number include upcoming costs and stale bank records?

**Next behavior or question:** Ask the visitor to explain which amount they would consult before a $120 purchase and why.

**Claim boundary:** The number depends on recorded data and explicit allocations; never promise a guaranteed safe-to-spend amount.

## Several Accounts, one financial picture

Reference: `H02` · priority 2

**Hook A:** Bring your money into one view.

**Hook B:** A clearer picture across your Accounts.

**Copy:** Explore an overview that brings balances, recent activity, and your spending plan together.

**For:** Individuals with several Accounts, People planning household spending, People managing more than one currency

**What the concept must demonstrate:** Two generic Accounts show $3,200 and $1,800, their update times, and a $5,000 recorded total.

**Objection to investigate:** Will it support the institutions and Account types I actually use?

**Next behavior or question:** Collect optional institution names after signup, without Account numbers or login details.

**Claim boundary:** Direct feeds and coverage remain unverified; show generic providers and a concept label.

## Less routine recordkeeping

Reference: `H03` · priority 1

**Hook A:** Less logging. A clearer money picture.

**Hook B:** Make keeping up with money easier.

**Copy:** Preview a workflow that collects records and brings the items needing attention to you.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet

**What the concept must demonstrate:** Show a proposed import followed by one uncertain match for a manually recorded $40 expense; the resulting expense count stays one.

**Objection to investigate:** Will automation create errors I have to repair?

**Next behavior or question:** Ask which part of keeping records currently takes effort and whether a short review step is acceptable.

**Claim boundary:** No claim of zero manual work, measured time saved, or live bank sync. Matching remains a product hypothesis.

## A household plan both people understand

Reference: `H04` · priority 1

**Hook A:** One plan for the money you share.

**Hook B:** See the same plan before you spend.

**Copy:** Explore shared bills, everyday spending, and goals in a financial Book you can understand together.

**For:** People planning household spending

**What the concept must demonstrate:** Show Alex and Sam viewing the same flexible-spending allocation, with a labelled proposed change and its author.

**Objection to investigate:** Does this require sharing all my personal Accounts?

**Next behavior or question:** Ask which information should be shared and which should remain personal; an optional joint session is a stronger next step.

**Claim boundary:** Do not claim private zones, granular permissions, or immediate offline convergence are implemented.

## Personal and shared financial boundaries

Reference: `H05` · priority 3

**Hook A:** Plan together. Choose what you share.

**Hook B:** A shared plan with clear boundaries.

**Copy:** Explore separate personal and shared Books, with an explicit view of who has access.

**For:** People planning household spending, People who value manual control and data ownership

**What the concept must demonstrate:** Show two separate synthetic Books and an access preview for the shared Book; do not imply hidden rows inside one Book.

**Objection to investigate:** Can I trust what my partner or another Member can see?

**Next behavior or question:** Use a synthetic access task: ask the participant to identify exactly which Book the other Member can access.

**Claim boundary:** Personal-versus-shared Book behavior is a concept; privacy and invitation semantics need design review.

## An envelope plan that is easy to read

Reference: `H06` · priority 2

**Hook A:** Give your money a clear purpose.

**Hook B:** Know what is left in each part of your plan.

**Copy:** Preview simple allocations for bills, groceries, goals, and flexible spending.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet, Individuals with variable personal income

**What the concept must demonstrate:** Show five allocations totaling $5,000 and $0 unassigned, while groceries and flexible spending each still have $600.

**Objection to investigate:** Does zero unassigned mean I cannot spend anything?

**Next behavior or question:** Ask what $0 unassigned means and whether allocating all money feels useful or burdensome.

**Claim boundary:** Full allocation is illustrative, not a requirement accepted for all users; envelope and Reserve semantics remain open.

## Make room for occasional bills

Reference: `H07` · priority 2

**Hook A:** Make room for the bills that come later.

**Hook B:** Keep annual costs in your everyday plan.

**Copy:** Explore a place for occasional costs alongside the spending you see every week.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet, Individuals with variable personal income

**What the concept must demonstrate:** Show an annual $1,200 cost due in 12 months, a planned $100 monthly contribution, $0 funded today, and no change to Account balances.

**Objection to investigate:** Does setting a target mean the money is already saved?

**Next behavior or question:** Ask the participant to distinguish a planned contribution from funded money.

**Claim boundary:** Targets, allocations and expense attribution are distinct; do not show the plan as guaranteed future saving.

## Plan around variable income

Reference: `H08` · priority 3

**Hook A:** Make a plan for the money already here.

**Hook B:** A spending plan that starts with today's money.

**Copy:** Explore how to protect upcoming costs when personal income arrives on different dates.

**For:** Individuals with variable personal income, People maintaining a budget or spreadsheet

**What the concept must demonstrate:** Show $2,000 received and allocated; a separate $1,500 expected payment is excluded from spendable money.

**Objection to investigate:** Will a forecast make money look available before it arrives?

**Next behavior or question:** Ask what changes if the expected payment arrives a week late.

**Claim boundary:** No earnings, debt-relief, cash-flow guarantee, or small-business accounting claim.

## A clear view across currencies

Reference: `H09` · priority 3

**Hook A:** Keep the original currency. See the whole picture.

**Hook B:** A money plan across more than one currency.

**Copy:** Explore totals that show the exchange rate and keep each Account's original amounts visible.

**For:** People managing more than one currency, Individuals with several Accounts

**What the concept must demonstrate:** Show $3,000 plus EUR 1,000 at an explicitly illustrative 1.10 USD/EUR rate, yielding $4,100; date and source status stay visible.

**Objection to investigate:** Will changing exchange rates rewrite my old expenses?

**Next behavior or question:** Ask the visitor to distinguish an original amount from today's converted display.

**Claim boundary:** Sample rate is synthetic. Multi-currency budget valuation and historical reports need domain review.

## Bring an existing agent to your finances

Reference: `H10` · priority 2

**Hook A:** Give your own agent a clearer money picture.

**Hook B:** Ask your agent. Inspect the financial answer.

**Copy:** Explore agent access to a Book, with answers linked to records and stated assumptions.

**For:** People who already use AI agents

**What the concept must demonstrate:** A generic external agent requests the $120 purchase preview; the response shows $600 to $480, snapshot identity, and read-only scope.

**Objection to investigate:** What data can the agent read, retain, or change?

**Next behavior or question:** Ask which existing agent and one real task they would want to use; test willingness to try a synthetic Book.

**Claim boundary:** No named integration, certification, autonomous bank action, or claim of end-to-end privacy. OAuth/API/MCP choices remain unbuilt.

## Preview a spending decision

Reference: `H11` · priority 2

**Hook A:** Try the purchase in your plan first.

**Hook B:** What changes if you spend $120?

**Copy:** Explore a purchase preview that shows the effect before any record changes.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet, People who already use AI agents

**What the concept must demonstrate:** A slider or amount field previews $0 to $600 against the flexible allocation; reset restores $600, and recording is a separate action.

**Objection to investigate:** Is this a prediction or arithmetic based on the plan?

**Next behavior or question:** Ask the participant to make two scenario checks and explain what the result assumes.

**Claim boundary:** Scenario arithmetic is not a recommendation to spend or a prediction of unknown expenses.

## Core money tools available offline

Reference: `H12` · priority 3

**Hook A:** Keep working on your money plan offline.

**Hook B:** Your records and plan, even without a connection.

**Copy:** Preview local expense entry, reports, and spending calculations while online updates wait.

**For:** People who value manual control and data ownership, People managing more than one currency

**What the concept must demonstrate:** Turn a labelled demo connection off, record a $40 cash expense locally, and keep the update-pending indicator visible.

**Objection to investigate:** Will the app lose or duplicate changes when it reconnects?

**Next behavior or question:** Ask whether this is a purchase reason or an expected reliability feature.

**Claim boundary:** Bank feeds and remote agents cannot work without connectivity; do not imply otherwise.

## Understand where every number came from

Reference: `H13` · priority 3

**Hook A:** Open a total. See what is behind it.

**Hook B:** Financial answers you can inspect.

**Copy:** Explore reports that link totals to the records, amounts, and dates that produced them.

**For:** People maintaining a budget or spreadsheet, People who already use AI agents, People who value manual control and data ownership

**What the concept must demonstrate:** Open a $240 spending total to show $120 + $80 + $40 and its date range; no AI-generated arithmetic.

**Objection to investigate:** Can I correct a record and see the change propagate?

**Next behavior or question:** Ask the participant to locate the cause of an incorrect total in a synthetic example.

**Claim boundary:** The concept is auditability, not an external audit, accuracy certification, or accountant-approved product.

## Keep ownership of financial records

Reference: `H14` · priority 3

**Hook A:** Keep a way out for your financial records.

**Hook B:** A money tool with your data in your hands.

**Copy:** Explore clear export and backup options alongside your everyday financial plan.

**For:** People who value manual control and data ownership, People maintaining a budget or spreadsheet, People who already use AI agents

**What the concept must demonstrate:** Show separate actions for a transaction CSV and a complete Book backup, with a clear distinction in what each contains.

**Objection to investigate:** Will the export preserve the plan and history, or just a list of expenses?

**Next behavior or question:** Ask what the participant would need to take with them when switching tools.

**Claim boundary:** No claim of verified restoration until implemented and tested; export alone does not establish portability.

## A paid product with no in-app ads

Reference: `H15` · priority 3

**Hook A:** A money app built around your plan.

**Hook B:** A clear subscription. No in-app ads.

**Copy:** Explore a proposed paid finance app focused on useful records, plans, and decisions.

**For:** People who value manual control and data ownership, Individuals with several Accounts, People planning household spending

**What the concept must demonstrate:** Show a calm plan screen and the selected offer line, with no sponsor cards or upsell panels. Show $9/month only for the default price-visible offer.

**Objection to investigate:** Why pay when other tools are free?

**Next behavior or question:** Ask which outcome could justify the displayed price; treat no-ads as a possible preference rather than proof of demand.

**Claim boundary:** No unapproved promise about data sale, encryption architecture, lifetime access, or future price protection.

## Fast entry when a record is missing

Reference: `H16` · priority 3

**Hook A:** Add the missing expense and move on.

**Hook B:** Quick entry when you need it.

**Copy:** Preview amount-first entry with a remembered Account and optional details.

**For:** People who value manual control and data ownership, People maintaining a budget or spreadsheet, Individuals with several Accounts

**What the concept must demonstrate:** Enter 40, choose Cash, and save; show three visible actions and optional category details, without claiming measured completion time.

**Objection to investigate:** Why enter anything manually if the app connects to banks?

**Next behavior or question:** Ask about cash, late records, and correction cases; test whether the flow is understandable.

**Claim boundary:** Do not advertise a measured number of seconds, universal gesture support, or tested performance.

## Turn statements into a reviewable picture

Reference: `H17` · priority 3

**Hook A:** Start with the statements you already have.

**Hook B:** Explore your records before connecting a bank.

**Copy:** Preview statement import with source rows, a review step, and traceable results.

**For:** People maintaining a budget or spreadsheet, Individuals with several Accounts, People who value manual control and data ownership

**What the concept must demonstrate:** Show a synthetic statement row beside a proposed transaction; flag a date ambiguity and require review before confirmation.

**Objection to investigate:** Can it read my bank's PDF correctly and keep the document private?

**Next behavior or question:** Collect optional document source and format names; do not request real statements in the public interest test.

**Claim boundary:** PDF/CSV parsing, supported formats, privacy and reconciliation are unverified. No live upload field in the demand page.

## Review exceptions instead of every record

Reference: `H18` · priority 2

**Hook A:** See which records need your attention.

**Hook B:** A clear review step for uncertain records.

**Copy:** Explore a short review queue that explains what is unclear and what each choice changes.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet

**What the concept must demonstrate:** One synthetic $40 possible duplicate is shown with the original entry, proposed source match, and effect on totals.

**Objection to investigate:** What if the app fails to flag a real error?

**Next behavior or question:** Ask the visitor to resolve the sample and explain what remains uncertain.

**Claim boundary:** No claim of perfect exception detection or a measured percentage reduction in work.

## Separate payment timing from cost attribution

Reference: `H19` · priority 4

**Hook A:** See when you paid and what period it covers.

**Hook B:** A clearer view of occasional expenses.

**Copy:** Explore separate views of money movements and the periods a cost belongs to.

**For:** People maintaining a budget or spreadsheet, Individuals with variable personal income, People who already use AI agents

**What the concept must demonstrate:** A $1,200 January payment remains $1,200 cash out in January; an illustrative cost view assigns $100 to each of 12 months.

**Objection to investigate:** Does spreading the cost make cash seem available after it was spent?

**Next behavior or question:** Ask the visitor to compare the January cash view with the monthly cost view.

**Claim boundary:** Exploratory beyond current MVP; no tax, legal-accounting compliance, accrual-system, or business-bookkeeping promise.

## Keep goals visible while spending day to day

Reference: `H20` · priority 2

**Hook A:** Keep everyday spending and your goals in view.

**Hook B:** Give today's purchases and tomorrow's plans a place.

**Copy:** Explore a plan that makes goal allocations visible beside money for daily use.

**For:** Individuals with several Accounts, People planning household spending, People maintaining a budget or spreadsheet

**What the concept must demonstrate:** Show a $1,600 savings allocation unchanged while a separate $600 flexible allocation becomes $480 in a purchase preview.

**Objection to investigate:** Is this goal balance actual money or just a target?

**Next behavior or question:** Ask the visitor to identify funded money and explain the effect of the purchase.

**Claim boundary:** No promised savings amount, investment return, or inferred automatic protection from overspending.
