import ExpoModulesCore
import Foundation
import os

private let onTranscript = "onTranscript"
private let onSpeechDownload = "onSpeechDownload"
private let onAudioLevel = "onAudioLevel"

struct SpeechStatusRecord: Record {
  @Field var locale: String = ""
  @Field var state: String = SpeechState.unavailable.rawValue
  @Field var engine: String? = nil

  init() {}

  init(_ status: SpeechStatus) {
    locale = status.locale
    state = status.state.rawValue
    engine = status.engine?.rawValue
  }
}

struct AppleModelStatusRecord: Record {
  @Field var available: Bool = false
  @Field var reason: String? = nil

  init() {}

  init(_ status: AppleModelStatusValue) {
    available = status.available
    reason = status.reason
  }
}

// `@unchecked Sendable`: the concurrent AsyncFunction closures capture the module. Its state is
// an actor (`speech`), a lock (`revision`), and `needle`, which is used only on its serial queue.
public final class BudgetAIModule: Module, @unchecked Sendable {
  private let speech = SpeechController()
  private let needle = NeedleRuntime()
  /// Never resets, so revisions increase across listening sessions too.
  private let revision = OSAllocatedUnfairLock(initialState: 0)

  public func definition() -> ModuleDefinition {
    Name("BudgetAI")

    Events(onTranscript, onSpeechDownload, onAudioLevel)

    // MARK: Speech

    AsyncFunction("getSpeechStatus") { (locales: [String]) async -> [SpeechStatusRecord] in
      var statuses: [SpeechStatusRecord] = []
      for locale in locales {
        statuses.append(SpeechStatusRecord(await SpeechSupport.status(for: locale)))
      }
      return statuses
    }

    AsyncFunction("downloadSpeech") { (locale: String) async throws -> SpeechStatusRecord in
      let status = try await SpeechSupport.download(locale) { [weak self] fraction in
        self?.sendEvent(onSpeechDownload, ["locale": locale, "fraction": fraction])
      }
      return SpeechStatusRecord(status)
    }

    AsyncFunction("startListening") { (locale: String, contextualStrings: [String]) async throws in
      try await self.speech.start(
        locale: locale,
        contextualStrings: contextualStrings,
        events: self.listeningEvents()
      )
    }

    AsyncFunction("stopListening") { () async throws -> String in
      try await self.speech.stop()
    }

    AsyncFunction("cancelListening") { () async in
      await self.speech.cancel()
    }

    // MARK: Apple Foundation Models

    AsyncFunction("getAppleModelStatus") { () -> AppleModelStatusRecord in
      AppleModelStatusRecord(AppleModel.status())
    }

    AsyncFunction("interpretWithAppleModel") {
      (instructions: String, toolsJson: String, text: String) async throws -> String in
      try await AppleModel.interpret(instructions: instructions, toolsJson: toolsJson, text: text)
    }

    // MARK: Needle (serialized on one queue, off the main thread)

    AsyncFunction("needleLoad") { (path: String) throws in
      try self.needle.load(path: path)
    }.runOnQueue(NeedleRuntime.queue)

    AsyncFunction("needleComplete") { (system: String, toolsJson: String, text: String) throws -> String in
      try self.needle.complete(system: system, toolsJson: toolsJson, text: text)
    }.runOnQueue(NeedleRuntime.queue)

    AsyncFunction("needleUnload") { () in
      self.needle.unload()
    }.runOnQueue(NeedleRuntime.queue)

    // MARK: Files

    AsyncFunction("excludeFromBackup") { (path: String) throws in
      try BackupExclusion.exclude(path: path)
    }

    OnDestroy {
      let speech = self.speech
      Task {
        await speech.cancel()
      }
    }
  }

  private func listeningEvents() -> ListeningEvents {
    // UNVERIFIED: that sendEvent is safe to call from the audio tap thread and from result
    // tasks in SDK 58 (CBT-Quest did this on SDK 57).
    ListeningEvents(
      transcript: { [weak self] text, finalText in
        guard let self else { return }
        let revision = self.revision.withLock { value -> Int in
          value += 1
          return value
        }
        self.sendEvent(onTranscript, ["revision": revision, "text": text, "finalText": finalText])
      },
      audioLevel: { [weak self] level in
        self?.sendEvent(onAudioLevel, ["level": level])
      }
    )
  }
}
