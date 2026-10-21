# budgetly-ai

Local Expo module (`BudgetlyAI`, iOS only) for voice input and model interpreters. The
TypeScript contract is in `src/budgetly-ai-module.ts` and `src/budgetly-ai.types.ts`.

## Privacy rules

- Speech recognition runs on the device only. `SFSpeechRecognizer` always has
  `requiresOnDeviceRecognition = true`; a locale without on-device support is `unsupported`.
- Only the on-device `SystemLanguageModel` is used. `PrivateCloudComputeLanguageModel` is never used.
- Needle telemetry is turned off (`NEEDLE_TELEMETRY=0`, `DO_NOT_TRACK=1`) before the load.
  The iOS static library imports no network symbols; confirm with a network trace on a device.
- The module stores no audio, transcripts, or prompts.

## Functions

| Function | What it does |
| --- | --- |
| `getSpeechStatus(locales)` | Per locale: `ready`, `needs-download`, `unsupported`, or `unavailable`, and the engine. |
| `downloadSpeech(locale)` | Downloads the system speech asset (iOS 26, `AssetInventory`). Progress comes as `onSpeechDownload`. |
| `startListening(locale, contextualStrings)` | Asks for microphone access (and speech access on iOS < 26), then starts recognition. Text comes as `onTranscript`, level as `onAudioLevel` (at most 20 per second, -60…0 dBFS mapped to 0…1). |
| `stopListening()` | Ends the audio, finalizes, and returns the finalized text. After an interruption it returns the text of the interrupted session. |
| `cancelListening()` | Stops without a result. |
| `getAppleModelStatus()` | `SystemLanguageModel.default.availability`, `supportsLocale(Locale.current)`, or `unsupportedOS`. |
| `interpretWithAppleModel(instructions, toolsJson, text)` | Guided generation with a schema built from the tool list. Returns `[{ name, arguments }]` or `[]`. |
| `needleLoad(path)` / `needleComplete(system, toolsJson, text)` / `needleUnload()` | Needle 3 C API, serialized on one queue. Needs iOS 26.2+. `needleUnload` only resets: the C API has no unload. |
| `excludeFromBackup(path)` | Sets `isExcludedFromBackup` on a file or directory (path or `file://` URI). |

Engines: `SpeechAnalyzer` + `SpeechTranscriber` when the locale is supported; otherwise
`DictationTranscriber` (covers on-device dictation languages such as `ru-RU`); on iOS < 26
`SFSpeechRecognizer`. Contextual strings go to `AnalysisContext` (iOS 26) or
`SFSpeechRecognitionRequest.contextualStrings`, at most 100.

Apple model schema: one `anyOf` over per-tool objects. Each object has a constant `tool`
discriminator and only that tool's arguments; string arguments with `enum` become `anyOf`
choices, numbers are `Double`. An extra `no_matching_tool` choice gives `[]`.

## Needle setup

`ios/Needle.xcframework` is not committed. Build it once before `expo run:ios`:

```sh
modules/budgetly-ai/scripts/fetch-needle.sh
```

The script downloads `libneedle.a` (device and simulator) and `needle.h` from a pinned
Hugging Face revision, checks SHA-256, and assembles the xcframework by hand (module `CNeedle`).
Set `NEEDLE_SOURCE_DIR` to copy already downloaded files instead. Without the xcframework the app
still builds, and the Needle functions reject with "Needle is not bundled".

## Not verified

The five non-Expo Swift files type-check in Swift 6 mode against the iOS 27.1 SDK (target iOS 16.4),
with a stub for the Expo exception classes. Not yet verified with a real build:

- `BudgetlyAIModule.swift` against ExpoModulesCore 58, and the pod build itself.
- That Swift finds `CNeedle` through the xcframework headers CocoaPods copies.
- Linking `libneedle.a` (built with minos iOS 26.2) into an app with a lower deployment target.
- Whether `needle_load` copies the model bytes (the buffer is kept alive to be safe).
- Runtime behavior on a device: speech without speech authorization on iOS 26, contextual
  strings with `SpeechTranscriber`, `sendEvent` from the audio thread, and model accuracy.
