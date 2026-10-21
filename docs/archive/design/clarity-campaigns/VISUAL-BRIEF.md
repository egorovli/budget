# Clarity visual brief

Updated 12 September 2026. Preserve the refined Clarity layouts: the founder said the screenshots were okay and requested better wording. The four tasks and sample financial states remain fixed.

## Sources

Use [refined/screens.js](refined/screens.js) and [refined/screens.css](refined/screens.css) for the app screens. Use [refined/studio.js](refined/studio.js) and [refined/studio.css](refined/studio.css) for the ads. Active wording comes from [campaigns.json](campaigns.json); [COPY.md](COPY.md) explains the voice. Run `python3 build_pages.py` to regenerate the browser copy and matching pages.

The older AI images and prompts are historical. Do not use them as the copy source or flatten the editable layouts into new generated images.

## Fixed composition

Keep the existing white and cool-grey surfaces, dark type, cobalt accent, aligned amounts, rows, and device frame. Keep the current type sizes, screen scale, and spacing. Each ad has the Budgetly name, one two-line headline, one supporting sentence, one phone screen, **See how it works**, and **In development · Sample screens**. Keep the disclosure readable.

## Screen evidence

| Ad | What must remain visible |
| --- | --- |
| Bank sync | Everyday $3,000 updated at 9:40, Joint $1,800 updated at 9:38, Cash $200 added by hand. Three bank transactions; one category review. Total $5,000. |
| Envelopes | $0 Left to assign; All $5,000 assigned. Rent $1,800, Groceries $600, Bills $400, Emergency fund $1,600, Everyday spending $600. The $600 row is highlighted once. |
| Find a transaction | Search, account/category filters, three expenses dated 12 September and one income dated 11 September. A transaction opens in a separate detail sheet. |
| Purchase check | $120 input, Use a reserve: None, $480 Free after purchase, $600 free now. Basis: $5,000 available minus $4,400 set aside. Nothing is recorded. |

The two plan states differ. In the envelope example all money is assigned, including $600 for everyday spending. In the purchase example $600 remains free. Do not combine the two states or imply that $0 unassigned means no money can be spent.

## Export and review

Deliver four app screenshots at 1206 × 2622 and four ads at 1440 × 1800 under refined/exports/. Use the [source renderer](refined/README.md), which exports real text and SVG icons. Review the PNGs after a copy change; confirm line breaks, no overlap, correct amounts, and consistent wording on the matching pages. Refresh refined/manifest.json and the ZIP.

The [video briefs](CAMPAIGNS.md) describe later motion versions. They are not delivered videos. No bank logos, fake testimonials, award badges, universal coverage, immediate updates, or guaranteed savings claims. Keep the same offer across all four campaign concepts. Nothing here authorizes publishing or ad spend.
