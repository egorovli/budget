# Clarity, refined — editable screens and exports

Prepared 12 September 2026 after the founder requested more balanced, credible app screens. Clarity remains the only visual direction. The four campaign tasks remain unchanged. A later copy pass on the same day replaced the slogans with ordinary language; see [COPY.md](../COPY.md) and the [app-reference study](../research/copywriting-references.md).

Open [the design studio](http://127.0.0.1:8770/clarity-campaigns/refined/) or [index.html](index.html). Choose a screen, switch between App and Ad, or use All screens.

## What the sources are

The previous images were flattened AI-generated PNGs. Their [exact prompts](../prompts-01-02.md) and [other prompt pair](../prompts-03-04.md) are preserved, but they did not contain editable design layers.

This revision is rebuilt as HTML, CSS and SVG icons. The PNGs are deterministic exports of that source. No image generation or raster retouching was used for this revision. These are editable web layouts, not a Figma file, an iOS binary, or implemented bank connections.

| File | Edit here |
| --- | --- |
| [screens.js](screens.js) | Four screen layouts, synthetic data, labels and original SVG icons |
| [screens.css](screens.css) | App colors, typography, spacing, row geometry and controls |
| [studio.js](studio.js) | Screen switching, sample interactions, and shared ad markup |
| [campaign-copy.js](campaign-copy.js) | Generated ad copy; edit ../campaigns.json and run ../build_pages.py |
| [studio.css](studio.css) | Review gallery, device frame and ad composition |
| [render.js](render.js) | Source DOM → SVG foreignObject → canvas PNG rendering |
| [render.html](render.html) | Local export interface with a Download PNG link |

## New screenshots

| Job | App screenshot, 1206 × 2622 | Ad, 1440 × 1800 |
| --- | --- | --- |
| Bank sync | [Accounts](exports/sync-screen.png) | [Ad](exports/sync-ad.png) |
| Envelope budgeting | [Plan](exports/envelopes-screen.png) | [Ad](exports/envelopes-ad.png) |
| Transaction clarity | [Activity](exports/transactions-screen.png) | [Ad](exports/transactions-ad.png) |
| Purchase decision | [Purchase check](exports/purchase-screen.png) | [Ad](exports/purchase-ad.png) |

Each app layout is 402 × 874 logical pixels, exported at 3×. Each ad is 720 × 900, exported at 2×. The phone inside the ad uses the same screen function. Text and icons are rendered at export resolution; the old PNGs are not stretched, sharpened or cropped.

Download [all sources and eight PNGs](clarity-refined-source-and-images.zip). The [manifest](manifest.json) records dimensions and checksums. Source rendering uses the host's system sans-serif font; exact glyph metrics may vary on another operating system. Use the supplied PNGs for an identical visual result.

## What changed and why

- A 32-pixel title, a 14–16-pixel row hierarchy, and aligned tabular amounts replace the oversized and inconsistent generated type. Financial amounts are large only when entering an amount or reading the allocation state.
- Fixed 20–24-pixel page margins, consistent row heights, and quiet separators establish a repeatable rhythm. Space separates tasks rather than filling an empty poster.
- Accounts shows three balances with source/freshness context and one action for a category review. The $5,000 total includes $200 manual Cash; Cash is never shown as a bank connection.
- The envelope plan shows $0 left to assign and keeps $600 visibly available in Everyday spending. The highlighted row carries the evidence; a second duplicate callout is unnecessary.
- Activity has a search field, filters, and date groups. A record opens in a separate sheet. The same expense is not presented twice in the base screenshot.
- Purchase check has one dominant input, a compact result, a keypad, and Done. It is explicitly hypothetical. The calculation uses cents and never saves an expense.
- The ad headline is quieter and left aligned. One consistent slim frame replaces generated device shapes. All ads use the same positions, dimensions and screen scale.

These choices follow the principle of legible hierarchy and consistent layout described in Apple's [Typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography) and [Layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout). They are our design choices, not an Apple approval or a claim that a mathematical ratio guarantees good design. The earlier Flighty and other app references remain inspiration rather than copied UI.

## Interactions you can try

The review studio uses synthetic in-memory examples. Search filters the four records; Account and Category filters demonstrate Everyday and Groceries. Opening a row shows its details. The purchase keypad replaces the initial $120 on first numeric entry and updates the Free amount. Done returns to Accounts. No network service, local persistence or analytics receives these actions.

Book selection, Account/Reserve selection, and full planning edits are visual placeholders. Adjust plan states that the sample has not changed. Bank review navigates to the separate Activity example; this is not an end-to-end import/review implementation. The screens illustrate separate moments. City Transit is awaiting classification in the import view and categorized in Activity. North Studio is a fictional income dated 11 September; the three expenses are dated 12 September. No monthly totals are inferred from those four records.

## Regenerate an image

1. Edit the source files above. For ad copy, edit ../campaigns.json and run `python3 ../build_pages.py` from this directory before rendering.
2. Keep the local server running. If needed, from this directory run `python3 -m http.server 8771 --bind 127.0.0.1 --directory .`.
3. Open `render.html?screen=sync&format=screen` on that server. Screen can be `sync`, `envelopes`, `transactions`, or `purchase`; format can be `screen` or `ad`.
4. Select **Render PNG**, inspect the result, and use **Download PNG**. Save the replacement in exports/ with the same name. No third-party service or paid API is used.
5. Inspect the app and ad together after a layout change. Financial labels and values must match; do not introduce a feature just to fill space.

The renderer loads local CSS over HTTP. It therefore needs the simple local server; the review studio itself has no build or package-install step. The original browser full-page screenshot exporter produced incorrect stitched images on this host. Those drafts were replaced by the source renderer; none is included in the final exports.

## Review scope

The eight PNGs were decoded and inspected. Checks covered layout bounds, no content under the tab bar, search with one/no match, Account filtering, record details, and the hypothetical calculation ($50.25 → $549.75). Primary supporting text was darkened to improve readability: #667182 against #F6F7F9 gives about 4.61:1; white against cobalt #245BFF gives about 5.23:1. This is a focused visual review, not a full accessibility or device test. Dynamic Type, native navigation, complete keyboard support and all production workflows still require implementation.

The parent campaign gallery and four offer pages now use these new exports. The original generated images remain in ../assets/ as source history. No campaign has been launched.
