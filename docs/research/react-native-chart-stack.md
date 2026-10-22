# React Native chart stack

Date: 2026-08-13

## Decision

Use direct Skia plus selected D3 modules behind one Sort of Budget–owned chart
module. The direct mobile dependencies are:

```json
{
  "d3-scale": "4.0.2",
  "d3-shape": "3.2.0"
}
```

Add `@types/d3-scale@4.0.9` and `@types/d3-shape@3.1.8` as development
dependencies. Do not install the `d3` umbrella, `d3-axis`, or `d3-zoom`.
Remove `victory-native`; do not keep two chart systems.

All required peer dependencies are already direct mobile dependencies:

- `@shopify/react-native-skia@2.10.1`
- `react-native-reanimated@4.5.3`
- `react-native-gesture-handler@2.32.0`
- `react-native-worklets@0.10.1`
- `react@19.2.8`
- `react-native@0.86.2`

Victory Native declares Skia `>=1.2.3 <3.0.0`, Gesture Handler `>=2.0.0`,
Reanimated `>=3.0.0`, and unrestricted React and React Native peer ranges. It
also includes `d3-scale`, `d3-shape`, and `d3-zoom` as its own dependencies.
The current Sort of Budget versions satisfy these ranges. [Victory Native package
metadata](https://github.com/FormidableLabs/victory-native-xl/blob/main/lib/package.json)

Expo SDK 57 currently recommends Skia `2.6.2`, while Sort of Budget has `2.10.1`.
The newer Skia version satisfies Victory Native and upstream Skia peer ranges,
and the existing local iOS build passed. Keep it only with the existing Expo
install exclusion and full local build checks. [Expo SDK 57 Skia
reference](https://docs.expo.dev/versions/v57.0.0/sdk/skia/)

## Why Victory was the initial recommendation

This section records the first assessment. The direct-stack reconsideration
later in this note supersedes the installation decision because Victory's
interface would constrain Sort of Budget's chart data, geometry, axis, and
interaction model.

Sort of Budget needs more than one fast line graph. It needs time-series lines and
areas, category bars, possible category shares, multiple series, axes, and
touch inspection. Victory Native gives these through one Skia-based system:

- `CartesianChart` transforms typed source data and provides chart points,
  scales, chart bounds, axes, and grids. It supports multiple Y series and
  sizes tick output from the chart size. [CartesianChart
  documentation](https://github.com/FormidableLabs/victory-native-xl/blob/main/website/docs/cartesian/cartesian-chart.md)
- The library has Cartesian line, area, bar, grouped and stacked bar, scatter,
  and candlestick components. It also has a polar chart and pie components.
  [Cartesian component index](https://github.com/FormidableLabs/victory-native-xl/tree/main/website/docs/cartesian)
  [Polar component index](https://github.com/FormidableLabs/victory-native-xl/tree/main/website/docs/polar)
- `useChartPressState` provides values and positions for a custom tooltip.
  Viewports and transform state support pan and zoom. [Victory Native getting
  started](https://github.com/FormidableLabs/victory-native-xl/blob/main/website/docs/getting-started.mdx)
  [CartesianChart viewport documentation](https://github.com/FormidableLabs/victory-native-xl/blob/main/website/docs/cartesian/cartesian-chart.md#viewport)
- The current release is `41.26.0`. The project describes its maintenance
  status as active. Recent releases added horizontal bars, stacked horizontal
  bars, axis titles, better label measurement, scroll and scrub coordination,
  and candlesticks. [Victory Native releases](https://github.com/FormidableLabs/victory-native-xl/releases)
  [Victory Native repository](https://github.com/FormidableLabs/victory-native-xl)

Victory Native is not a fixed visual theme. Its render-function API returns
chart geometry and accepts Skia drawing nodes. Sort of Budget can use a small shared
chart design layer without replacing the chart engine.

## Comparison

| Option | Strong points | Limits for Sort of Budget | Install now |
| --- | --- | --- | --- |
| `victory-native@41.26.0` | Skia rendering; line, area, bar, stack, scatter, pie, and candlestick; typed multi-series data; axes; custom press state; pan and zoom; active releases | Its data-key, render-function, axis, gesture, and geometry model becomes part of report implementation; no complete chart-specific screen-reader model | No |
| `react-native-graph@1.3.0` | Excellent animated time-series line graph; smooth scrub selection; optimized non-animated mode for lists; active 2026 reboot | It is a line-graph component, not a general report chart system; no bars or category chart system; no official web or chart accessibility contract in its README | No |
| `react-native-gifted-charts@1.4.78` | Broad set of ready-made charts; many props; SVG; press, pointer, scroll, and animation features; frequent releases | Adds `react-native-svg` plus `expo-linear-gradient`; separate package for web; current source development baseline still lists React 18 and React Native 0.74; very wide prop API; no documented chart-specific accessibility contract | No |
| Direct Skia plus selected D3 modules | Full control; small external seam; Skia works on native and web; D3 has strong scale and shape utilities | Sort of Budget must implement and verify axes, layout, labels, missing data, interaction, animation, and accessibility in one owned module | Yes |

### `react-native-graph`

`react-native-graph` is a good specialized option for a wallet-style price
history graph. Its official README only exposes a `LineGraph`. It supports
native path interpolation, up to 120 FPS animations, pan or scrub selection,
custom selection dots, and explicit X and Y ranges. It also has a lighter
non-animated mode for lists. [react-native-graph
README](https://github.com/margelo/react-native-graph)

The current release is `1.3.0`, published on 2026-07-23. The 2026 reboot
requires Skia newer than `1.12.4`, which Sort of Budget satisfies. The current
repository develops against React 19, React Native 0.83, Reanimated 4, and
Worklets. [react-native-graph
releases](https://github.com/margelo/react-native-graph/releases)
[Current package metadata](https://github.com/margelo/react-native-graph/blob/main/package.json)

It does not replace a full report chart system. Installing it together with
Victory Native would give Sort of Budget two APIs for the same line-chart role. Add
it later only if measurements show that one important miniature time-series
view cannot meet its performance target with Victory Native.

### `react-native-gifted-charts`

Gifted Charts supports bar, line, area, pie, donut, stacked bar, radar, bubble,
scatter, and candlestick charts. It has press callbacks, pointer labels,
scrolling, animation, multiple line data sets, and width adjustment. [Gifted
Charts README](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)
[Line chart props](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/LineChart/LineChartProps.md)

Its Expo installation requires `react-native-svg` and `expo-linear-gradient`.
Its web route is a separate `react-gifted-charts` package, although the project
states that the same component code can be used. The native package uses a
separate `gifted-charts-core` dependency. [Installation and web
statement](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts#installation)
[Package metadata](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/package.json)

The project is active. GitHub release `1.4.78` was published on 2026-08-10.
However, the source package metadata still uses React 18.2 and React Native
0.74 for development. Its peer ranges are unrestricted, but the repository
does not state a New Architecture support contract. This is a lower-confidence
fit than the Skia stack that Sort of Budget already builds. [Gifted Charts
releases](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/releases)

### Direct Skia and D3

Skia is the renderer, not a complete chart library. Direct Skia is useful when
a chart needs a visual or interaction that Victory Native cannot express. D3
can then calculate time, linear, ordinal, and band scales and can generate
lines, areas, arcs, pies, and stacks. [D3 scales](https://d3js.org/d3-scale)
[D3 shapes](https://d3js.org/d3-shape)

The revised decision installs only `d3-scale` and `d3-shape` as direct
dependencies. The detailed module design and dependency reason are in the
reconsideration below.

## Web boundary

Skia can run in a browser through CanvasKit. The CanvasKit WASM file is 2.9 MB
when compressed and loads asynchronously. For an existing Expo Router app, the
official setup requires copying `canvaskit.wasm` and loading Skia before a
component imports it. Code-split Skia components must stay outside the Router
`app` directory. [React Native Skia web
support](https://shopify.github.io/react-native-skia/docs/getting-started/web/)

Victory Native does not publish a separate web support contract in its current
documentation. Its package has a normal JavaScript import entry, and its
renderer is Skia, so web use is plausible after the required CanvasKit setup.
This is an inference, not a verified Sort of Budget result. Before web reports ship,
make a small Expo web proof with one responsive line chart, one bar chart, and
press or pointer interaction.

Do not add the Skia web setup now only to support a future platform. It changes
the Expo Router entry and adds a large WASM asset. Make that change with the
first web chart slice and validate the static export.

## Accessibility boundary

No compared chart library documents a complete chart-specific accessibility
model. The reviewed Victory Native Cartesian docs, Gifted Charts line, bar,
and pie prop tables, and react-native-graph README do not document
chart-specific accessibility properties. Therefore, a visual chart must not
be the only way to get a financial answer.

The Skia `Canvas` supports normal React Native View accessibility properties.
Skia recommends accessible React Native view overlays for individual drawing
elements. This provides building blocks, but Sort of Budget must still define the
meaning, focus order, controls, and spoken values. [Skia Canvas accessibility
documentation](https://shopify.github.io/react-native-skia/docs/canvas/overview/#accessibility)

For each Sort of Budget chart:

- Put a concise native `Text` summary before the chart. State the period,
  current value, change, and important exception.
- Provide the same exact values in an accessible list or table near the chart.
- Keep period and series controls as native accessible controls.
- Do not make scrub or tooltip gestures the only way to read a data point.
  Provide explicit previous and next controls when point inspection is needed.
- Use more than color to identify income, expense, account, category, Reserve,
  available money, free balance, and net worth series.
- Set an accessibility label on the chart container only when the label adds a
  useful summary. Do not expose one focus target for every dense canvas point.

React Native requires an accessible view and a useful `accessibilityLabel` for
screen-reader discovery. It also supports text accessibility values and
accessibility actions. [React Native accessibility
documentation](https://reactnative.dev/docs/accessibility)

This rule follows the Sort of Budget principle that UX is part of correctness and
that essential information must not depend on color, precise gestures, or
hidden behavior.

## Follow-up verification

After installation, verify:

1. Frozen dependency installation.
2. TypeScript and Biome checks.
3. Expo config and dependency checks.
4. One local iOS build with the New Architecture.
5. A small chart proof before the first report feature: responsive line or
   area, category bars, exact value selection, large text, Reduce Motion, and
   VoiceOver with the adjacent summary and data list.

## Direct stack reconsideration - minimal interface

### Revised recommendation

The concern about Victory Native is valid. Direct Skia plus selected D3 modules
is a reasonable fit if Sort of Budget wants control over chart layout and interaction,
not only control over colors and drawing nodes.

Replace `victory-native` with two direct runtime dependencies:

```json
{
  "d3-scale": "4.0.2",
  "d3-shape": "3.2.0"
}
```

Add their TypeScript declarations as development dependencies:

```json
{
  "@types/d3-scale": "4.0.9",
  "@types/d3-shape": "3.1.8"
}
```

Do not install the full `d3` package, `d3-axis`, or `d3-zoom`. D3 scale provides
linear, UTC time, band, tick, and `nice` calculations. D3 shape provides line
and area generators and can make an SVG path string. Skia accepts SVG path
notation and Skia path objects. This is enough for the first time-series and
category bar charts. [D3 scale documentation](https://d3js.org/d3-scale)
[D3 line documentation](https://d3js.org/d3-shape/line)
[Skia path documentation](https://shopify.github.io/react-native-skia/docs/shapes/path/)

Use `scaleUtc`, not local-time `scaleTime`, for a Sort of Budget transaction date.
Parse a `YYYY-MM-DD` value with `Date.UTC` and format it with an explicit UTC
time zone. This keeps a transaction date on the same calendar day when the
device time zone changes. [D3 UTC scale
documentation](https://d3js.org/d3-scale/time#scaleUtc)

This change does not mean that each report screen gets a low-level Skia or D3
interface. It means that one Sort of Budget chart module owns those low-level tools.
That module can change any drawing or interaction without asking a third-party
chart library to expose another prop.

### Dependency delta

Victory Native `41.26.0` has five runtime dependencies: `d3-scale`,
`d3-shape`, `d3-zoom`, `its-fine`, and `react-fast-compare`. Its Skia,
Gesture Handler, and Reanimated dependencies are peers that Sort of Budget already
owns. [Victory Native package
metadata](https://github.com/FormidableLabs/victory-native-xl/blob/main/lib/package.json)

The direct stack keeps `d3-scale` and `d3-shape`. Their runtime dependency tree
contains `d3-array`, `d3-format`, `d3-interpolate`, `d3-time`,
`d3-time-format`, `d3-color`, `d3-path`, and `internmap`. These are in-process
JavaScript dependencies. `d3-scale` declares five of them and `d3-shape`
declares `d3-path`. [D3 scale package
metadata](https://github.com/d3/d3-scale/blob/main/package.json)
[D3 shape package
metadata](https://github.com/d3/d3-shape/blob/main/package.json)

Removing Victory also removes `d3-zoom`, `its-fine`, and
`react-fast-compare`. The `d3-zoom` branch also brings DOM-selection and
transition packages such as `d3-selection`, `d3-drag`, `d3-transition`,
`d3-dispatch`, `d3-ease`, and `d3-timer`. The zoom behavior is normally
attached through a D3 selection and binds event listeners with
`selection.on`. Sort of Budget already has a native gesture system, so this branch
does not add useful leverage. [D3 zoom documentation](https://d3js.org/d3-zoom)
[D3 zoom package metadata](https://github.com/d3/d3-zoom/blob/main/package.json)

The direct TypeScript imports need `@types/d3-scale` and
`@types/d3-shape`, because the D3 packages publish JavaScript without their own
declaration files. The declaration packages also bring `@types/d3-time` and
`@types/d3-path`. [D3 scale declarations](https://www.npmjs.com/package/@types/d3-scale)
[D3 shape declarations](https://www.npmjs.com/package/@types/d3-shape)

Skia, Reanimated, Gesture Handler, and Worklets stay at their current versions.
D3 is JavaScript-only. Replacing Victory with these D3 modules does not require
a new native development client, but it still requires a frozen install,
TypeScript check, Expo dependency check, and iOS bundle check.

### Deep module and seam

Put the external seam at `packages/mobile/src/charts/index.ts`. Export one
runtime entry point and its model types:

```ts
import {
  FinancialChart,
  type FinancialChartModel,
} from "~/charts";
```

`FinancialChart` is a deep module. Its small interface hides scales, axis
layout, label collision, paths, bars, grid lines, legend layout, gestures,
selection, zoom state, animation, data states, value formatting, and the
accessible data list. Do not export scales, chart bounds, tick objects, Skia
paths, gesture state, render props, or theme props.

The proposed interface is:

```ts
type ChartValueFormat =
  | { kind: "money"; currency: string; locale: string }
  | { kind: "percent"; locale: string; maximumFractionDigits: number }
  | { kind: "number"; locale: string; maximumFractionDigits: number };

type TimeSeriesData = {
  kind: "time-series";
  interaction?: "inspect" | "inspect-zoom";
  series: readonly {
    id: string;
    label: string;
  }[];
  points: readonly {
    date: string; // YYYY-MM-DD transaction date
    values: Readonly<Record<string, number | null>>;
  }[];
};

type CategoryBarData = {
  kind: "category-bars";
  items: readonly {
    id: string;
    label: string;
    value: number | null;
  }[];
};

type FinancialChartModel = {
  title: string;
  summary: string;
} & (
  | { state: "loading"; label: string }
  | { state: "empty"; message: string }
  | {
      state: "error";
      message: string;
      retry?: { label: string; onPress: () => void };
    }
  | {
      state: "ready";
      valueFormat: ChartValueFormat;
      data: TimeSeriesData | CategoryBarData;
    }
);

type FinancialChartProps = {
  model: FinancialChartModel;
};

export function FinancialChart(props: FinancialChartProps): React.ReactElement;
```

Example use:

```tsx
<FinancialChart
  model={{
    state: "ready",
    title: "Net worth",
    summary: "Net worth increased by PLN 12,400 from January to June.",
    valueFormat: { kind: "money", currency: "PLN", locale: "en-PL" },
    data: {
      kind: "time-series",
      interaction: "inspect-zoom",
      series: [{ id: "net-worth", label: "Net worth" }],
      points: netWorthByTransactionDate,
    },
  }}
/>
```

The report query owns financial aggregation and the wording of `summary`. The
chart module only presents an already-derived answer. It does not recalculate
net worth, available money, a Reserve, or free balance. This keeps the chart
away from source records and prevents a second financial calculation path.

Do not add a generic `style`, `renderAxis`, `renderTooltip`, `children`, or
`components` prop. When Sort of Budget needs a new chart form, add a new data
discriminant and implement it inside this module. Direct Skia gives the
implementation freedom; callers do not need that complexity.

### Hidden implementation

Keep these implementation areas private under `packages/mobile/src/charts/`:

- Model validation and normalization. It checks all invariants before drawing.
- Scene layout. It reserves native-text space, calculates a plot rectangle,
  and lowers tick density when Dynamic Type needs more room.
- D3 geometry. It uses `scaleUtc` for a transaction date, `scaleLinear` for
  values, and `scaleBand` for a Category. It uses D3 line generation with
  `defined` so `null` creates a visible gap instead of a false zero. D3 states
  that `defined` ends the current line segment. [D3 line `defined`
  documentation](https://d3js.org/d3-shape/line#line_defined)
- Skia drawing. It memoizes paths and rectangles, clips all marks to the plot
  rectangle, and draws grid lines, a zero line, marks, selection, and tooltip
  guides.
- Native text overlay. It draws axis labels and the legend with React Native
  `Text`, not canvas text. This keeps Dynamic Type and text layout in the
  native system. Decorative tick labels are not accessibility focus targets.
- Interaction. It keeps live selection and viewport transforms in Reanimated
  shared values. It commits a zoomed viewport to JavaScript only at gesture
  end, then recalculates scales and axes. It does not rebuild a D3 path on each
  gesture frame.
- Accessibility. It owns the summary, inspection controls, and complete value
  list, so a report screen cannot forget them.
- Theme. It assigns semantic colors, dash patterns, marker shapes, spacing,
  and typography from Sort of Budget design tokens. A caller supplies labels, not
  raw colors.

The external seam has one implementation on iOS and Android. Do not add a
renderer adapter only for a possible web future. First test the same module
with Skia CanvasKit. Add an adapter at this seam only if a second, real web
implementation is required.

### Axes and legends

The module owns these rules:

- A Category bar scale always includes a zero baseline. Positive and negative
  bars extend from zero in opposite directions.
- A time-series line uses its finite data extent with stable padding and
  `nice` ticks. It does not silently replace a missing value with zero. If all
  values are equal, it expands the domain by a deterministic small amount.
- Axis tick count comes from plot width, plot height, and the current font
  scale. The module removes colliding labels. It does not shrink the user's
  text size to fit more ticks.
- Visual axis labels can use compact formatting. The summary, tooltip, and
  data list use the full formatted value.
- A single time series has no legend. Two or more series get a native legend
  in the same order as the input series. Each series differs by color and by
  dash or marker shape. Color is never the only distinction.
- The first implementation supports up to four simultaneous time series. More
  series produce a visible invalid-data state. This is a readability limit,
  not a D3 limit, and can change after a concrete report design.

### Gestures and viewport

Use Gesture Handler and Reanimated, not `d3-zoom`:

- A tap selects the nearest time point or Category bar.
- A one-finger horizontal drag inspects adjacent time points. The gesture uses
  a horizontal activation threshold and fails on a vertical move, so the
  parent screen can still scroll.
- `inspect-zoom` also enables pinch zoom and a two-finger horizontal pan. The
  module clamps the viewport to the data domain and shows a native `Reset
  zoom` button after the viewport changes.
- A Category bar chart does not pan or zoom in the first implementation. A
  report must rank or group its Category values before it calls the chart.
- Gesture work runs on the UI thread. Geometry is stable during the gesture;
  the implementation applies a clipped transform, then makes one geometry
  update when the gesture ends.

Skia documents the use of Gesture Handler around a canvas and the use of
native overlay views to track canvas elements. [Skia gesture
documentation](https://shopify.github.io/react-native-skia/docs/animations/gestures/)

### Data states and errors

`loading`, `empty`, `error`, and `ready` are part of the interface, not four
different wrappers in report screens.

- `loading` shows a fixed placeholder and the supplied label. It does not show
  old values as if they were current.
- `empty` shows the supplied reason and no axes.
- `error` shows the supplied reason and an optional native retry button.
- `ready` validates the complete model before it draws anything.

Invalid ready data does not crash the report and does not render a partial
chart. Production shows one localized invalid-data message. Development also
logs the chart kind and failed invariant, but never logs financial values,
labels, Book IDs, Account IDs, or Category IDs.

The ready-state invariants are:

- Every numeric value is finite. `NaN` and positive or negative infinity are
  invalid.
- `null` is the only missing-value marker. Missing properties are invalid.
- A time series has one to four unique series IDs and at least one point.
- Each point has exactly one value for each declared series.
- Transaction dates use exact `YYYY-MM-DD` form, are unique, and are strictly
  ascending. The module does not silently sort or merge them.
- Category IDs are unique and labels are not empty.
- One chart has one value format and, for money, one currency. Currency
  conversion happens before this seam and remains auditable in the report
  query.
- Values are presentation inputs only. The chart never writes rounded or
  selected values back into a Book.

### Accessibility and reduced motion

The module always renders these native elements with a ready chart:

1. The title and concise `summary` before the canvas.
2. A focusable inspection control with `adjustable` semantics and previous and
   next accessibility actions for a time series.
3. Visible previous and next buttons when a point is selected.
4. A `View chart data` disclosure after the canvas. It opens a native list with
   every transaction date or Category and every full formatted value.

The canvas and decorative axis labels are hidden from the accessibility tree
to avoid duplicate speech. The native inspection control speaks the selected
date, series label, exact value, and missing state. The complete data list is
the non-gesture path to the same answer. React Native supports accessible
labels, text accessibility values, and accessibility actions. Skia supports
View accessibility properties and native overlays. [React Native
accessibility](https://reactnative.dev/docs/accessibility)
[Skia canvas accessibility](https://shopify.github.io/react-native-skia/docs/canvas/overview/#accessibility)

There is no decorative entrance animation by default. Selection and viewport
settling can use Reanimated with `ReduceMotion.System`. When Reduce Motion is
active, the module applies the final state immediately and keeps all gestures
and controls usable. Reanimated states that `withTiming` and `withSpring`
return the target immediately under reduced motion. [Reanimated reduced-motion
documentation](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/)

### Verification through the interface

Treat `FinancialChart` as the test surface. Do not export test-only scales or
geometry builders.

- Render each data state and assert its native semantic output.
- Render fixed-size time-series and Category models to headless Skia golden
  images in light and dark appearance.
- Verify null gaps, negative bars, all-zero data, one point, one Category,
  duplicate dates, missing series values, and invalid numbers.
- Run date tests under distant device time zones and verify that a transaction
  date does not move.
- Test large Dynamic Type, long translated labels, right-to-left layout,
  Reduce Motion, and the complete VoiceOver path.
- Test tap, scrub, pinch, two-finger pan, scroll conflict, and reset on the iOS
  simulator and one real device.
- Measure the first target workload of 366 daily points across four series and
  50 Category bars. Do not add silent sampling. If a later measured workload
  needs sampling, specify how peaks, gaps, and exact values remain available.

### Trade-off

This stack exchanges a third-party chart interface for owned implementation
work. Sort of Budget must maintain axis layout, interaction, accessible output,
golden tests, and platform checks. In return, the module can implement any
Sort of Budget–specific visual or interaction without waiting for Victory Native or
passing library details through every report screen.

The deletion test supports this module: if it is deleted, scale rules, axes,
gestures, legends, states, accessibility, and verification spread across every
report. Keeping those rules behind one entry point gives callers leverage and
keeps chart knowledge local.
