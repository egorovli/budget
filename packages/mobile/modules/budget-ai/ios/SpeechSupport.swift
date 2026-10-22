@preconcurrency import AVFoundation
import Foundation
@preconcurrency import Speech

// Speech recognition is on device only. The server path of SFSpeechRecognizer is never used:
// `requiresOnDeviceRecognition` is always true, and a locale without on-device support is
// reported as `unsupported`.

enum SpeechState: String, Sendable {
  case ready
  case needsDownload = "needs-download"
  case unsupported
  case unavailable
}

enum SpeechEngine: String, Sendable {
  case speechTranscriber = "speech-transcriber"
  case dictationTranscriber = "dictation-transcriber"
}

struct SpeechStatus: Sendable {
  let locale: String
  let state: SpeechState
  let engine: SpeechEngine?
}

/// The iOS 26 SpeechAnalyzer module that serves a locale. Holds the resolved (equivalent) locale.
enum AnalyzerRoute: Sendable {
  case speech(Locale)
  case dictation(Locale)

  var engine: SpeechEngine {
    switch self {
    case .speech: .speechTranscriber
    case .dictation: .dictationTranscriber
    }
  }

  /// A module with the same preset that listening uses, so asset checks match the live session.
  @available(iOS 26.0, *)
  func makeModule() -> any SpeechModule {
    switch self {
    case .speech(let locale):
      SpeechTranscriber(locale: locale, preset: .progressiveTranscription)
    case .dictation(let locale):
      DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    }
  }
}

/// How one locale is recognized on this device.
enum SpeechPlan: Sendable {
  case analyzer(AnalyzerRoute)
  /// SFSpeechRecognizer with `requiresOnDeviceRecognition = true` (iOS < 26, or no analyzer route).
  case legacy(Locale)
  case unsupported
}

enum SpeechSupport {
  typealias ProgressHandler = @Sendable (_ fraction: Double) -> Void

  static func plan(for identifier: String) async -> SpeechPlan {
    let requested = Locale(identifier: identifier)

    if #available(iOS 26.0, *) {
      if SpeechTranscriber.isAvailable,
        let locale = await SpeechTranscriber.supportedLocale(equivalentTo: requested)
      {
        return .analyzer(.speech(locale))
      }
      // DictationTranscriber covers the on-device dictation languages (for example ru-RU)
      // and older devices.
      if let locale = await DictationTranscriber.supportedLocale(equivalentTo: requested) {
        return .analyzer(.dictation(locale))
      }
    }

    guard let recognizer = SFSpeechRecognizer(locale: requested),
      recognizer.supportsOnDeviceRecognition
    else {
      return .unsupported
    }
    return .legacy(requested)
  }

  static func status(for identifier: String) async -> SpeechStatus {
    switch await plan(for: identifier) {
    case .unsupported:
      return SpeechStatus(locale: identifier, state: .unsupported, engine: nil)

    case .legacy(let locale):
      guard let recognizer = SFSpeechRecognizer(locale: locale),
        recognizer.supportsOnDeviceRecognition
      else {
        return SpeechStatus(locale: identifier, state: .unsupported, engine: nil)
      }
      return SpeechStatus(
        locale: identifier,
        state: recognizer.isAvailable ? .ready : .unavailable,
        engine: nil
      )

    case .analyzer(let route):
      guard #available(iOS 26.0, *) else {
        return SpeechStatus(locale: identifier, state: .unavailable, engine: nil)
      }
      return SpeechStatus(
        locale: identifier,
        state: await assetState(route),
        engine: route.engine
      )
    }
  }

  @available(iOS 26.0, *)
  static func assetState(_ route: AnalyzerRoute) async -> SpeechState {
    switch await AssetInventory.status(forModules: [route.makeModule()]) {
    case .installed:
      return .ready
    case .supported, .downloading:
      return .needsDownload
    case .unsupported:
      return .unsupported
    @unknown default:
      return .unavailable
    }
  }

  /// Downloads the system speech asset. Assets are owned and shared by the system.
  /// On iOS < 26 there is nothing to download; the current status is returned.
  static func download(
    _ identifier: String,
    onProgress: @escaping ProgressHandler
  ) async throws -> SpeechStatus {
    guard #available(iOS 26.0, *), case .analyzer(let route) = await plan(for: identifier) else {
      return await status(for: identifier)
    }

    do {
      if let request = try await AssetInventory.assetInstallationRequest(
        supporting: [route.makeModule()]
      ) {
        // AssetInstallationRequest conforms to ProgressReporting and Sendable.
        let poller = Task {
          var last = -1.0
          while !Task.isCancelled {
            let fraction = max(0, min(1, request.progress.fractionCompleted))
            if fraction != last {
              onProgress(fraction)
              last = fraction
            }
            try? await Task.sleep(for: .milliseconds(200))
          }
        }
        defer { poller.cancel() }
        try await request.downloadAndInstall()
        onProgress(1)
      }
    } catch {
      throw SpeechDownloadException(identifier).causedBy(error)
    }

    return await status(for: identifier)
  }
}

enum Permissions {
  static func requestMicrophone() async -> Bool {
    if #available(iOS 17.0, *) {
      return await AVAudioApplication.requestRecordPermission()
    }
    return await withCheckedContinuation { continuation in
      AVAudioSession.sharedInstance().requestRecordPermission { granted in
        continuation.resume(returning: granted)
      }
    }
  }

  /// Needed only for the SFSpeechRecognizer path.
  // UNVERIFIED: that SpeechAnalyzer with SpeechTranscriber / DictationTranscriber does not need
  // speech authorization (CBT-Quest shipped SpeechTranscriber without requesting it).
  static func requestSpeechRecognition() async -> Bool {
    switch SFSpeechRecognizer.authorizationStatus() {
    case .authorized:
      return true
    case .notDetermined:
      return await withCheckedContinuation { continuation in
        SFSpeechRecognizer.requestAuthorization { status in
          continuation.resume(returning: status == .authorized)
        }
      }
    default:
      return false
    }
  }
}
