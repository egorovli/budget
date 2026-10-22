# Sort of Budget design reference library

**Open [the visual gallery](index.html).** It contains **49 apps and 346 source images**: all 41 apps that Apple classified as non-game Design Award winners in 2020–2026, plus eight selected finalists. This is a complete winner set for that period, not a claim to cover the award's full history.

Use **Explore screens** to see all images for an app. Pick a whole app or individual screens, add a short note, then use **Export picks**. The export includes exact image paths. You can paste it into the conversation. Picks are stored in your browser, not in these repository files. Export a copy before changing browser or preview address. There are no initial picks: the 12 starting points are suggestions, not your preferences.

The gallery opens as a local HTML file and needs no internet or build step. If your browser restricts local files, serve this directory with:

```sh
python3 -m http.server 8769 --bind 127.0.0.1 --directory /Users/egorovli/Dev/budget/docs/design-references/apple-design-awards
```

Then open <http://127.0.0.1:8769/>. All gallery images, styles, scripts, and data are local. Source links lead to external sites only when opened. Downloaded JSON records the picks; it is not an import file for the current gallery.

## What to review first

| Direction | Good places to start | The decision it helps make |
| --- | --- | --- |
| Clear data and state | Flighty, Tide Guide, Copilot Money | How should balances, commitments, and the Free amount read at a glance? |
| Quiet everyday utility | Crouton, Mela, iA Writer, Structured | How much information and navigation should stay visible? |
| Warm personal companion | Gentler Streak, Bears Gratitude, Headspace | How much illustration and emotional warmth fits household finance? |
| Precise professional tool | Halide, Darkroom, Shapr 3D | How should frequent input stay fast while advanced controls remain available? |
| Expressive identity | (Not Boring) Habits, Looom, grug, Lumy | What could make the app recognizable without a logo? |
| Spatial organization | Primary, djay, NBA, Taobao | How do layers and relative position communicate relationships? |

These groups are our interpretation. The gallery retains each app's verified award status. Copilot Money, SmartGym, Arc Search, Sunlitt, Lumy, Mela, iA Writer, and Structured are **finalists**, not winners in the cited year.

## What makes the references useful

[Read the research](research/award-findings.md) for the complete award roster and eight detailed, sourced case studies. The recurring design lessons are:

- Establish a clear visual order that matches the task.
- Give the app a coherent identity across screens, not just one attractive home view.
- Let the user's content, data, or current action carry the experience.
- Use color, type, and shape to communicate meaning.
- Build interaction, accessibility, and difficult states into the experience.
- Make campaign assets from that product experience.

Each [app note](apps/) describes what the inspected images show, a possible use in Sort of Budget, and a tradeoff. Those observations are separate from Apple's award rationale. None of these references prove demand or that a style will sell.

## Image evidence and limits

Collected on **12 September 2026** from Apple's public award pages, Newsroom, App Store pages, and public lookup metadata.

- **319 App Store promotional screenshots.** These include publisher text, devices, and illustrations where present. They are not captures from apps we installed. Current store images can differ from the award-year app.
- **27 Apple award-year images** from 2021–2025. These show the design Apple published at that time, often inside a device frame. They are labelled separately.
- **19 spatial App Store images** are included within the 319. They cover Primary, Taobao, NBA, and djay. Each image states its platform. Companion phone screens do not establish the quality of a spatial experience.
- Play's linked US App Store page returned 404. Its single reference is Apple's verified 2025 MacBook Pro image. The library does not infer why the listing is unavailable.
- Taobao's spatial images come from its Chinese App Store page and contain Chinese text.
- Screenshots cannot verify gesture quality, haptics, speed, offline behavior, accessibility, or retention. The written research links to Apple interviews for design intent. Hands-on review of the chosen references can follow.

Original image bytes are retained in `images/`. `thumbnails/` contains proportional previews; original framing and content are not altered. Every source image has its source URL, dimensions, byte count, and SHA-256 checksum in [apps.json](data/apps.json) and [sources.csv](data/sources.csv). The underlying app artwork belongs to its respective creators. Use it for this reference study; create original Sort of Budget assets for campaigns.

## Files

| File or directory | Purpose |
| --- | --- |
| [index.html](index.html) | Offline visual gallery with filters, picks, notes, and export |
| [research/award-findings.md](research/award-findings.md) | Award facts, sourced design lessons, and proposed next step |
| [apps/](apps/) | One Markdown reference page per app, including every screenshot |
| [images/](images/) | 346 source images |
| [thumbnails/](thumbnails/) | Small gallery previews |
| [contact-sheets/](contact-sheets/) | Overview boards used for visual inspection |
| [SELECTION.md](SELECTION.md) | Optional plain-text selection template |
| [data/apps.json](data/apps.json) | Complete app, award, image, and visual-note manifest |
| [data/sources.csv](data/sources.csv) | Image source inventory |
| [scripts/](scripts/) | Explicit collection, gallery generation, and verification tools |

## Direction for the next delivery agent

The user changed the sequence on 12 September 2026: **study references → user selects a direction → design a credible app experience → derive campaigns from that experience**.

The earlier demand kit's palette, layouts, and placeholder campaign images are proposals. They are not an approved product identity. Do not treat them as the design target. The demand hypotheses remain useful, but the selected visual direction must drive the next asset work.

After the user makes picks, propose three coherent Sort of Budget directions using the same financial scenario. Each should show a Book overview, Activity, fast transaction entry, and a Reserve or purchase decision. Then develop one chosen direction into a short interactive sequence with realistic content and difficult states. Preserve the distinction between Account balance, Available money, Reserve, Free amount, and Net worth. Only then derive campaign variations.

This research task did not modify the parallel `.worktrees/demand-assets/` checkout or implement Sort of Budget app screens.

## Rebuild or refresh

Run `python3 scripts/build_gallery.py` from this directory to regenerate the gallery, thumbnails, per-app notes, and CSV from local files. Pillow is required for thumbnail generation; viewing the gallery needs no Python package.

Run `python3 scripts/validate_library.py` to check the source images, manifest, and local links.

A network refresh is an explicit operation: run `collect_screenshots.py`, then `collect_additions.py`, then `build_gallery.py`. App Store designs can change. Review refreshed images and update the visual notes and research date before using them. These scripts are not scheduled tasks.
