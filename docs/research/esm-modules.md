# ECMAScript module conventions

Research date: 2026-08-15

## Question

How should Sort of Budget use ECMAScript modules (ESM) across its Bun monorepo and
its Expo/React Native application? This includes package module markers,
TypeScript module settings, import file extensions, package entry points, JSON,
CommonJS (CJS) interoperation, and Expo Router files.

## Recommendation

Use ESM syntax for application and library code, but apply the rules of the
module host that runs each package. Do not apply Node.js output rules directly
to source files that Metro bundles.

For the current Expo application:

- keep `module: "preserve"`, `moduleResolution: "bundler"`, `noEmit: true`,
  `verbatimModuleSyntax: true`, and `allowImportingTsExtensions: true`;
- use explicit source extensions for ordinary internal imports: `.ts` and
  `.tsx`;
- do not use `.js` in an import when the file on disk is `.ts` or `.tsx`;
- do not use directory imports; name `index.ts` or `index.tsx` explicitly;
- keep an extensionless import only when Metro must select a platform file such
  as `.ios.ts`, `.native.ts`, or `.web.ts`;
- keep package specifiers exactly as the package exports them;
- keep route URLs free of source file extensions.

For a future package that emits JavaScript for Node.js or external consumers,
use `type: "module"`, a Node module mode such as `nodenext`, emitted `.js`
targets, and an explicit `exports` map. That is a different compilation unit
and needs its own `tsconfig.json`.

This is a host-correct ESM design. It is more reliable than one visual import
style that only works in one runtime.

## Current repository

The checked versions are:

- Bun 1.3.14;
- TypeScript 7.0.2;
- Expo CLI 57.0.12 and Expo SDK 57;
- Metro and `metro-resolver` 0.84.4.

The root `package.json` already has `type: "module"`. The root TypeScript
configuration already matches Bun's and Expo's current bundler model:

```json
{
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  }
}
```

Bun recommends this `module: "Preserve"` plus `moduleResolution: "bundler"`
combination when it runs TypeScript source. Expo's SDK 57 base configuration
uses the same module and resolution modes. [Bun: TypeScript](https://bun.sh/docs/runtime/typescript)
[Expo SDK 57 `tsconfig.base.json`](https://github.com/expo/expo/blob/sdk-57/packages/expo/tsconfig.base.json)

The mobile package is an application consumed by Metro. It is not a Node.js
library and it emits no JavaScript with `tsc`. TypeScript's current application
guide recommends that bundler applications do not add `type: "module"` only to
label source files, because `moduleResolution: "bundler"` cannot check all
ESM/CJS interoperation changes that some bundlers make from that marker.
[TypeScript: choosing compiler options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options)

Therefore:

- keep the root `type: "module"` marker for root ESM JavaScript and Bun tools;
- do not add `type: "module"` to `packages/mobile/package.json` as part of this
  migration;
- keep the Babel configuration as a deliberate CJS tool boundary and name it
  `babel.config.cjs` so its module format is explicit.

Node.js applies `type` from the nearest parent `package.json`. A nested package
is its own package scope. `.mjs` is always ESM and `.cjs` is always CJS,
regardless of `type`. [Node.js: package module type](https://nodejs.org/api/packages.html#determining-module-system)

## Import specifier rules

### Ordinary application source

Use the exact source extension:

```ts
import './theme/index.ts'
import { PrototypeScreen } from '~/components/prototype-ui.tsx'
import { sampleBookId } from '~/screens/prototype-routes.ts'
```

Do not write these forms:

```ts
import './theme' // directory and implicit index
import './theme/index' // implicit source extension
import './theme/index.js' // no matching JavaScript source file for Metro
```

`allowImportingTsExtensions` is correct because this compilation uses
`noEmit`. TypeScript documents this option for code that a bundler or a
TypeScript runtime consumes directly. [TypeScript: module resolution for
bundlers and TypeScript runtimes](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution-for-bundlers-typescript-runtimes-and-nodejs-loaders)

Bun accepts extensionless imports, `.ts` imports, and even maps a `.js`
specifier to a matching `.ts` source file. Metro does not have that last Bun
rule. Metro first checks an exact path and then appends each configured source
extension. Thus `./item.js` does not mean `./item.ts` in this Expo application.
[Bun: module resolution](https://bun.sh/docs/runtime/module-resolution)
[Metro: module resolution](https://metrobundler.dev/docs/resolution/)

This difference is why Sort of Budget must use source extensions in Metro source. A
Node-oriented `.js`-in-TypeScript convention is only correct for a compilation
that emits a parallel `.js` file tree.

### Platform-specific modules

Use an extensionless stable basename when Metro must select a platform:

```ts
import { createBookStore } from './book-store'
```

For example, Metro can select from:

```text
book-store.ios.ts
book-store.android.ts
book-store.web.ts
book-store.ts
```

An explicit `./book-store.ts` import disables this selection. This is an
intentional Metro import, not a portable Node.js ESM import. Keep the exception
small and visible. Metro documents its platform and `sourceExts` selection in
its resolution algorithm. [Metro: source file resolution](https://metrobundler.dev/docs/resolution/#resolve_file)

### Package imports

Use the public specifier exactly as the package defines it:

```ts
import { Stack } from 'expo-router'
import 'expo-router/entry'
import { scaleLinear } from 'd3-scale'
```

Do not add a guessed file extension to a bare package specifier. When a package
has an `exports` map, only the public keys in that map are part of its contract.
Node.js also states that a package author must choose one consistent extensioned
or extensionless form for each exported subpath. [Node.js: package entry
points](https://nodejs.org/api/packages.html#package-entry-points)
[Node.js: extensions in package subpaths](https://nodejs.org/api/packages.html#extensions-in-subpaths)

The existing `~/*` path alias is an Expo/Metro alias, not a native ESM package
specifier. Keep it for application code because Expo supports TypeScript path
aliases on native and Metro web. Include the actual source extension at the end
of an alias import unless the import is the platform-selection exception.
[Expo: TypeScript path aliases](https://docs.expo.dev/guides/typescript/#path-aliases-optional)

Do not replace `~/*` only to make the imports look more standard. Node.js, Bun,
and TypeScript support package-private `#` mappings. The installed Metro 0.84.4
resolver also has a package-imports implementation, although the public Metro
resolution page has not yet been updated to describe it. Expo documents
TypeScript path aliases, not package imports, as its application alias
interface. A `#app/*` migration therefore needs a focused native and web proof;
it is not a safe mechanical cleanup. [Node.js: subpath imports](https://nodejs.org/api/packages.html#subpath-imports)
[Bun: path remapping](https://bun.sh/docs/runtime/module-resolution#path-re-mapping)
[Metro 0.84.4: package imports resolver](https://github.com/react/metro/blob/v0.84.4/packages/metro-resolver/src/PackageImportsResolve.js)

### Type-only imports

Use `import type` or an inline `type` modifier whenever an imported name has no
runtime value:

```ts
import type { BookId } from '~/domain/book.ts'
import { createBook, type Book } from '~/domain/book.ts'
```

`verbatimModuleSyntax` preserves value imports and removes explicit type-only
imports predictably. It also matches Node.js type stripping if a non-TSX Bun
tool is later checked with Node. [TypeScript: `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html)
[Node.js: importing types](https://nodejs.org/api/typescript.html#importing-types-without-type-keyword)

## Why Node.js uses `.js` in emitting TypeScript packages

Native Node.js ESM requires a file extension for every relative or absolute
specifier. It also requires an explicit path to a directory index:

```ts
// Source file in a package that emits dist/math.js:
import { add } from './math.js'
import { start } from './startup/index.js'
```

TypeScript resolves these output-relative specifiers back to `math.ts` and
`startup/index.ts` while checking the source. It leaves the specifiers valid in
the emitted JavaScript. [Node.js: mandatory file extensions](https://nodejs.org/api/esm.html#mandatory-file-extensions)
[TypeScript: output-relative specifiers](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution)

This repository's mobile app does not emit such a tree. Metro consumes `.ts`
and `.tsx` directly, so `.js` would point at a file that does not exist.

If a future Sort of Budget package emits JavaScript, give it a separate configuration:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "verbatimModuleSyntax": true,
    "declaration": true,
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

Then use one of these two consistent policies inside that package:

1. Write output-relative `.js` specifiers in `.ts` source. This is the most
   portable and least surprising library policy.
2. Write `.ts` specifiers and enable `rewriteRelativeImportExtensions` for the
   emitting compilation. TypeScript rewrites only relative TypeScript
   extensions. It does not make `paths` aliases into runtime imports.

[TypeScript: compiling for Node.js](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options#im-compiling-and-running-the-outputs-in-nodejs)
[TypeScript: `rewriteRelativeImportExtensions`](https://www.typescriptlang.org/tsconfig/rewriteRelativeImportExtensions.html)
[TypeScript: `paths` does not change emit](https://www.typescriptlang.org/tsconfig/paths.html)

Do not use `rewriteRelativeImportExtensions` in the current mobile
configuration. It has `noEmit`, so there is no output to rewrite.

## Package `exports` and `imports`

Do not add an `exports` map to `@budget/mobile`. It is an application entry,
not an imported library. Keep its `main` entry for Expo and make its local path
exact:

```json
{
  "main": "./src/index.ts"
}
```

When Sort of Budget adds a real shared workspace package, expose a small public
surface. Prefer an emitted ESM package over exporting a large source tree:

```json
{
  "name": "@budget/domain",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./money.js": {
      "types": "./dist/money.d.ts",
      "default": "./dist/money.js"
    }
  },
  "files": ["dist"]
}
```

Important rules are:

- list public entry points explicitly;
- point every target at an exact file;
- put the `types` condition first so TypeScript and Metro agree;
- include a `default` condition for unknown environments;
- do not expose internal directories with a broad wildcard unless that is the
  intended public API;
- treat adding or restricting `exports` as a breaking package-contract change;
- do not publish TypeScript source as if it were portable JavaScript.

`exports` takes precedence over `main`, encapsulates unlisted paths in Node.js,
and can select different targets by condition. Metro 0.84 also prefers
`exports`, asserts `react-native` on native and `browser` on web, and uses an
exact target without platform or source-extension expansion. The order of
conditions is significant. [Node.js: `exports`](https://nodejs.org/api/packages.html#exports)
[Node.js: conditional exports](https://nodejs.org/api/packages.html#conditional-exports)
[Expo: package exports conditions](https://docs.expo.dev/versions/v57.0.0/config/metro/#packagejsonexports)
[Metro: package exports changes](https://metrobundler.dev/docs/package-exports/)

Use package `imports` only inside a package whose complete runtime set supports
it. Its keys must start with `#` and its mappings are private to that package.
It is suitable for a future Bun/Node package. In the Expo application, use it
only after a checked Metro proof and prefer a descriptive prefix such as
`#app/*` over `#/*`.

## JSON modules

There is no one JSON import form that is confirmed by the official contracts
of all three hosts.

Node.js ESM requires an import attribute:

```ts
import data from './data.json' with { type: 'json' }
```

Bun supports this standard form and also permits a JSON import without the
attribute. TypeScript's `resolveJsonModule` gives the imported JSON a static
type, but TypeScript preserves import attributes for the host and does not
validate their meaning. [Node.js: JSON modules](https://nodejs.org/api/esm.html#json-modules)
[Bun: import JSON](https://bun.sh/guides/runtime/import-json)
[TypeScript: `resolveJsonModule`](https://www.typescriptlang.org/tsconfig/resolveJsonModule.html)
[TypeScript: import attributes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-3.html#import-attributes)

Metro includes `.json` in its normal source extensions, and Expo enables
`resolveJsonModule`, but Expo's current guide does not define a universal
import-attribute contract for native, web, and server output. Therefore:

- in universal mobile code, prefer a typed `.ts` module for small static
  configuration;
- if data must stay JSON, test its import on iOS, Android, web export, and every
  server host that consumes it;
- in a Node/Bun-only ESM tool, use the standard `with { type: 'json' }` form;
- never rely on a JSON named export. JSON modules expose one default value in
  Node.js.

## CommonJS interoperation

Use ESM imports and exports in product code. Keep CJS only where a tool's
documented configuration still uses `module.exports`, such as the present
Babel configuration.

When ESM must consume a CJS dependency, prefer a default import and then read
properties from that value:

```ts
import legacyPackage from 'legacy-package'

const { parse } = legacyPackage
```

Node.js guarantees that `module.exports` is available as the default export of
a CJS module. Named CJS exports are a best-effort static analysis and can differ
between hosts. Bun is more permissive: it permits `require` in ESM and mixing
both systems in one file. Do not depend on that Bun extension in portable code.
[Node.js: ESM and CommonJS interoperation](https://nodejs.org/api/esm.html#interoperability-with-commonjs)
[Bun: module systems](https://bun.sh/docs/runtime/module-resolution#module-systems)

Do not publish both CJS and ESM builds unless a real consumer requires both.
Conditional `import` and `require` branches can expose different objects and
leave one output less well checked. TypeScript's current guide calls out these
dual-output hazards. [TypeScript: dual-emit solutions](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options#notes-on-dual-emit-solutions)

## Expo Router

Expo Router discovers route files from `src/app`. Route filenames are router
metadata, not ESM specifiers:

- keep route files as `.ts` or `.tsx` files with the documented names;
- do not rename routes to `.mts`;
- do not put shared modules in `src/app` because Router treats files there as
  routes;
- import screen and domain modules from outside `src/app` with the module rules
  above;
- keep navigation paths such as `/books/family` free of `.tsx`, `.ts`, or
  `.js`;
- keep special names such as `_layout.tsx`, `index.tsx`, and
  `+not-found.tsx` unchanged;
- keep `expo-router/entry` as a bare package subpath.

Expo Router documents that all files in `src/app` define routes, that
`index.tsx` defines a directory's default route, and that non-navigation
components belong outside `src/app`. [Expo Router: core concepts](https://docs.expo.dev/router/basics/core-concepts/)
[Expo Router: notation](https://docs.expo.dev/router/basics/notation/)

## Proposed migration order

1. Keep the present root and mobile TypeScript module settings.
2. Change `packages/mobile`'s `main` to `./src/index.ts`.
3. Name the required CommonJS Babel boundary `babel.config.cjs`.
4. Replace ordinary extensionless internal imports with exact `.ts` or `.tsx`
   imports. Replace directory imports with explicit `index.ts` or `index.tsx`.
5. Enable Biome's `useImportExtensions` rule for relative imports. Review
   aliased internal imports separately because this rule checks relative
   specifiers only.
6. Keep a reviewed exception list for imports that select platform files.
7. Keep external package specifiers and Expo Router paths unchanged.
8. Use `import type` for all type-only dependencies.
9. Do not add package `exports` or `imports` until a shared package exists.
10. Give each future emitted package its own Node-oriented `tsconfig.json` and
   validate its built `dist` package, not only its source.

After each migration batch, run:

```sh
cd packages/mobile
bun run types:check
bun x expo export --platform web
bun x expo export --platform ios
```

Also start Metro once for web and once for a local iOS development build. A
static type check cannot prove that Metro, Hermes, and web chunk loading resolve
the same file. Test at least one platform-specific module before applying an
extension rule to all imports.

## Main risks

| Risk | Result | Control |
| --- | --- | --- |
| Write `.js` in current mobile TypeScript | Bun can pass while Metro cannot find the module | Use exact `.ts` or `.tsx` in Metro source |
| Enforce extensions without an exception for platform files | Metro stops selecting `.ios`, `.native`, or `.web` implementations | Keep stable-basename imports extensionless only for this case |
| Treat `~/*` as standard ESM | A Bun or Node tool can fail outside Expo | Limit the alias to Metro application code |
| Replace `~/*` with `#app/*` without a proof | An undocumented Expo resolver edge can fail only in a native or web bundle | Keep the tested Expo alias or test all Metro targets first |
| Add `exports` broadly | Private imports become errors in Node and change resolution in Metro | Export a small explicit API and test all consumers |
| Put platform variants behind one exact `exports` target | Metro does not apply platform suffix selection after an exports match | Use conditions or `Platform.select`, or keep the module in app code |
| Import JSON without a host decision | Node ESM rejects a form accepted by Bun or Metro | Use a typed TS module or test the JSON boundary on every host |
| Depend on named imports from CJS | Runtime shapes differ by host and package | Prefer default import and isolate the adapter |
| Apply one `tsconfig` to Metro, Node tools, and emitted libraries | TypeScript checks the wrong host rules | Use one configuration per runtime or emitted package |

## Decision summary

The current TypeScript module configuration is already correct. The useful
migration is not a switch to `nodenext` in the Expo app. It is a clear import
contract:

```text
Metro app source       -> exact .ts/.tsx
Metro platform seam    -> extensionless stable basename
Package dependency     -> exact public package specifier
Expo Router navigation -> URL path, never a source extension
Emitted Node package   -> output-relative .js and package exports
Node/Bun JSON tool     -> .json with { type: "json" }
```

This contract gives Sort of Budget explicit resolution without pretending that
Metro, Bun, and native Node.js are the same module host.
