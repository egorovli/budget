@preconcurrency import AVFoundation
import Foundation
@preconcurrency import Speech

/// Callbacks to JavaScript events.
struct ListeningEvents: Sendable {
  let transcript: @Sendable (_ text: String, _ finalText: String) -> Void
  let audioLevel: @Sendable (_ level: Double) -> Void
}

/// Owns all listening. Calls are serialized by the actor, so two taps cannot start two sessions.
actor SpeechController {
  private var session: ListeningSession?
  /// Final text of a session that an interruption stopped. The next stopListening returns it.
  private var interruptedText: String?
  /// Increases on each cancel, so a start that was cancelled while it awaited can detect it.
  private var generation = 0
  private var isStarting = false

  func start(locale: String, contextualStrings: [String], events: ListeningEvents) async throws {
    guard session == nil, !isStarting else {
      throw AlreadyListeningException()
    }
    isStarting = true
    defer { isStarting = false }
    interruptedText = nil
    let startGeneration = generation

    guard await Permissions.requestMicrophone() else {
      throw MicrophoneDeniedException()
    }

    let plan = await SpeechSupport.plan(for: locale)
    switch plan {
    case .unsupported:
      throw SpeechUnsupportedException(locale)

    case .legacy:
      guard await Permissions.requestSpeechRecognition() else {
        throw SpeechAuthorizationDeniedException()
      }

    case .analyzer(let route):
      guard #available(iOS 26.0, *) else {
        throw SpeechUnsupportedException(locale)
      }
      switch await SpeechSupport.assetState(route) {
      case .ready:
        break
      case .needsDownload:
        throw SpeechNotReadyException(locale)
      case .unsupported:
        throw SpeechUnsupportedException(locale)
      case .unavailable:
        throw SpeechUnavailableException(locale)
      }
    }

    let id = UUID()
    let newSession = ListeningSession(id: id, events: events) { [weak self] in
      Task { await self?.captureLost(sessionID: id) }
    }
    try await newSession.start(plan: plan, locale: locale, contextualStrings: contextualStrings)

    guard generation == startGeneration else {
      await newSession.cancel()
      throw ListeningCancelledException()
    }
    session = newSession
  }

  func stop() async throws -> String {
    guard let current = session else {
      if let text = interruptedText {
        interruptedText = nil
        return text
      }
      throw NotListeningException()
    }
    session = nil
    return await current.stop()
  }

  func cancel() async {
    generation += 1
    interruptedText = nil
    guard let current = session else { return }
    session = nil
    await current.cancel()
  }

  /// An interruption (call, Siri), a route change that reconfigures the engine, or a media
  /// services reset stops listening. The finalized text is kept for the next stopListening.
  private func captureLost(sessionID: UUID) async {
    guard let current = session, current.id == sessionID else { return }
    session = nil
    interruptedText = await current.stop()
  }
}

/// One microphone capture plus one recognizer. Used only from `SpeechController`; the audio tap
/// reads only immutable, thread-safe objects (`recognizer`, `meter`).
final class ListeningSession: @unchecked Sendable {
  let id: UUID

  private let engine = AVAudioEngine()
  private let events: ListeningEvents
  private let onCaptureLost: @Sendable () -> Void
  private var recognizer: (any LiveRecognizer)?
  private var observers: [NSObjectProtocol] = []

  init(id: UUID, events: ListeningEvents, onCaptureLost: @escaping @Sendable () -> Void) {
    self.id = id
    self.events = events
    self.onCaptureLost = onCaptureLost
  }

  func start(plan: SpeechPlan, locale: String, contextualStrings: [String]) async throws {
    do {
      try activateAudioSession()

      let inputNode = engine.inputNode
      let inputFormat = inputNode.outputFormat(forBus: 0)
      guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
        throw AudioSessionException("the microphone gives no usable audio format")
      }

      let transcript = TranscriptAccumulator(emit: events.transcript)
      let recognizer = try await makeRecognizer(
        plan: plan,
        locale: locale,
        inputFormat: inputFormat,
        contextualStrings: contextualStrings,
        transcript: transcript
      )
      self.recognizer = recognizer

      let meter = AudioLevelMeter(sampleRate: inputFormat.sampleRate, emit: events.audioLevel)
      inputNode.installTap(onBus: 0, bufferSize: 1_024, format: inputFormat) { buffer, _ in
        meter.process(buffer)
        recognizer.append(buffer)
      }

      engine.prepare()
      do {
        try engine.start()
      } catch {
        throw AudioSessionException("the audio engine did not start").causedBy(error)
      }
      observeCaptureLoss()
    } catch {
      stopCapture()
      await recognizer?.cancel()
      recognizer = nil
      deactivateAudioSession()
      throw error
    }
  }

  func stop() async -> String {
    stopCapture()
    let text = await recognizer?.finish() ?? ""
    recognizer = nil
    deactivateAudioSession()
    return text
  }

  func cancel() async {
    stopCapture()
    await recognizer?.cancel()
    recognizer = nil
    deactivateAudioSession()
  }

  // MARK: - Private

  private func makeRecognizer(
    plan: SpeechPlan,
    locale: String,
    inputFormat: AVAudioFormat,
    contextualStrings: [String],
    transcript: TranscriptAccumulator
  ) async throws -> any LiveRecognizer {
    switch plan {
    case .unsupported:
      throw SpeechUnsupportedException(locale)

    case .analyzer(let route):
      guard #available(iOS 26.0, *) else {
        throw SpeechUnsupportedException(locale)
      }
      do {
        return try await AnalyzerRecognizer.make(
          route: route,
          inputFormat: inputFormat,
          contextualStrings: contextualStrings,
          transcript: transcript
        )
      } catch let error as AudioSessionException {
        throw error
      } catch {
        throw SpeechUnavailableException(locale).causedBy(error)
      }

    case .legacy(let resolved):
      guard let recognizer = SFSpeechRecognizer(locale: resolved),
        recognizer.supportsOnDeviceRecognition
      else {
        throw SpeechUnsupportedException(locale)
      }
      guard recognizer.isAvailable else {
        throw SpeechUnavailableException(locale)
      }
      return LegacyRecognizer(
        recognizer: recognizer,
        contextualStrings: contextualStrings,
        transcript: transcript
      )
    }
  }

  private func activateAudioSession() throws {
    let session = AVAudioSession.sharedInstance()
    do {
      // Apple's speech sample uses .record + .measurement. allowBluetoothHFP keeps AirPods input.
      try session.setCategory(.record, mode: .measurement, options: [.duckOthers, .allowBluetoothHFP])
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      throw AudioSessionException("the audio session could not be activated").causedBy(error)
    }
  }

  private func deactivateAudioSession() {
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private func stopCapture() {
    removeObservers()
    engine.inputNode.removeTap(onBus: 0)
    if engine.isRunning {
      engine.stop()
    }
  }

  private func observeCaptureLoss() {
    let center = NotificationCenter.default
    let onCaptureLost = self.onCaptureLost

    observers.append(
      center.addObserver(
        forName: AVAudioSession.interruptionNotification,
        object: AVAudioSession.sharedInstance(),
        queue: nil
      ) { notification in
        guard let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          AVAudioSession.InterruptionType(rawValue: raw) == .began
        else { return }
        onCaptureLost()
      }
    )

    // The engine stops itself when the input route or format changes.
    observers.append(
      center.addObserver(
        forName: .AVAudioEngineConfigurationChange,
        object: engine,
        queue: nil
      ) { _ in
        onCaptureLost()
      }
    )

    observers.append(
      center.addObserver(
        forName: AVAudioSession.mediaServicesWereResetNotification,
        object: nil,
        queue: nil
      ) { _ in
        onCaptureLost()
      }
    )
  }

  private func removeObservers() {
    for observer in observers {
      NotificationCenter.default.removeObserver(observer)
    }
    observers.removeAll()
  }

  deinit {
    removeObservers()
  }
}

/// Emits the input level at most 20 times a second. Used only from the audio tap thread.
final class AudioLevelMeter: @unchecked Sendable {
  private let framesPerEmission: Int64
  private var framesSinceEmission: Int64 = 0
  private let emit: @Sendable (Double) -> Void

  init(sampleRate: Double, emit: @escaping @Sendable (Double) -> Void) {
    self.framesPerEmission = max(1, Int64(sampleRate / 20))
    self.emit = emit
  }

  func process(_ buffer: AVAudioPCMBuffer) {
    framesSinceEmission += Int64(buffer.frameLength)
    guard framesSinceEmission >= framesPerEmission else { return }
    framesSinceEmission = 0

    guard let samples = buffer.floatChannelData?[0], buffer.frameLength > 0 else { return }
    let count = Int(buffer.frameLength)
    var sumOfSquares: Float = 0
    for index in 0..<count {
      sumOfSquares += samples[index] * samples[index]
    }
    let rms = (sumOfSquares / Float(count)).squareRoot()
    // Raw speech RMS is about 0.01-0.1, too small for a meter. Map -60...0 dBFS to 0...1.
    let decibels = 20 * log10(max(rms, 1e-7))
    emit(Double(min(1, max(0, (decibels + 60) / 60))))
  }
}
