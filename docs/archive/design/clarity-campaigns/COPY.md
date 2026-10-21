# Clarity copy: ordinary tasks, clear answers

Revised 12 September 2026. The founder approved the screenshots as a starting point and asked for more human wording. The layouts stay fixed. This pass changes the headlines, supporting copy, posts, landing pages, and selected app labels.

## The voice

Write as one person explaining a useful app to another. Use the words someone would use when checking their money: rent, groceries, a payment, an account, money set aside. Contractions are welcome. Cleverness is optional; meaning is not.

The [reference study](research/copywriting-references.md) covers the ten apps the founder liked. Mela and Crouton supply useful models for direct actions and concrete examples; Flighty's factual notifications show how short status text can work. We have not copied their slogans, testimonials, or claims. Some of their promotional copy is less useful as a model than their product text.

## The four ads

| Task | Headline | Supporting sentence |
| --- | --- | --- |
| Keep records up to date | Keep track without typing it all in. | Bring in transactions from your connected bank accounts. |
| Plan money | Rent, groceries, and the weekend. | Set money aside for each, using what you have today. |
| Find a payment | Which account was that on? | Find a payment without checking each bank app. |
| Check a purchase | What’s left if I spend $120? | Check what’s left after the money you’ve set aside. |

The first ad names work the app could remove. The second names things a real budget needs to cover. The last two use questions someone might ask while checking their own money. The screenshot must supply the answer or show the action. A line break is for layout; it does not require a pair of slogans.

All four use **See how it works**, **For you and your household**, and **In development · Sample screens**. The destination is a preview. There is no download or working signup to promise. Each matching page retains the same proposed $9/month offer.

## Wording changes inside the app

| Previous | Current | Reason |
| --- | --- | --- |
| Your everyday money, together. | Bank accounts and cash. | Says what is on this screen. |
| Latest bank imports | From your banks | Names the source in ordinary language. |
| Updated manually | Add by hand | Explains how cash records are entered. |
| Long-term reserve | For unexpected costs | Explains the emergency fund's purpose. |
| Assigned to a purpose. Still in your Accounts. | Planning doesn’t move money between accounts. | Explains the effect of planning directly. |
| The details, all in one place. | Payments and income across your accounts. | Names the records instead of selling the list. |
| What would you like to spend? | How much would it cost? | Describes a hypothetical purchase without encouraging spending. |
| Try an amount. Nothing is recorded. | This won’t record a purchase. | Makes the action's effect clear. |

Keep **Left to assign**, **All $5,000 assigned**, **Free after purchase**, and **Use a reserve** precise. Sentence case makes labels easier to read; it does not change the domain model. An account, a category, and a reserve remain different things. “Set aside” explains a reserve in the advertising, but the calculation still uses the reserve amounts.

## Editing rules

- Name one task per ad. Bank sync, planning, retrieval, and purchase checking remain separate hypotheses.
- Use a concrete example when it makes the benefit clearer. Keep its numbers consistent with the screen.
- Do not turn a projected result into permission to spend. The app can show $480 remaining; it cannot know about an unrecorded bill.
- Do not imply all banks, immediate updates, automatic cash records, or guaranteed savings.
- Do not scold people, call spending good or bad, or promise a changed life.
- Remove words such as seamless, effortless, smarter, empowering, and peace of mind unless the sentence supplies a specific, supported meaning.
- Avoid competitor catchphrases. The previous envelope headline is retired along with the generic “Less logging / More living” construction.
- Keep concept disclosure readable. Put detailed connection limits and the proposed price on the matching page.
- Read the headline and subline aloud. If they would sound odd in an ordinary conversation, rewrite them.

## Source and handoff

[campaigns.json](campaigns.json) owns the active ad headlines, deliberate line breaks, sublines, post text, CTA, disclosure, landing copy, and video briefs. [CAMPAIGNS.md](CAMPAIGNS.md) is the generated delivery sheet. Later headline alternatives are text options, not additional exported ads or new test cells.

Run `python3 build_pages.py` here after a copy edit. It updates the four pages, gallery, delivery sheet, and [refined/campaign-copy.js](refined/campaign-copy.js). The studio and PNG renderer read that generated copy. Edit app labels in [refined/screens.js](refined/screens.js), then regenerate affected screenshots and ads using [the source guide](refined/README.md).

No copy change proves demand. Test the four complete presentations under the [experiment plan](EXPERIMENT-PLAN.md). Compare price-aware interest and reasons to switch; do not treat clicks as purchases. No campaigns were launched in this pass.
