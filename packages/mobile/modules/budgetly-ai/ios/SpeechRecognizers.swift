@preconcurrency import AVFoundation
import Foundation
import os
@preconcurrency import Speech

/// Apple documents a limit of 100 contextual phrases across all tags.
let maximumContextualStrings = 100

/// Seconds to wait for the last result after the audio ends.
private let finalResultTimeout: Duration = .seconds(3)

/// One live recognizer fed from the microphone tap.
protocol LiveRecognizer: AnyObject, Sendable {
  /// Called on the audio tap thread, one buffer at a time.
  func append(_ buffer: AVAudioPCMBuffer)
  /// Ends the audio, waits for the last result, and returns the finalized text.
  func finish() async -> String
  func cancel() async
}

// MARK: - Transcript snapshots

/// Keeps finalized text and the volatile tail, and emits a full snapshot on each change.
/// The CBT-Quest snapshot pattern: text = finalized + volatile tail.
final class TranscriptAccumulator: Sendable {
  typealias Emit = @Sendable (_ text: String, _ finalText: String) -> Void

  private struct State: Sendable {
    var finalized = ""
    var volatile = ""
  }

  private let state = OSAllocatedUnfairLock(initialState: State())
  private let emit: Emit

  init(emit: @escaping Emit) {
    self.emit = emit
  }

  /// SpeechAnalyzer results: each result covers one audio range. A final result is the last
  /// result for its range; a volatile one replaces the previous volatile tail.
  func append(_ fragment: String, isFinal: Bool) {
    let snapshot = state.withLock { state -> (String, String) in
      if isFinal {
        state.finalized = joinTranscript(state.finalized, fragment)
        state.volatile = ""
      } else {
        state.volatile = fragment.trimmingCharacters(in: .whitespacesAndNewlines)
      }
      return (joinTranscript(state.finalized, state.volatile), state.finalized)
    }
    emit(snapshot.0, snapshot.1)
  }

  /// SFSpeechRecognizer results: each result holds the whole text of the session so far.
  func replace(_ whole: String, isFinal: Bool) {
    let snapshot = state.withLock { state -> (String, String) in
      let text = whole.trimmingCharacters(in: .whitespacesAndNewlines)
      if isFinal {
        state.finalized = text
        state.volatile = ""
      } else {
        state.volatile = text
      }
      return (joinTranscript(state.finalized, state.volatile), state.finalized)
    }
    emit(snapshot.0, snapshot.1)
  }

  /// Moves a remaining volatile tail into the finalized text (for example after a timeout)
  /// and returns the finalized text.
  func commit() -> String {
    let (text, changed) = state.withLock { state -> (String, Bool) in
      guard !state.volatile.isEmpty else { return (state.finalized, false) }
      state.finalized = joinTranscript(state.finalized, state.volatile)
      state.volatile = ""
      return (state.finalized, true)
    }
    if changed {
      emit(text, text)
    }
    return text
  }
}

/// Joins with a space. Correct for English, Russian, and Polish; wrong for languages
/// without spaces (not supported by Budgetly).
private func joinTranscript(_ existing: String, _ fragment: String) -> String {
  let normalized = fragment.trimmingCharacters(in: .whitespacesAndNewlines)
  guard !normalized.isEmpty else { return existing }
  guard !existing.isEmpty else { return normalized }
  return "\(existing) \(normalized)"
}

// MARK: - Small concurrency helpers

/// A signal that fires once. Waiting after it fired returns at once.
final class OneShotSignal: Sendable {
  private struct State: Sendable {
    var fired = false
    var waiters: [CheckedContinuation<Void, Never>] = []
  }

  private let state = OSAllocatedUnfairLock(initialState: State())

  func fire() {
    let waiters = state.withLock { state -> [CheckedContinuation<Void, Never>] in
      guard !state.fired else { return [] }
      state.fired = true
      let waiters = state.waiters
      state.waiters = []
      return waiters
    }
    for waiter in waiters {
      waiter.resume()
    }
  }

  func wait() async {
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      let resumeNow = state.withLock { state -> Bool in
        if state.fired { return true }
        state.waiters.append(continuation)
        return false
      }
      if resumeNow {
        continuation.resume()
      }
    }
  }

  /// Waits for the signal, but no longer than `timeout`.
  func wait(atMost timeout: Duration) async {
    let timer = Task { [self] in
      try? await Task.sleep(for: timeout)
      fire()
    }
    await wait()
    timer.cancel()
  }
}

// MARK: - Audio conversion

/// Converts tap buffers to the analyzer format. Created once per listening session, so the
/// sample-rate converter keeps its state between buffers (CBT-Quest created one per buffer).
/// Used only from the audio tap thread.
final class BufferConverter: @unchecked Sendable {
  private let converter: AVAudioConverter
  private let outputFormat: AVAudioFormat
  private let ratio: Double

  init?(from inputFormat: AVAudioFormat, to outputFormat: AVAudioFormat) {
    guard let converter = AVAudioConverter(from: inputFormat, to: outputFormat) else {
      return nil
    }
    self.converter = converter
    self.outputFormat = outputFormat
    self.ratio = outputFormat.sampleRate / inputFormat.sampleRate
  }

  func convert(_ buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
    let capacity = AVAudioFrameCount((Double(buffer.frameLength) * ratio).rounded(.up)) + 64
    guard let output = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: capacity) else {
      return nil
    }

    var suppliedInput = false
    var conversionError: NSError?
    let status = converter.convert(to: output, error: &conversionError) { _, inputStatus in
      if suppliedInput {
        inputStatus.pointee = .noDataNow
        return nil
      }
      suppliedInput = true
      inputStatus.pointee = .haveData
      return buffer
    }

    guard status != .error, conversionError == nil, output.frameLength > 0 else {
      return nil
    }
    return output
  }
}

// MARK: - SpeechAnalyzer (iOS 26)

@available(iOS 26.0, *)
final class AnalyzerRecognizer: LiveRecognizer, @unchecked Sendable {
  private let analyzer: SpeechAnalyzer
  private let input: AsyncStream<AnalyzerInput>.Continuation
  /// nil when the tap format already matches the analyzer format.
  private let converter: BufferConverter?
  private let resultTask: Task<Void, Never>
  private let resultsEnded: OneShotSignal
  private let transcript: TranscriptAccumulator

  private init(
    analyzer: SpeechAnalyzer,
    input: AsyncStream<AnalyzerInput>.Continuation,
    converter: BufferConverter?,
    resultTask: Task<Void, Never>,
    resultsEnded: OneShotSignal,
    transcript: TranscriptAccumulator
  ) {
    self.analyzer = analyzer
    self.input = input
    self.converter = converter
    self.resultTask = resultTask
    self.resultsEnded = resultsEnded
    self.transcript = transcript
  }

  static func make(
    route: AnalyzerRoute,
    inputFormat: AVAudioFormat,
    contextualStrings: [String],
    transcript: TranscriptAccumulator
  ) async throws -> AnalyzerRecognizer {
    let resultsEnded = OneShotSignal()
    let module: any SpeechModule
    let resultTask: Task<Void, Never>

    switch route {
    case .speech(let locale):
      let transcriber = SpeechTranscriber(locale: locale, preset: .progressiveTranscription)
      module = transcriber
      resultTask = Task {
        defer { resultsEnded.fire() }
        do {
          for try await result in transcriber.results {
            transcript.append(String(result.text.characters), isFinal: result.isFinal)
          }
        } catch {
          // The session reports failure through stop/cancel; a result error only ends results.
        }
      }

    case .dictation(let locale):
      let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
      module = transcriber
      resultTask = Task {
        defer { resultsEnded.fire() }
        do {
          for try await result in transcriber.results {
            transcript.append(String(result.text.characters), isFinal: result.isFinal)
          }
        } catch {
          // See above.
        }
      }
    }

    do {
      guard
        let analyzerFormat = await SpeechAnalyzer.bestAvailableAudioFormat(
          compatibleWith: [module],
          considering: inputFormat
        )
      else {
        throw AudioSessionException("the speech model accepts no audio format")
      }

      let analyzer = SpeechAnalyzer(modules: [module])

      if !contextualStrings.isEmpty {
        // Apple documents contextual strings for DictationTranscriber. For SpeechTranscriber
        // the context is set too; it is harmless if the module ignores it.
        // UNVERIFIED: whether SpeechTranscriber uses AnalysisContext.contextualStrings.
        let context = AnalysisContext()
        context.contextualStrings[.general] = Array(contextualStrings.prefix(maximumContextualStrings))
        try await analyzer.setContext(context)
      }

      let converter: BufferConverter?
      if inputFormat == analyzerFormat {
        converter = nil
      } else {
        guard let made = BufferConverter(from: inputFormat, to: analyzerFormat) else {
          throw AudioSessionException("cannot convert microphone audio to the speech model format")
        }
        converter = made
      }

      try await analyzer.prepareToAnalyze(in: analyzerFormat)
      let (stream, continuation) = AsyncStream<AnalyzerInput>.makeStream()
      try await analyzer.start(inputSequence: stream)

      return AnalyzerRecognizer(
        analyzer: analyzer,
        input: continuation,
        converter: converter,
        resultTask: resultTask,
        resultsEnded: resultsEnded,
        transcript: transcript
      )
    } catch {
      resultTask.cancel()
      throw error
    }
  }

  func append(_ buffer: AVAudioPCMBuffer) {
    if let converter {
      guard let converted = converter.convert(buffer) else { return }
      input.yield(AnalyzerInput(buffer: converted))
    } else {
      input.yield(AnalyzerInput(buffer: buffer))
    }
  }

  func finish() async -> String {
    input.finish()
    do {
      // Finalizes volatile results, then ends the results sequences of the modules.
      try await analyzer.finalizeAndFinishThroughEndOfInput()
    } catch {
      await analyzer.cancelAndFinishNow()
    }
    await resultsEnded.wait(atMost: finalResultTimeout)
    resultTask.cancel()
    return transcript.commit()
  }

  func cancel() async {
    input.finish()
    await analyzer.cancelAndFinishNow()
    resultTask.cancel()
  }
}

// MARK: - SFSpeechRecognizer (iOS < 26)

final class LegacyRecognizer: LiveRecognizer, @unchecked Sendable {
  private let request = SFSpeechAudioBufferRecognitionRequest()
  private let transcript: TranscriptAccumulator
  private let done = OneShotSignal()
  /// Set once in init; read later from the controller only.
  private var task: SFSpeechRecognitionTask?

  init(recognizer: SFSpeechRecognizer, contextualStrings: [String], transcript: TranscriptAccumulator) {
    self.transcript = transcript

    // Never use the server.
    request.requiresOnDeviceRecognition = true
    request.shouldReportPartialResults = true
    request.taskHint = .dictation
    request.addsPunctuation = true
    request.contextualStrings = Array(contextualStrings.prefix(maximumContextualStrings))

    task = recognizer.recognitionTask(with: request) { [weak self] result, error in
      self?.handle(result: result, error: error)
    }
  }

  private func handle(result: SFSpeechRecognitionResult?, error: (any Error)?) {
    if let result {
      transcript.replace(result.bestTranscription.formattedString, isFinal: result.isFinal)
      if result.isFinal {
        done.fire()
      }
    }
    if error != nil {
      // "No speech detected" also arrives as an error. The text so far is kept.
      done.fire()
    }
  }

  func append(_ buffer: AVAudioPCMBuffer) {
    request.append(buffer)
  }

  func finish() async -> String {
    request.endAudio()
    await done.wait(atMost: finalResultTimeout)
    task?.cancel()
    return transcript.commit()
  }

  func cancel() async {
    task?.cancel()
    request.endAudio()
    done.fire()
  }
}
