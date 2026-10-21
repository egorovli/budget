# iOS 26 Liquid Glass in Expo and React Native

> Note (2026-10-21): the Expo app at `packages/mobile` that this research inspected was deleted. File references below describe the old prototype.

Research date: 2026-08-15

## Question

How should Budgetly adopt native iOS 26 Liquid Glass while it keeps correct
behavior on iOS 16.4 through 25, Android, and web?

## Recommendation

Use system components first. Budgetly already uses the native Expo Router
`Stack` and `NativeTabs`. When the app is built with Xcode 26 and runs on iOS
26, these components get the system Liquid Glass design. Do not recreate their
glass backgrounds.

Adopt in this order:

1. Validate the current native `Stack` and `NativeTabs` on iOS 26.
2. Add `Stack.Toolbar` for a small number of navigation-layer actions.
3. Test one primary `Record transaction` control with a native glass button.
4. Use `expo-glass-effect` only for a custom control that cannot use a system
   button or toolbar.
5. Do not use Liquid Glass for report cards, metric cards, list rows, forms, or
   other content surfaces.

Keep the iOS deployment target at the Expo SDK 57 default of iOS 16.4. Do not
raise it to iOS 26. Runtime and compiler availability checks already provide
the correct fallback. A target of iOS 26 would remove the fallback devices
that this design must support.

No package install is necessary.

## Current Budgetly state

The inspected repository has:

| Item | Installed or configured value | Meaning |
| --- | --- | --- |
| Expo | `57.0.13` | SDK 57 supports iOS 16.4 and later and requires Xcode 26.4 or later. |
| Expo Router | `57.0.13` | Native stack, native tabs, form sheets, and `Stack.Toolbar` are available. |
| `expo-glass-effect` | `57.0.1` | This is the SDK 57 recommended version. |
| `@expo/ui` | `57.0.11` | SwiftUI and universal native controls are installed. |
| React Native | `0.86.2` | `AccessibilityInfo` has the required transparency and motion queries. |
| `react-native-screens` | `4.26.2` | It supplies the native navigation views used by Expo Router. |
| Xcode | `26.6` | It is new enough to compile the iOS 26 APIs. |
| Navigation | Native `Stack` and alpha `NativeTabs` | The main navigation layer can adopt system glass without custom drawing. |
| App style | `userInterfaceStyle: "automatic"` | Light and dark system appearances are enabled. |

These values come from
`packages/mobile/package.json`,
`packages/mobile/app.json`, and the installed
toolchain. Expo's current SDK table confirms that SDK 57 uses React Native 0.86,
supports iOS 16.4 and later, and requires Xcode 26.4 or later.
[Expo SDK version table](https://docs.expo.dev/versions/latest/)

Budgetly has no custom `GlassView`, `@expo/ui`, or `Stack.Toolbar` use yet. Its
four Book tabs already use `expo-router/unstable-native-tabs`.
`BookTabsLayout`

## What the system gives Budgetly

Apple says that standard SwiftUI and UIKit components get the new design when
an app uses the current SDK. This includes navigation bars, tab bars, toolbars,
sheets, menus, alerts, buttons, sliders, toggles, and segmented controls.
Navigation and controls form a functional layer above content. Apple says not
to put Liquid Glass in the content layer and to use custom glass sparingly.
[Apple: Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
[Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

This rule is a good match for Budgetly:

- tabs, navigation bars, toolbars, and important controls can use glass;
- Book balances, reports, transactions, Reserves, Accounts, forms, and list
  rows remain normal content;
- standard material, solid semantic colors, or the existing card style remain
  the fallback for content surfaces.

Do not set `UIDesignRequiresCompatibility` to `true`. That key turns off the
iOS 26 navigation-header design for a development build, does not work in Expo
Go, and is only a temporary option. Expo says Apple removes this option in iOS
27. [Expo Router: iOS 26 Liquid Glass headers](https://docs.expo.dev/router/advanced/stack/#ios-26-liquid-glass-headers)

## API matrix

| Need | Preferred API | iOS 26 result | Earlier iOS | Android and web |
| --- | --- | --- | --- | --- |
| Navigation header and back button | Expo Router native `Stack` | System Liquid Glass automatically | Native earlier design | Native Android header; web header implementation |
| Main Book tabs | `NativeTabs` | System floating tab bar; optional minimize and search roles | Native earlier tab design | Native Android tabs; basic web fallback |
| Header or bottom actions | `Stack.Toolbar` | Native glass grouping and controls | Native earlier toolbar design where supported | Android toolbar with documented differences; no web toolbar |
| Modal flow | Expo Router `presentation: 'modal'` or `'formSheet'` | System sheet material and transitions | Native earlier presentation | Android bottom-sheet rules; web route or alpha web modal |
| Cross-platform control | Universal `@expo/ui` component | Native SwiftUI control | Native SwiftUI control | Jetpack Compose on Android and a web implementation |
| iOS-specific glass button or menu | `@expo/ui/swift-ui` plus `buttonStyle('glass')` or `'glassProminent'` | Native SwiftUI glass button | Falls back to the automatic SwiftUI button style | Do not import this iOS-only entry point in shared platform code |
| Custom RN glass control surface | `GlassView` from `expo-glass-effect` | Native `UIVisualEffectView` with `UIGlassEffect` | Plain React Native `View` | Plain React Native `View` |
| Related custom glass surfaces | `GlassContainer` | Shared sampling, blending, and morphing | Plain container | Plain React Native `View` |

### Native tabs

`NativeTabs` uses the native system tab bar. Its API is still alpha and can
change. iOS 26 features require an Xcode 26 build. The available features
include a separate search tab, a search field in the tab bar,
`minimizeBehavior`, and a bottom accessory. Liquid Glass changes foreground
colors from the content below it, so custom tab colors must use
`PlatformColor` or `DynamicColorIOS` rather than a fixed color.
[Expo Router: Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)

On iOS, the first scroll view in a native-tab screen receives automatic content
insets. Keep a `ScrollView` as the first child, or use a non-collapsible wrapper.
Do not add a second manual bottom inset without measuring it. On web,
`NativeTabs` has only a basic fallback. Expo recommends a `_layout.web.tsx` or a
platform-specific tabs component with headless `expo-router/ui` tabs when the
web layout needs production styling.
[Expo Router: Native-tabs web and inset behavior](https://docs.expo.dev/router/advanced/native-tabs/#custom-web-layout)

Budgetly must also add a root Expo Router `ThemeProvider` before it relies on
glass headers or toolbars. Expo documents white flashes and dark-mode glass
flicker when the navigation theme does not match the system color scheme.
[Expo Router: native-tabs common problems](https://docs.expo.dev/router/advanced/native-tabs/#common-problems)

### Navigation bars and toolbars

Use `Stack.Toolbar.Button`, `Stack.Toolbar.Menu`, `Stack.Toolbar.MenuAction`,
`Stack.Toolbar.Spacer`, and `Stack.Toolbar.SearchBarSlot`. Use SF Symbols on iOS
and keep an accessibility label for every icon-only action. `Stack.Toolbar`
renders only on Android and iOS, so a web action needs its own normal component.
Bottom toolbars can only be declared in page components, not layout files.
[Expo Router: Stack Toolbar](https://docs.expo.dev/router/advanced/stack-toolbar/)

The installed SDK 57 types also expose these iOS 26 options:

- `separateBackground` and `hidesSharedBackground` control toolbar grouping;
- `variant: 'prominent'` emphasizes an important toolbar action;
- `scrollEdgeEffects` can be `automatic`, `hard`, `soft`, or `hidden` for each
  edge.

Treat these as a narrow navigation API. Do not combine `headerBlurEffect` with
iOS 26 `scrollEdgeEffects`; Expo warns that the effects can overlap.
[Expo Router API: `scrollEdgeEffects`](https://docs.expo.dev/versions/latest/sdk/router/#nativestacknavigationoptions)

### Sheets

Use Expo Router modal routes for navigable workflows. `presentation:
'formSheet'` supports allowed detents, an initial detent, a grabber, corner
radius, expansion on scroll, and the largest undimmed detent. Let the system
draw the sheet background. Apple specifically recommends removing custom sheet
backgrounds when they hide the new system material.
[Expo Router: Modals and form sheets](https://docs.expo.dev/router/advanced/modals/)
[Apple: Build a SwiftUI app with the new design](https://developer.apple.com/videos/play/wwdc2025/323/)

Android form sheets and web modals have different constraints. A sheet is a
navigation and interaction pattern, not a promise that all platforms show
glass.

## `expo-glass-effect`

`expo-glass-effect` is the best fit when a custom glass surface must stay in an
existing React Native view tree. SDK 57 exports:

```ts
import {
	GlassContainer,
	GlassView,
	isGlassEffectAPIAvailable,
	isLiquidGlassAvailable
} from 'expo-glass-effect'
```

`GlassView` supports:

- `glassEffectStyle: 'regular' | 'clear' | 'none'`;
- an animated style object with `animate` and `animationDuration`;
- `tintColor`;
- `isInteractive`, which defaults to `false`;
- `colorScheme: 'auto' | 'light' | 'dark'`;
- normal React Native `ViewProps`, including border radius styles.

`GlassContainer` accepts normal `ViewProps` and `spacing`. Spacing controls the
distance at which nearby glass shapes start to merge. Apple says one container
also improves rendering performance and gives nearby effects one shared
sampling region.
[Expo SDK 57: GlassEffect](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/)
[Apple: GlassEffectContainer](https://developer.apple.com/documentation/swiftui/glasseffectcontainer)

Use both checks before a custom view:

```ts
const canRenderGlass =
	isLiquidGlassAvailable() && isGlassEffectAPIAvailable()
```

The first check covers the compiler, operating system, and compatibility
setting. The second check exists because early iOS 26 runtimes did not always
contain the API and could crash. The functions return `false` on unsupported
platforms. Still give the fallback branch a semantic solid or standard-material
background because the library's unsupported implementation is only a plain
`View`.

Known constraints:

- `opacity: 0` on `GlassView` or any parent stops the glass from rendering;
  animate `glassEffectStyle` to `'none'` instead;
- use `isInteractive` only for a control that the user can operate;
- use `regular` by default; use `clear` only over media-rich content with
  verified contrast;
- use tint only to communicate a primary action or status;
- do not mix many unrelated tinted glass surfaces;
- do not put independent nearby glass views in different containers.

## SwiftUI through `@expo/ui`

`@expo/ui/swift-ui` renders true SwiftUI components inside a React Native
`Host`. SDK 57 provides `Button`, `Menu`, `ControlGroup`, `GlassEffectContainer`,
`Namespace`, and other controls. The glass modifiers are:

- `buttonStyle('glass')` and `buttonStyle('glassProminent')`;
- `glassEffect({ glass: { variant, interactive, tint }, shape, cornerRadius })`;
- `glassEffectId(id, namespaceId)` inside `Namespace`;
- `GlassEffectContainer` with `spacing`.

Glass button styles need Xcode 26 and iOS 26. Below iOS 26, the installed native
implementation uses the automatic SwiftUI button style. The glass effect and
container keep their content but omit the effect. This is a safe visual
fallback, but it still needs contrast tests.
[Expo SDK 57: SwiftUI Button](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/button/)
[Expo UI: SwiftUI modifiers](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/modifiers/)
[Expo UI: Namespace](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/namespace/)

Use `buttonStyle` for a `Menu` trigger. Expo warns that applying `glassEffect`
to the menu label can show a rectangular halo during dismissal.
[Expo UI: Menu](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/menu/)

The universal `@expo/ui` entry point is cross-platform. Its components delegate
to SwiftUI on iOS, Jetpack Compose on Android, and web implementations. Use it
for a shared native control tree. Use the SwiftUI entry point only when the
required control or modifier is iOS-specific.
[Expo UI: Universal components](https://docs.expo.dev/versions/latest/sdk/ui/universal/)

Keep an iOS-specific SwiftUI component behind a stable platform module, for
example `record-transaction-action.ios.tsx` plus
`record-transaction-action.tsx`. The Expo Router route imports the stable
component. This prevents an iOS-only native view from entering Android or web
code. [Expo Router: platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)

The installed `@expo/ui` version does not expose Apple's
`glassEffectUnion` or `glassEffectTransition`. It does expose
`GlassEffectContainer`, `Namespace`, and `glassEffectId` for the supported morph
case. Do not design a transition that needs an API that the installed bridge
does not provide.

## Accessibility

System components automatically adapt to Reduce Transparency, Increase
Contrast, and Reduce Motion. Apple says to test all of these settings because
they can remove or change translucency and morphing. Custom colors and custom
animations still need explicit tests.
[Apple: Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)

React Native 0.86 provides:

- `AccessibilityInfo.isReduceTransparencyEnabled()` on iOS;
- the `reduceTransparencyChanged` event;
- `AccessibilityInfo.isReduceMotionEnabled()` and its change event;
- `isDarkerSystemColorsEnabled()` for the iOS contrast preference.

`isLiquidGlassAvailable()` can remain `true` when Reduce Transparency is on.
Do not treat that as an error. Let the system make native glass more opaque.
Use the accessibility queries for diagnostics and for any custom animation or
non-system fallback logic.
[React Native: AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)

Every icon-only tab or toolbar action needs an accessible name. Keep visible or
VoiceOver-only text labels for financial actions. Glass must never be the only
signal for selected, destructive, pending, or disabled state.

## Expo Go and local development builds

The SDK 57 documentation marks both `expo-glass-effect` and `@expo/ui` as
included in Expo Go. Expo Go is sufficient for a quick component experiment
when its binary supports the same SDK and was built with Xcode 26.

Use Budgetly's local development build for the proof and all acceptance tests:

```sh
cd packages/mobile
bun run ios
```

Then use `bun run start` for TypeScript-only iterations. A rebuild is needed
after a native dependency, app configuration, or Expo SDK change. It is not
needed for ordinary component code. Budgetly already has `expo-dev-client` and
the correct scripts. Expo recommends a development build for a production app
because it includes the project's exact native code and configuration.
[Expo: Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/)
[Expo: Use a development build](https://docs.expo.dev/develop/development-builds/use-development-builds/)

Expo Go cannot validate Budgetly's final binary, deployment target, app
configuration, or exact native navigation integration. Also, the App Store
Expo Go binary can support a different SDK from the project. Therefore it is
not a release gate.

## Proposed proof of concept

Keep the proof small and reversible.

### Step 1: system navigation baseline

- Add the Expo Router `ThemeProvider` at the root.
- Add SF Symbol and Android icons to the four existing `NativeTabs` triggers.
- Do not set a custom tab background or blur.
- Test scroll-under behavior, light and dark mode, tab selection, and the
  transparent scroll edge.

This step tests the highest-value glass surface with no custom glass API.

### Step 2: one primary action

On the Book Home screen, test `Record transaction` as one native action. First
try `Stack.Toolbar.Button` with a clear accessibility label. If a content-layer
button is better for the workflow, compare these two isolated implementations:

- iOS: a SwiftUI `Button` with `buttonStyle('glassProminent')`;
- Android and web: the existing semantic `ActionLink` appearance.

Do not convert the shared `ActionLink` component in this proof. That change
would apply glass to many content actions and make the result hard to evaluate.

### Step 3: custom-surface experiment only if needed

If neither system option fits, test one `GlassView` wrapper with an explicit
solid fallback. Gate it with both availability functions. Do not add a custom
container until the design has two or more nearby glass controls.

### Test matrix

| Platform or setting | Required check |
| --- | --- |
| iOS 26, light and dark | Tab/header contrast, scrolling, toolbar grouping, primary action |
| iOS 16.4 or 18 | No missing background, clipped control, or transparent tab regression |
| Android | Normal native/material action and correct tab behavior |
| Web | Existing 80-percent workflow stays styled and usable; no iOS-only import |
| Reduce Transparency | Text and icons stay readable; system fallback is accepted |
| Increase Contrast / darker system colors | Borders, labels, focus, and selected state remain clear |
| Reduce Motion | No required meaning depends on morphing or shimmer |
| Large text and VoiceOver | Labels, hit targets, order, and destructive state are correct |

## Risk-ranked adoption path

1. **Low risk — system `Stack`, `NativeTabs`, and sheets.** These are the
   platform defaults, adapt to accessibility settings, and have normal earlier
   OS behavior.
2. **Low to medium risk — `Stack.Toolbar`.** It is native and appropriate, but
   has platform differences and no web rendering. Keep actions available in
   web content.
3. **Medium risk — one SwiftUI glass button.** The fallback is safe, but the
   SwiftUI subtree adds a second layout system and needs a platform adapter.
4. **Medium to high risk — `expo-glass-effect`.** It gives precise RN layout
   control, but Budgetly owns the fallback, contrast, interaction, grouping,
   and animation behavior.
5. **High risk — broad custom glass design or an iOS-26 deployment target.** It
   conflicts with Apple's content-layer guidance, expands the test surface,
   and can remove support for valid Budgetly devices. Do not adopt it.

The practical release gate is an iOS 26 local build plus an earlier-iOS build,
Android, and web. A screenshot from one iOS 26 simulator is not enough.

## CBT Quest comparison

The read-only comparison project uses the same SDK generation. Its useful
patterns are native `Stack.Toolbar`, SF Symbols, accessibility labels,
`SearchBarSlot`, `separateBackground`, and an explicit non-native fallback for
a bottom toolbar. It uses `expo-glass-effect` only in diagnostics and has a
mock and availability probe.

CBT Quest also sets `deploymentTarget: '26.0'`. Do not copy that setting into
Budgetly. Budgetly needs iOS 16.4 and later support, and both Expo glass
packages use availability guards. The comparison is evidence for keeping the
glass seam small, not evidence for raising the operating-system minimum.
