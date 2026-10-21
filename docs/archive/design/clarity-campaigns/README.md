> Current: [five AI-enabled campaign kits](campaign-kits/) and [the Remotion player](campaign-kits/motion/public/). This directory retains the earlier single-image design references.

> **Current campaign package:** [Four complete use-case campaigns](campaign-kits/README.md) replaces this earlier single-image plan. Use [campaign-kits/PLAN.md](campaign-kits/PLAN.md) and [campaign-kits/briefs.md](campaign-kits/briefs.md) for the current four-story test. This document remains earlier preparation history.

# Clarity campaign kit

Updated 12 September 2026. Clarity is the selected design. The current kit uses editable app layouts and revised copy based on the apps the founder liked.

Open [the design studio](http://127.0.0.1:8770/clarity-campaigns/refined/?screen=sync&mode=ad) or [the campaign gallery](index.html). Each ad has a matching page with the same proposed $9/month offer. The screens use fictional data. The pages do not collect contacts.

| Campaign | Current ad | Matching page |
| --- | --- | --- |
| Keep track without typing it all in. | [PNG](refined/exports/sync-ad.png) | [Preview](sync.html) |
| Rent, groceries, and the weekend. | [PNG](refined/exports/envelopes-ad.png) | [Preview](envelopes.html) |
| Which account was that on? | [PNG](refined/exports/transactions-ad.png) | [Preview](transactions.html) |
| What’s left if I spend $120? | [PNG](refined/exports/purchase-ad.png) | [Preview](purchase.html) |

## Files to use

- [COPY.md](COPY.md): voice, wording decisions, and editing rules.
- [CAMPAIGNS.md](CAMPAIGNS.md): current ad copy, post text, and four 12-second video briefs. Videos have not been rendered.
- [App copywriting references](research/copywriting-references.md): first-party examples from all ten selected apps.
- [Source guide](refined/README.md): editable HTML/CSS screens, four 1206 × 2622 screenshots, and four 1440 × 1800 ads.
- [Experiment plan](EXPERIMENT-PLAN.md): the audience, offer, measurement, and delivery handoff.
- [Visual brief](VISUAL-BRIEF.md): current layout and export instructions.
- [campaigns.json](campaigns.json): active copy source. [results-template.csv](results-template.csv): empty measurement sheet.
- [Source and image ZIP](refined/clarity-refined-source-and-images.zip): the current kit, with campaign pages and editable sources.

Run `python3 build_pages.py` here after editing campaigns.json. This rebuilds the pages, copy sheet, and refined/campaign-copy.js. Then regenerate affected PNGs using the source guide. The original prompt files are historical references, not current copy instructions.

## Next step

Use the experiment plan, current copy sheet, and current exports. A real signup flow and agreed publishing inputs are still needed. The proposed test uses a $600 media ceiling, or just sync and envelopes if the founder chooses a smaller budget. These are preparation defaults, not approved spend. No ads, recruitment, contact collection, or payments have been launched.

The test should measure price-aware interest and reasons to switch. Good-looking screens and clicks alone do not show demand, retention, or profit.

## Earlier material

The flattened AI images remain in assets/. Their source history is preserved in [the first prompt pair](prompts-01-02.md), [the second prompt pair](prompts-03-04.md), and the historical section of [REVIEW.md](REVIEW.md). The earlier [feature research](research/findings.md) explains the product hypotheses; any draft slogans there are superseded by campaigns.json. The parent [design gallery](../index.html) is an archive of the earlier visual directions.
