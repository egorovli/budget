# Sort of Budget — shared visual production brief

## Assignment

Produce high-fidelity original Sort of Budget app concepts for pre-build demand experiments. The founder rejected boilerplate campaign cards and wants a credible, desirable app experience that can supply the campaign images. These are image-based design explorations, not a working finance app. Four directions run independently. Work only in the directory assigned by the parent agent.

Read your direction brief and inspect its three linked local screenshot references using view_image. Read the imagegen skill at /Users/egorovli/.codex/skills/.system/imagegen/SKILL.md. Use the built-in image_gen tool, not external paid APIs. For new original images, omit referenced_image_paths and num_last_images_to_include; translate your inspected references into a detailed visual specification in the prompt. Do not copy another app's logo, artwork, or exact composition.

## Product and audience

Individuals and households with money spread across Accounts and commitments to plan. They want a current picture, a shared plan, and an understandable Free amount before making a purchase. The experience should feel useful, trustworthy, fast, and worth paying for. No AI chat interface on the home screen. Optional AI can help review records; it is not the product's visual identity.

## Exact common scenario

One Book called **Our household**, in USD. Fictional demonstration data only. Three Accounts:

- Everyday: $3,000
- Joint: $1,800
- Cash: $200

Available money = **$5,000**. Funded Reserves = **$4,400**:

- Rent: $1,800
- Groceries: $600
- Bills: $400
- Emergency fund: $1,600

Free amount = **$600**. This is the current decision amount, distinct from Account balances and Net worth. Do not show $600 as the bank balance. Income expected in the future does not enter any current total.

Purchase preview: a proposed **$120** purchase, paid from Everyday and using no Reserve. Before saving, display **Free after purchase $480**. It is a preview; no actual account balance changes yet. If you show the resulting state, Available money is $4,880 and Everyday is $2,880, while Reserves stay $4,400. Prefer a preview with the exact two numbers $120 and $480 to keep the hierarchy clean.

Illustrative Activity can contain Corner Market −$84.20, Café North −$12.50, City Transit −$9.80. These are already included in the current balances, not additional deductions. No fake live bank logos or claims about universal institution coverage.

## Required deliverables, in your assigned directory

1. `DESIGN.md`: a concise real design system, not a list of adjectives. Include typography roles and numeral treatment, exact palette, spacing scale, surfaces/radii/borders, icon treatment, chart grammar, navigation, interaction/motion intent, accessibility considerations, three meaningful product moments, and what makes the system distinct. Include the campaign hook and what its image proves.
2. `prompts.md`: the exact prompts used, tool path (built-in imagegen), source inspiration, output mapping, and any visible limitations.
3. `app-board.png` (or actual returned extension): one high-resolution landscape board with three large, complete, front-facing iPhone app screens. Screens: Overview, Plan, Purchase check. Minimal presentation background, no decorative collage hiding the UI. These should look like a finished native iOS app: credible navigation/status bar, deliberate typography, readable hierarchy, consistent controls. Three screens must belong to one system. Use portrait phone proportions. Request about 2400×1600 if supported through prompt; preserve the actual returned resolution. Do not claim a resolution not returned.
4. `ad-portrait.png` (or actual returned extension): an original 4:5 portrait campaign concept, request 1080×1350 or a comparable high-resolution aspect. SAME exact headline across all four directions: **Know what’s free to spend.** Subline **Accounts, commitments, and your next decision.** One large hero phone using the same visual language and Overview numbers. Include the brand **Sort of Budget**. CTA **Explore the concept**. A small legible footer: **Concept preview · Not yet available**. Keep the composition editorial and confident, with the phone as evidence, not a tiny decorative accessory. Do not use reviews, award badges, fake download counts, bank logos, or App Store availability badges.
5. `result.json`: id, title, board relative file path, ad relative file path, actual dimensions, short visual summary, known limitations. Parent uses this to make the comparison page.

## Quality expectations

The founder wants appealing, distinctive work. Spend effort on real layout composition and coherent screens. Make the design look like people could use it tomorrow. Avoid generic mint dashboards, arbitrary piles of rounded cards, repeated gradients behind every row, tiny screenshots surrounded by huge empty text panels, device perspectives that hide content, garbled microcopy, illegible financial numbers, or giant mascots that replace the workflow.

The Overview must show the relationship $5,000 − $4,400 = $600 clearly. The Plan must show the four funded Reserves, their individual values, and remaining Free amount. The Purchase check should provide one focused amount-entry surface and the resulting Free amount. Not every number needs a card. Design the navigation and grouping.

Use very little copy inside generated screens to improve fidelity. Financial values and their labels are the hard constraints. Small peripheral text can be omitted instead of invented. Mark the app board with **Design concept · Synthetic data** outside the app screens. Honest concept labelling belongs on the presentation/ad, not a giant warning in the product UI.

## Execution

Use one imagegen call for the app board, inspect it, then a second call for the ad. Follow the imagegen tool's execution/wait instructions. Forward the image result with generatedImage when appropriate. Find the returned saved image path, copy the final selected images into your assigned workspace directory, and inspect the saved files. Never leave project assets only in a cache. If the tool provides only image content, preserve it according to the tool's supported output mechanics and report any limitation. If generation fails, report the actual failure; do not substitute boilerplate SVG cards and call it done.

Correct a material visual or arithmetic defect with a targeted image edit using imagegen. Avoid endless variations. Report actual outcomes, not planned outputs. Do not publish, launch campaigns, spend money, touch the other directions, change app code/dependencies, or modify `.worktrees/demand-assets/`.

## Review correction

The Purchase check primary button is **Done**. This screen models a hypothetical purchase, so it must not suggest that checking the impact records an expense. Actual expense entry is a separate action after a purchase. Preserve the preview label and the $120 / $480 values.
