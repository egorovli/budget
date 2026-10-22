# On-device AI commands

Research date: 2026-10-21

## Question

Can Sort of Budget turn a typed or spoken sentence into a structured domain command
on the device, show it for confirmation, and save it? Example sentences:

- "add a payment of 27.50 zł at Żabka for groceries from my Revolut card";
- "transfer 200 EUR from Revolut to Erste".

Constraints from the founder and from [`docs/principles.md`](../principles.md):

- financial data must not leave the device;
- voice input: English first, Russian is ideal;
- a Settings → AI page where the user can download a local model, see its size
  and status, and delete it;
- Expo SDK 58, React Native 0.88, expo-router, local Expo builds only (no EAS).

This document compares the on-device options and recommends an architecture.
No option was built or run on a device for this research.

## Recommendation

1. **Build the deterministic path first.** A rule-based interpreter reads the
   amount, Currency, Account names, Transfer direction, and date words. It
   produces a **command draft**. The user confirms the draft in the existing
   forms before the app calls `saveExpense`, `saveReserve`, or a future Transfer
   or Income command. This path runs on web, iOS, and Android, in every
   language, and needs no download.
2. **Add Apple Foundation Models as the first model interpreter on iOS.** It is
   on the device, free, already installed with Apple Intelligence, and its
   guided generation constrains output to a schema. Call it from a small local
   Expo Module in Swift with a runtime `DynamicGenerationSchema` that lists the
   real Account names of the Book. Do not use Private Cloud Compute.
   **Russian is not an Apple Intelligence language**, so this interpreter is
   English-only for Sort of Budget (also no Polish).
3. **Voice: Apple Speech framework, on device.** Use `SpeechTranscriber`
   (iOS 26+) where `supportedLocales` contains the locale. Fall back to
   `DictationTranscriber`, which uses the on-device dictation models. Apple's
   official on-device dictation list contains **Russian (Russia)**. Show
   volatile results as a live preview, and interpret only finalized text.
4. **Defer a downloadable model.** Add one only if the deterministic
   interpreter plus Apple Foundation Models fail on measured Russian or
   Polish sentences. Candidates: Qwen3 through `llama.rn` with JSON-schema
   grammar, Needle 3 (Cactus) through a custom native module, or a Core AI
   model in a Foundation Models session on iOS 27. Each has an open risk
   (see below).
5. **Settings → AI page** shows three rows: Apple Intelligence status (system
   managed, no download), speech assets per locale (system download through
   `AssetInventory`), and optional downloaded models (app managed: size,
   progress, pause/resume, delete).

The model never writes to the Book. It only fills a draft. Deterministic code
validates every field against the Book and against the original text, and the
user confirms.

## 1. Cactus and "Needle"

### What "Needle" is

"Cactus Needle 3" is a real name, not a mishearing. **Needle 3** is a small
model from Cactus Compute for tool calls and structured extraction.
[Needle repository](https://github.com/cactus-compute/needle)

| Property | Value | Source |
| --- | --- | --- |
| Parameters | 121M; "does the arithmetic of a 50M one"; tuned subnetworks from 29M | [README](https://github.com/cactus-compute/needle), [model card](https://huggingface.co/Cactus-Compute/needle3) |
| File size | README: "a single 8-29 MB binary" (depends on depth). The published `needle3.cact` on Hugging Face is 35.3 MB. | [README](https://github.com/cactus-compute/needle), [HF files](https://huggingface.co/Cactus-Compute/needle3/tree/main) |
| License | Apache-2.0 (repository and model card) | [LICENSE](https://github.com/cactus-compute/needle/blob/main/LICENSE), [model card](https://huggingface.co/Cactus-Compute/needle3) |
| Tool calls | Picks functions and fills arguments; returns an empty list when no tool fits; each response has a calibrated `confidence` | [README](https://github.com/cactus-compute/needle) |
| Structured extraction | "The decode grammar guarantees the output parses" | [README](https://github.com/cactus-compute/needle) |
| Text languages | Not stated. Fine-tuning data named: DroidCall, Mobile Actions. **Russian: not confirmed.** | [model card](https://huggingface.co/Cactus-Compute/needle3) |
| Speech companion | Whistle, 16.9 MB, English, German, French, Spanish, Italian, Dutch, Polish. **No Russian.** New languages need local fine-tuning. | [README, Whistle section](https://github.com/cactus-compute/needle#whistle) |
| Context | Tool schemas, system prompt, and history share one window; size not stated | [model card](https://huggingface.co/Cactus-Compute/needle3), [devices guide](https://cactuscompute.com/blog/needle-supported-devices) |
| Telemetry | "By default, telemetry is turned on in the binary." Turn off with `NEEDLE_TELEMETRY=0` and `DO_NOT_TRACK=1`. | [README, Deploy](https://github.com/cactus-compute/needle#deploy) |

The Cactus engine README calls Needle "a 26m parameter model". That text seems
to describe an earlier Needle generation; the Needle README says Needle 2 is
still available with `generation=2`. **Uncertain** which generation the 26M
figure refers to. [Cactus README](https://github.com/cactus-compute/cactus)

iOS support for Needle: the devices guide lists `ios-arm64` and
`ios-sim-arm64` folders with `libneedle.a` and `needle.h`, and a C API
(`needle_load`, `needle_init`, `needle_complete`, `needle_transcribe`,
`needle_embed`). The native API keeps one process-global model. There is
**no React Native or Swift package** for Needle. The only JavaScript package,
[`cactus-needle`](https://www.npmjs.com/package/cactus-needle) (0.3.0,
Apache-2.0), is community-maintained and runs on Node.js and browsers through
WebAssembly, not in React Native. The guide says "Inference never touches the
network". [Devices guide](https://cactuscompute.com/blog/needle-supported-devices)

Needle fits Sort of Budget's task shape well (tool selection, grammar-constrained
extraction, empty result on unknown requests). It needs a custom Expo Module
over the C API, a check that telemetry is off in the iOS static library, and
an evaluation of Russian and Polish sentences.

### Cactus engine and its React Native binding

Cactus is "A hybrid edge-cloud AI engine for mobile devices & wearables". It
has OpenAI-compatible APIs for text, speech, and vision; it lists Liquid,
Gemma, Whisper, Parakeet, and Qwen families as "especially tested". It can
route hard queries to the cloud ("Cactus Hybrid", `cloud_handoff`).
[Cactus README](https://github.com/cactus-compute/cactus)

- **npm package `cactus-react-native` is archived.** The GitHub repository is
  archived (read-only); the last npm release is 1.13.1 (2026-04-19). It used
  Nitro Modules (`react-native-nitro-modules`). Its API had `download({ onProgress })`,
  `isDownloaded`, `getModels()`, tool calls, `CactusSTT` with streaming, and
  **`telemetryEnabled` defaults to `true`** and a cloud handoff threshold.
  [Archived repository](https://github.com/cactus-compute/cactus-react-native),
  [npm](https://www.npmjs.com/package/cactus-react-native)
- **The current binding** lives in
  [`bindings/react-native`](https://github.com/cactus-compute/cactus/tree/main/bindings/react-native)
  of the main repository. It is not an npm package: you copy the bridge files,
  build with `cactus build --apple`, and add the Swift binding. The README
  does not mention Expo or a config plugin. Streaming transcription returns
  `confirmed` (final) and `pending` (volatile) text.
- **License of the Cactus engine is not open source.** Free use is limited to
  individuals for personal or non-commercial use, organizations with less than
  USD 2,000,000 in both total funding and gross annual revenue, education, and
  non-profits. Others need a commercial license.
  [Cactus LICENSE](https://github.com/cactus-compute/cactus/blob/main/LICENSE)
- Cactus CLI telemetry is "off by default" (`--enable-telemetry`).
  [Cactus README](https://github.com/cactus-compute/cactus)

**Conclusion:** do not adopt the Cactus engine or its React Native binding now:
the npm package is archived, the current binding needs manual integration,
the license has revenue and funding limits, and the SDK defaults include
telemetry and cloud handoff. Needle 3 alone (Apache-2.0) stays a candidate for
a later prototype.

## 2. Apple Foundation Models

### Availability

- Framework: iOS, iPadOS, macOS, Mac Catalyst, visionOS 26.0+; watchOS 27.0+.
  [Foundation Models](https://developer.apple.com/documentation/foundationmodels)
- Needs a device that supports Apple Intelligence: iPhone 15 Pro, iPhone 15
  Pro Max, iPhone 16 models and later, iPhone Air. Apple Intelligence needs up
  to 8 GB of storage (up to 14 GB on iPhone 17 Pro, 17 Pro Max, and Air).
  Not available on devices bought in mainland China.
  [Apple Intelligence requirements](https://support.apple.com/en-us/121115)
- Availability check: `SystemLanguageModel.default.availability`; unavailable
  reasons are `deviceNotEligible`, `appleIntelligenceNotEnabled`, and
  `modelNotReady`.
  [UnavailableReason](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/availability-swift.enum/unavailablereason)

### Capabilities

- **Guided generation:** the `@Generable` macro and `@Guide` constraints;
  "the framework provides strong guarantees that the model generates instances
  of your type". [Foundation Models](https://developer.apple.com/documentation/foundationmodels),
  [Guided generation](https://developer.apple.com/documentation/foundationmodels/generating-swift-data-structures-with-guided-generation)
- **Runtime schemas:** `DynamicGenerationSchema` builds a schema at runtime,
  including `init(name:description:anyOf:)` for a closed set of choices. This
  lets the app constrain an Account field to the names in the current Book.
  [DynamicGenerationSchema](https://developer.apple.com/documentation/foundationmodels/dynamicgenerationschema)
- **Tool calling:** the `Tool` protocol.
  [Tool calling](https://developer.apple.com/documentation/foundationmodels/expanding-generation-with-tool-calling)
- **Context size:** "Apple's on-device foundation model has a context window
  of 4096 tokens per session". Instructions, tool definitions, and generable
  schemas count against it. `contextSize` and `tokenCount(for:)` return the
  real values. [Managing the context window](https://developer.apple.com/documentation/foundationmodels/managing-the-context-window),
  [contextSize](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/contextsize)
  The WWDC26 session shows an example where `contextSize` returns 8192.
  **Uncertain** whether the iOS 27 on-device model has a larger window; read
  `contextSize` at runtime. [WWDC26 session 241](https://developer.apple.com/videos/play/wwdc2026/241/)

### Languages: Russian is not supported

- The on-device model "understands and generates text in any language that
  Apple Intelligence supports". Check with `supportsLocale(_:)`. On an
  unsupported language, `respond` throws `unsupportedLanguageOrLocale`.
  [Supporting languages and locales](https://developer.apple.com/documentation/foundationmodels/supporting-languages-and-locales-with-foundation-models)
- Apple Intelligence languages for iOS 27: English, Danish, Dutch, French,
  German, Italian, Norwegian, Portuguese, Spanish, Swedish, Turkish,
  Vietnamese, Chinese (Simplified and Traditional), Japanese, Korean.
  **Russian and Polish are not on the list** (page dated 2026-09-14).
  [Apple Intelligence languages](https://support.apple.com/en-us/121115)

### iOS 27 changes (WWDC26)

- New on-device model, "rebuilt from the ground up", "better at logic and tool
  calling"; image input; a `usage` property with token counts.
  [WWDC26 session 241](https://developer.apple.com/videos/play/wwdc2026/241/)
- `PrivateCloudComputeLanguageModel` (iOS 27+): a server model with a 32K
  context, a daily per-user limit, and a managed entitlement.
  [Private Cloud Compute](https://developer.apple.com/documentation/foundationmodels/adding-server-side-intelligence-with-private-cloud-compute)
  **Do not use it in Sort of Budget.** It sends the prompt off the device, which
  conflicts with principle 1.
- `LanguageModel` protocol and `LanguageModelCapabilities` (`.toolCalling`,
  `.guidedGeneration`, `.reasoning`): other models can back a
  `LanguageModelSession`.
  [LanguageModelCapabilities](https://developer.apple.com/documentation/foundationmodels/languagemodelcapabilities)
- Core AI: an open-source model exported with
  [`apple/coreai-models`](https://github.com/apple/coreai-models) (BSD-3-Clause)
  runs in the same session API on iOS 27 and Xcode 27. Apple suggests "a model
  around 0.6B parameters as a good first choice". The registry includes
  `qwen3`, `qwen3_5`, `gemma3`, `smollm2`, `whisper`, and `parakeet` folders.
  `CoreAILanguageModel` declares `.guidedGeneration` only when the exported
  model supports it. [Running a Core AI model](https://developer.apple.com/documentation/foundationmodels/running-a-core-ai-model-in-a-foundation-models-session),
  [CoreAILanguageModel.swift](https://github.com/apple/coreai-models/blob/main/swift/Sources/CoreAILanguageModels/LanguageModel/CoreAILanguageModel.swift)
  This is a possible path to a Russian-capable model with the same Swift code.
  **Uncertain:** model sizes after export, and whether guided generation works
  for a given exported model; the docs show bundling, not downloading, the
  resource folder.

### Calling it from React Native

| Option | Facts | Fit |
| --- | --- | --- |
| [`@react-native-ai/apple`](https://www.npmjs.com/package/@react-native-ai/apple) (Callstack, MIT, 0.12.0, 2026-01-28) | Vercel AI SDK v5 provider; iOS 26+; New Architecture; text, structured output (Zod schema), tool calling, streaming, embeddings, transcription. String formats and regular expressions in schemas are not supported. [README](https://github.com/callstackincubator/ai/tree/main/packages/apple-llm), [docs](https://github.com/callstackincubator/ai/blob/main/website/src/docs/apple/generating.md) | Fast to try. Adds the `ai` and `zod` dependencies. Its transcription is file-only, no streaming. |
| Local Expo Module in Swift | [Expo Modules API](https://docs.expo.dev/modules/overview/) with an `async` function that builds a `DynamicGenerationSchema` and returns JSON | Smallest dependency surface; full control of availability, language, and schema. Recommended. |

## 3. On-device speech

### Apple Speech framework

| API | OS | On device | Russian (ru-RU) on device |
| --- | --- | --- | --- |
| `SpeechAnalyzer` + `SpeechTranscriber` | iOS 26+ (not watchOS) | Always; models are system assets | **Not confirmed.** Apple publishes no static list. The WWDC25 session says "with more to come" and points to `SpeechTranscriber.supportedLocales`. Check at runtime. |
| `SpeechAnalyzer` + `DictationTranscriber` | iOS 26+ | Always; same models as on-device `SFSpeechRecognizer` | **Yes, by inference:** it "supports the same languages, speech-to-text model, and devices as iOS 10's on-device SFSpeechRecognizer", and Apple lists Russian (Russia) for on-device dictation. |
| `SFSpeechRecognizer` + `requiresOnDeviceRecognition = true` | iOS 13+ | Only when `supportsOnDeviceRecognition` is true | **Yes:** Russian (Russia) is in Apple's "On-Device and Modeless Dictation" list. Polish is not. |

Sources: [SpeechAnalyzer](https://developer.apple.com/documentation/speech/speechanalyzer),
[SpeechTranscriber](https://developer.apple.com/documentation/speech/speechtranscriber),
[supportedLocales](https://developer.apple.com/documentation/speech/speechtranscriber/supportedlocales),
[DictationTranscriber](https://developer.apple.com/documentation/speech/dictationtranscriber),
[requiresOnDeviceRecognition](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition),
[iOS feature availability: on-device dictation](https://www.apple.com/ios/feature-availability/#dictation-on-device),
[WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/).

The per-device rule for ru-RU is not published. Confirm with
`supportsOnDeviceRecognition` and `supportedLocales` on the target devices.

Facts for the design:

- **Assets:** `AssetInventory.assetInstallationRequest(supporting:)` and
  `downloadAndInstall()`. Assets are system-managed, shared between apps, kept
  across launches, and updated automatically. Apps have a limited number of
  locale reservations; `release(reservedLocale:)` frees one and the system
  removes the asset later. [AssetInventory](https://developer.apple.com/documentation/speech/assetinventory)
- The model runs outside the app memory and does not add to the app size.
  [WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/)
- **Volatile results:** opt-in with `.volatileResults`; the transcriber "will
  deliver several results for an audio range as it refines the transcription".
  A finalized result (`isFinal`) is the last result for that audio range.
  [volatileResults](https://developer.apple.com/documentation/speech/speechtranscriber/reportingoption/volatileresults),
  [WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/)
- `DictationTranscriber` accepts `contextualStrings`, which can bias
  recognition to Account names, merchants, and Currency words.
  [DictationTranscriber](https://developer.apple.com/documentation/speech/dictationtranscriber)

### Expo and React Native wrappers

- [`expo-speech-recognition`](https://github.com/jamsch/expo-speech-recognition)
  (jamsch, MIT, 58.0.0, 2026-10-16): the iOS code uses `SFSpeechRecognizer`
  with `requiresOnDeviceRecognition`, `interimResults`, and
  `contextualStrings`. **It does not use `SpeechAnalyzer`.**
  ([ExpoSpeechRecognizer.swift](https://github.com/jamsch/expo-speech-recognition/blob/main/ios/ExpoSpeechRecognizer.swift)).
  An open issue reports "Recognizer is unavailable" on the iOS 26.4 simulator
  ([#145](https://github.com/jamsch/expo-speech-recognition/issues/145)).
- `@react-native-ai/apple` transcription uses `SpeechAnalyzer` and
  `SpeechTranscriber`, but "does not support streaming or live transcription".
  [Transcription docs](https://github.com/callstackincubator/ai/blob/main/website/src/docs/apple/transcription.md)
- No package found that exposes live `SpeechAnalyzer` with volatile results.
  A local Expo Module is needed for that.

### Whisper-class alternatives

| Model | Size | Russian | Runtime |
| --- | --- | --- | --- |
| Whisper tiny / base / small (multilingual) | 75 / 142 / 466 MiB (ggml) | Yes (multilingual models) | [whisper.rn](https://github.com/mybigday/whisper.rn) 0.7.4, MIT, needs prebuild. [whisper.cpp sizes](https://github.com/ggml-org/whisper.cpp#memory-usage), [Whisper](https://github.com/openai/whisper) |
| Parakeet TDT 0.6B v3 | 355.6 MB (q4_0) to 1255.9 MB (f16) | Yes; 25 European languages incl. Russian and Polish; CC BY 4.0 | `whisper.rn` `ParakeetContext`. [Model card](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3), [GGUF files](https://huggingface.co/ggml-org/parakeet-GGUF/tree/main) |
| Whistle (Cactus) | 16.9 MB | No (7 languages incl. Polish) | Needle C API only. [README](https://github.com/cactus-compute/needle#whistle) |

These add hundreds of MB and a native engine. Use them only if Apple's
on-device recognition fails for a required locale on target devices.

## 4. Other small on-device LLM options

| Option | Package | Constrained output | Notes |
| --- | --- | --- | --- |
| llama.cpp (GGUF) | [`llama.rn`](https://github.com/mybigday/llama.rn) (MIT, latest tag 0.13.0-rc.7) | GBNF grammar and JSON schema; tool calls through Jinja templates | New Architecture required since v0.10; Expo needs `expo-build-properties`. |
| ExecuTorch (`.pte`) | [`react-native-executorch`](https://github.com/software-mansion/react-native-executorch) (MIT, 0.10.7) | Tool calling with JSON Schema tool definitions; grammar-constrained decoding not documented in the LLM guide | New Architecture, Expo SDK 55+ development builds, iOS 17+. Resumable cached downloads with `AbortSignal`. "Downloads of our pre-exported models send an anonymous download event"; opt out with `setTelemetryEnabled(false)`. [Downloading models](https://github.com/software-mansion/react-native-executorch/blob/main/docs/docs/01-fundamentals/02-downloading-models.md), [LLM guide](https://github.com/software-mansion/react-native-executorch/blob/main/docs/docs/02-extensions/natural-language/02-llm-chat-and-generation.md) |
| MLC | [`@react-native-ai/mlc`](https://www.npmjs.com/package/@react-native-ai/mlc) (MIT, 0.12.0) | Not checked | Not evaluated further. |
| Core AI (iOS 27) | local Expo Module + `coreai-models` | Guided generation when the model declares it | See section 2. |

Model sizes (official files):

- Qwen3-0.6B: Apache-2.0, "100+ languages and dialects"; Q8_0 GGUF 639.4 MB.
  Qwen3-1.7B Q8_0: 1834.4 MB. [Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B),
  [0.6B GGUF](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/tree/main),
  [1.7B GGUF](https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/tree/main)
- Needle 3: 35.3 MB file, languages not stated (section 1).
- Gemma and SmolLM sizes were not checked against publisher files.
  **Uncertain.**

For Sort of Budget, Qwen3-0.6B with a JSON-schema grammar in `llama.rn` is the most
direct Russian-capable candidate. Its accuracy on finance commands is not
measured.

## 5. Recommended architecture

### Flow

```text
microphone ──> on-device transcriber ──> finalized text ─┐
 (volatile text shown as live preview only)               │
keyboard ─────────────────────────────────────────────────┤
                                                          v
                                   interpreter port: text + Book context
                                     ├─ rules (always; all platforms)
                                     ├─ Apple Foundation Models (iOS, en)
                                     └─ downloaded model (optional, later)
                                                          │
                                                          v
                         command draft (kind + raw fields + source spans)
                                                          │
                                       deterministic resolver and validator
                                                          │
                                                          v
                        confirmation form (existing forms, prefilled)
                                                          │ user taps Save
                                                          v
                  domain command: saveExpense / saveReserve / Transfer / Income
```

### Command draft schema

One closed union, small enough for a 4096-token window:

- `kind`: `expense | income | transfer | balance | reserve | unknown`;
- `amount`: decimal string as written; `currency`: ISO code or null;
- `account`, `toAccount`: one of the Book's Account names or null;
- `reserve`: one of the active Reserve names or null;
- `date`: `today | yesterday | YYYY-MM-DD | null`;
- `counterparty`, `category`, `note`: free text or null.

`Expense` in `model.ts` has no Category or Counterparty fields yet. Until it
has them, put the free text into `note` and show it on the confirmation form.
Transfer and Income drafts show "not available yet" until the domain commands
exist.

### Constraining the model

- Apple Foundation Models: build a `DynamicGenerationSchema` per request; use
  `anyOf` choices for `kind`, Currency codes in the Book, Account names, and
  Reserve names. A model then cannot invent an Account.
- `llama.rn`: the same JSON Schema as a grammar.
- Needle: one tool per command kind; an empty list means `unknown`.
- Instructions in English (an Apple requirement for the model's supported
  language); call `supportsLocale` first and skip the model on `ru` or `pl`.

### Deterministic parser and validator

- Parse amounts with both decimal separators (`27.50`, `27,50`), thousands
  separators, and words for currencies and symbols (`zł`, `PLN`, `€`, `EUR`,
  `руб`, `₽`). Resolve dates relative to the device calendar day (see
  [transaction date and time model](transaction-date-time-model.md)).
- Match Account and Reserve names case- and diacritic-insensitively, with
  remembered aliases ("Revolut card" → Account "Revolut").
- **Check model output against the text:** the amount digits must appear in
  the input; a currency must be in the input or equal to the Account
  currency; otherwise mark the field as uncertain. This follows principle 2:
  "make uncertainty and invalid states visible".
- The rule result is the fallback when the model is unavailable, refuses, or
  returns `unknown`. When both run, show the conflict as an uncertain field.

### Confirmation

Always open the prefilled form. Never save from voice or a model directly.
Highlight uncertain or inferred fields. Keep the source text with the draft
only until the user saves or cancels. Do not store transcripts or prompts in
the Book, logs, or analytics.

### Privacy

- Allowed: on-device `SystemLanguageModel`, on-device speech, a local model
  file. Not allowed: `PrivateCloudComputeLanguageModel`, Cactus cloud handoff,
  server STT (`requiresOnDeviceRecognition` must be `true`; if
  `supportsOnDeviceRecognition` is false, disable voice for that locale).
- Turn off all telemetry of any native AI library before it sees user text,
  and verify with a network trace on device.
- The model download is the only network call. It carries no user data and
  uses a pinned URL and a pinned SHA-256 hash in the app.

### Model download management (Settings → AI)

| Row | Status source | Actions |
| --- | --- | --- |
| Apple Intelligence | `SystemLanguageModel.default.availability` and `supportsLocale` | None in app; explain the reason (`appleIntelligenceNotEnabled`, `deviceNotEligible`, `modelNotReady`). |
| Speech for each locale | `SpeechTranscriber.installedLocales` / `supportedLocales`; `AssetInventory` progress | Download (`downloadAndInstall`), Remove (`release(reservedLocale:)`; the system deletes later). The system owns the storage. |
| Downloaded model (later) | App manifest: id, version, URL, size, SHA-256 | Download, Pause/Resume, Delete; show size before download and free space (`Paths.availableDiskSpace`). |

For app-managed files:

- Store under Application Support (`<app>/Library/Application Support/models/<id>/<version>/`),
  not Documents, and set `isExcludedFromBackup = true`. Apple: exclude large
  files "the user can download … again". Caches is not good here: "The system
  periodically purges these directories".
  [iCloud backup guidance](https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup),
  [isExcludedFromBackup](https://developer.apple.com/documentation/foundation/urlresourcevalues/isexcludedfrombackup)
  This matches principle 3: models are not user data and are not in the
  backup.
- Expo FileSystem (SDK 58) has `DownloadTask` "with pause/resume support and
  progress tracking", and iOS background sessions. The new API has no
  backup-exclusion setter, so set the flag in the local Expo Module.
  [Expo FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/)
- Download to a temporary name, verify SHA-256, then rename atomically. Delete
  removes the version directory.

### Order of work

1. Command draft type, rule interpreter, and confirmation for typed text
   (web and iOS). Tests with English, Russian, and Polish sentences.
2. Voice on iOS: on-device recognition for `en-US` and `ru-RU`, live preview,
   finalized text into step 1. Quick start with `expo-speech-recognition`
   (`requiresOnDeviceRecognition: true`), then a local `SpeechAnalyzer`
   module if the quality or the iOS 26 issue needs it.
3. Local Expo Module for Foundation Models with a dynamic schema; English
   only; availability check.
4. Settings → AI page with the Apple Intelligence and speech rows.
5. Only on measured need: a downloadable model (Qwen3 via `llama.rn`,
   Needle 3, or Core AI on iOS 27) and the download row.

Transfer and Income domain commands are a dependency for those draft kinds,
not for the interpreter.

## What must be prototyped

1. `SpeechTranscriber.supportedLocales` and `DictationTranscriber` on target
   devices: is `ru-RU` available on device, how big is the asset download,
   and how good is accuracy with currency words and Account names.
2. `expo-speech-recognition` with `requiresOnDeviceRecognition: true` on an
   iOS 26 device: `supportsOnDeviceRecognition` for `en-US`, `ru-RU`, `pl-PL`.
3. Foundation Models with a `DynamicGenerationSchema` built from the Book:
   accuracy on 50 labelled English commands, latency, token count, and
   behavior on mixed Polish merchant names (Żabka).
4. Rule interpreter vs model on the same labelled set, including Russian.
   This decides if a downloadable model is needed.
5. If needed: Needle 3 through its C API in an Expo Module (iOS build, size,
   telemetry off, network trace, Russian accuracy) and Qwen3-0.6B through
   `llama.rn` with a JSON schema (size, memory, latency).
6. Expo FileSystem `DownloadTask` pause/resume across app termination, and
   `isExcludedFromBackup` on the model directory.

## Prototype results (2026-10-21)

Needle 3 (`needle3.cact`, revision `d6c7d6a`) ran through its WebAssembly engine in Bun on
an Apple Silicon Mac, with the Sort of Budget tool list from `packages/mobile/src/commands/tools.ts`.
Synthetic sentences; one run each.

| Sentence | Result | Time |
| --- | --- | --- |
| add a payment of 27.50 zł at Żabka for groceries from my Revolut card | `add_expense`, 27.5 PLN, Revolut, groceries; merchant missed; invented date 2026-10-22 | 1.2 s |
| transfer 200 EUR from Revolut to Erste | `transfer`, all fields correct, confidence 0.69 | 1.0 s |
| spent 45 on coffee yesterday with cash | `add_expense`, Cash; date wrong (today + 1) | 0.9 s |
| salary 12000 to Erste | `add_expense` (wrong kind) | 0.7 s |
| got paid 3000 euro from client to Revolut | `add_income`, Revolut; currency wrong (PLN) | 0.9 s |
| put aside 3500 for rent until November 1 | no call | 0.9 s |
| купил продукты в жабке на 27,50 злотых с революта | no call | 2.0 s |
| переведи 200 евро с Revolut на Erste | `add_expense` (wrong kind), currency wrong | 1.3 s |
| zapłaciłem 30 zł za kawę gotówką | no call | 0.9 s |

Conclusions:

- Needle picks the Account and the kind well in plain English, but invents dates and misses
  currency words. Its `confidence` is often low (0.09–0.3), and calls under its gate move to
  `suppressed_calls`.
- It does not read Russian or Polish.
- So the rules are the base interpreter in every language. A model only fills fields that the
  rules left empty, and those fields are marked "check this" on the form
  (`packages/mobile/src/commands/interpret.ts`).
- In the app, Needle runs in the browser in a Web Worker and on iOS through `libneedle.a`.
  The WebAssembly engine has no network code. A string scan of the iOS `libneedle.a` found
  no URLs and no telemetry strings.
- A fine-tune on Sort of Budget tool calls (Cactus documents one for Needle) is the next step if
  English accuracy matters; Russian would need training data in Russian.

## Voice input panel from CBT-Quest

Read-only review. No file in CBT-Quest was changed.

### 1. Location

- Repo: `/Users/egorovli/Dev/cbt-quest/app` (remote `origin`). The working copy is on `main` and is clean.
- Branch: `origin/feat/v2`. This is the v2 code. Tip: `51d717f4` (2026-09-18). The code arrives in one squashed commit `12dea662` "v2 init".
- Do not confuse it with `origin/v2` (tip `48b32e02`, 2026-07-06). That branch is the v1 line. It has no live transcription code.
- The full history is in the backup clone `/Users/egorovli/Backup/current/Dev/cbt-quest/app`, branch `orca/lane-transcription` (tip `dd7948d78`). Its composer files are identical to `origin/feat/v2`.
- Key commits (backup clone):
  - `1d8cdd496` 2026-08-23 docs(research): evaluate live transcription architecture.
  - `a15a7f80f` 2026-08-26 feat(mobile): checkpoint v2 capture prototype.
  - `274a349c6` 2026-08-28 docs(ux): capture the v2 Composer interaction model.
  - `072dd304e` 2026-08-28 feat(mobile): integrate the v2 composer pipeline.
  - `c8ab11736` 2026-09-05 journal capture with transcription and composer.
  - `d3ada7113` 2026-09-05 language selection and download feedback.
  - `d5e6869bb` 2026-09-06 connect capture and note screens to durable device state.
  - `f3a327173` 2026-09-14 race-free drafts, plan v2 submissions, journal transcription wiring.
  - Branch `research/responsive-voice-ux` (`928e4c770`): `docs/research/2026-08-15-responsive-voice-capture-patterns.md`.

Key files on `origin/feat/v2` (all under `apps/mobile/`):

| File | Role |
| --- | --- |
| `modules/expo-recording-session/ios/RecordingSession.swift` | `AVAudioEngine` tap, file writer, meter events, interruptions, live transcriber setup. |
| `modules/expo-recording-session/ios/AppleSpeechTranscription.swift` | `SpeechAnalyzer` / `SpeechTranscriber`: locale check, asset download, live (volatile) and final transcription. |
| `modules/expo-recording-session/ios/ExpoRecordingSessionModule.swift` | Expo module API and events. |
| `modules/expo-recording-session/src/expo-recording-session.types.ts` | Typed event union for JS. |
| `src/modules/journal/composer/use-capture-draft.ts` (688 lines) | Draft controller: phases, permission, events, final insert, Send. |
| `src/modules/journal/composer/composer-presentation.ts` | Derived visibility and enabled state. |
| `src/modules/journal/composer/composer-recording.tsx` | Meter, timer, waveform, provisional text. |
| `src/modules/journal/composer/composer.tsx`, `composer-toolbar.tsx`, `use-composer-motion.ts` | Surface, Liquid Glass, toolbar, keyboard-following motion. |
| `src/modules/journal/composer/README.md` | Ownership and motion rules. Read it first. |
| `src/device/transcription/transcription-plan.ts` | Choice of final transcription route (Apple or Server). |
| `e2e/composer-states/*.yaml`, `e2e/composer-send/*.yaml` | Maestro flows. |

### 2. Stack

- Expo SDK 57 (`expo ~57.0.20`), React Native `0.86.3`, React `19.2.3`, `expo-router ~57.0.19`. iOS-first.
- Local Expo module `expo-recording-session` (Swift). Podspec sets iOS `26.0`.
- Speech: Apple `SpeechAnalyzer` + `SpeechTranscriber` (iOS 26). Live uses preset `.progressiveTranscription`. Final uses preset `.transcription` on the saved file. `AssetInventory` downloads locale models. `SFSpeechRecognizer` is used only to list locales on devices without `SpeechTranscriber`. No third-party speech package.
- Other packages: `expo-audio ~57.0.4` (only for microphone permission), `react-native-reanimated 4.6.0`, `react-native-keyboard-controller 1.22.4`, `expo-glass-effect ~57.0.1`, `expo-haptics`, `react-native-unistyles`, `@shopify/react-native-skia 2.11.2` (not used by the composer waveform), `temporal-polyfill`.
- No Apple Foundation Models and no on-device LLM. Commit `a8863537` on `origin/v2` even removes a false claim of an on-device model.
- Server: final transcription in `apps/worker/src/transcription/plan.ts` uses OpenAI `gpt-transcribe` (automatic multilingual). Deepgram `nova-3` is defined but not selected.
- Languages: Apple live text supports the `SpeechTranscriber.supportedLocales` list. The fallback list has 16 locales (`cs-CZ` to `uk-UA`, with `ru-RU`, `en-US`). Product removed the language picker. The app uses the OS-preferred locale as a hidden candidate (`use-composer-language.ts`).

### 3. How the panel works

**State model.** One `CaptureDraft` object in `use-capture-draft.ts`:

```ts
export enum CapturePhase { Idle = 'idle', Starting = 'starting', Recording = 'recording', Stopping = 'stopping' }
export enum TranscriptStatus { Working = 'working', Failed = 'failed', Complete = 'complete' }
// CaptureDraft: text, focused, settings, template, phase, preparing, saving,
// duration, provisional, recordingNotice, error, recordings: DraftRecording[]
```

- Each Recording has its own `TranscriptStatus`. More than one Recording can be in one Draft.
- `composer-presentation.ts` derives `expanded`, `recording`, `send`, `primaryDisabled`, `showClear`, `showSettings`, `showRecord`, `notice` from the state. No second state machine.
- A `generation` counter marks each capture attempt. Late results from an old attempt are discarded. A `current` ref holds the latest snapshot, so two taps before a render cannot both pass a guard.

**Partial (volatile) preview.**

- Native side: `AppleLiveTranscription` keeps `finalizedText`. Each result sends a snapshot plus a revision number:

```swift
if result.isFinal {
  finalizedText = appendTranscription(finalizedText, fragment: fragment)
  snapshot = finalizedText
} else {
  snapshot = appendTranscription(finalizedText, fragment: fragment)
}
revision += 1
onSnapshot(revision, snapshot)
```

- JS side drops stale revisions (`if (event.snapshot.revision <= revision) break`) and sets `draft.provisional`.
- `RecordingPreview` shows the provisional text in a separate scroll view, in a muted `provisional` text style. It auto-scrolls to the end only while the user is near the bottom (`follows` ref, 12 pt threshold).
- The provisional text never goes into the editable text. On Stop, the app transcribes the full audio file again (final pass). Then it inserts the final text at the caret. It never replaces a selection. It adds `\n\n` or a space as separator. Final passes run in order through one promise queue.
- Live setup runs beside the audio writer. If the locale model is not installed or fails, live text is silently skipped. Recording continues.

**Voice and text.** The text editor stays mounted during Recording and Settings, so the keyboard stays up. It is hidden from accessibility and touch while covered. The mic button is the secondary action. With an empty Draft, the primary button becomes Stop. With text, the mic slides to Stop. The user can type while a final pass runs ("Transcribing Recording… You can keep writing."). Send during Recording stops capture, waits for the final text, then submits once. Any edit cancels that pending Send.

**Permissions.** `getRecordingPermissionsAsync()`, then `requestRecordingPermissionsAsync()` from `expo-audio`. Denied gives the error "Allow microphone access in iPhone Settings to record audio." There is no link to Settings. `NSSpeechRecognitionUsageDescription` is set in `app.config.ts`. The code does not request speech authorization (the new `SpeechTranscriber` does not need it).

**Errors and interruptions.** Native events: `recording_interrupted`, `recording_resumed`, `recording_recovery_failed`, `recording_write_failed`, `recording_input_changed`, `media_services_reset`. They become one `recordingNotice` line. A failed stop keeps the typed text. Empty final text is a failure ("No speech was found."). A failed final pass never auto-submits and has no retry control.

**Feedback timing.** `composer-feedback.ts`: wait 350 ms before a progress message shows; once shown, keep it for 500 ms. This removes flicker on fast operations.

**Accessibility.** Buttons have `accessibilityRole='button'`, labels, and disabled state. Hidden planes use `accessibilityElementsHidden` and `importantForAccessibility='no-hide-descendants'`. The notice line is `accessibilityLiveRegion='polite'` (Android only; iOS needs an announcement). The provisional text has no live region and no VoiceOver announcement. Reduce Motion follows Reanimated defaults.

**Animation.** One `useDerivedValue(() => withSpring({...}))` drives the surface and toolbar together, with default spring physics. Keyboard frames come from `react-native-keyboard-controller` on the UI thread. The waveform has 41 bars. Native meter events (30 Hz) update a shared value with `samples.modify` in a worklet, so bars move without React renders. The timer re-renders only when the second changes. Liquid Glass via `GlassView` when available; a solid surface otherwise.

**Structured output ("intents").** There is no intent parser in the panel. The Draft carries a Template (`Quick Capture`, `ABC`, `Thought Record`). After a local save, the Server Analysis fills template fields with OpenAI Structured Output (`apps/worker/src/analysis/template.ts`, providers for OpenAI, Anthropic, OpenRouter). Server work needs a separate AI permission, frozen before Recording.

### 4. Reuse for Sort of Budget

Good to reuse:

1. The native module pattern: one Swift Expo module that owns the audio engine, writes the file, emits meter and snapshot events, and runs `SpeechAnalyzer` live and final passes. Sort of Budget can copy `AppleSpeechTranscription.swift` almost as is. Then drop the file writer if no audio is kept.
2. The rule "provisional text is display only; final text is authoritative and inserted at the caret". This fits money amounts: parse only final text.
3. Revision-numbered full snapshots (not deltas). JS keeps the highest revision. Simple and race-free.
4. Generation counter plus a synchronous `current` ref for all commands.
5. A pure `getPresentation(state)` function for layout, buttons, and accessibility.
6. The 350 ms reveal / 500 ms minimum feedback rule.
7. Waveform on a shared value with `modify`; keyboard-following spring with default physics.
8. Live text is optional. A missing locale model never blocks capture.
9. The Maestro state flows in `e2e/composer-states/` as a test checklist.

Unfinished or problematic:

1. Final transcription on `feat/v2` goes to the Server only (`createTranscriptionPlanV2`). The on-device final path exists (`transcribeFinal`) but is not used, because the language picker was removed. Sort of Budget would need its own on-device route and a locale rule.
2. `AppleLiveTranscription.convert` creates a new `AVAudioConverter` for each buffer. Create it once.
3. `appendTranscription` joins fragments with a space. This is wrong for languages without spaces. It is fine for Russian and English.
4. No VoiceOver announcement for provisional or final text. No "Open Settings" action after a denied permission.
5. No retry for a failed final pass.
6. No speech-to-intent step. Sort of Budget must add its own parser (rules first, or Foundation Models `@Generable` as a later option). Nothing to copy here.
7. `use-capture-draft.ts` is large (688 lines) and mixes Note save, Template, and audio file ownership. Sort of Budget needs a smaller controller.
8. Stack gap: CBT-Quest is on Expo SDK 57 / RN 0.86; Sort of Budget is on SDK 58 / RN 0.88. Check the Expo module API and `expo-glass-effect` versions before a copy.
9. The README says physical-device qualification of Apple transcription is still required.

## Uncertain or not confirmed

- Russian support of `SpeechTranscriber` (no published list).
- The device and model rules for on-device ru-RU dictation.
- Needle 3 text languages and its Russian accuracy; which Needle generation
  the "26m" figure describes; whether the iOS static library sends telemetry.
- The on-device Foundation Models context size on iOS 27 (4096 in the
  article, 8192 in a WWDC26 example).
- Core AI exported model sizes and download (not bundle) support.
- Gemma and SmolLM file sizes; MLC structured output.
