import Foundation
#if canImport(CNeedle)
internal import CNeedle
#endif

/// Needle 3 (Cactus Compute, Apache-2.0) through its C API.
///
/// The C API keeps one process-global model and is not thread-safe. Every call runs on
/// `NeedleRuntime.queue` (serial, off the main thread); the module registers the Needle
/// functions with `.runOnQueue(NeedleRuntime.queue)`.
///
/// Telemetry: `NEEDLE_TELEMETRY=0` and `DO_NOT_TRACK=1` are set before the load. The iOS static
/// library at the pinned revision imports no network or `getenv` symbols (checked with `nm -u`),
/// so it seems to have no telemetry at all; verify with a network trace on a device.
final class NeedleRuntime: @unchecked Sendable {
  static let queue = DispatchQueue(label: "io.egorov.budgetly.needle", qos: .userInitiated)

  private static let outputCapacity = 16_384
  private static let maxNewTokens: Int32 = 256

  /// The model bytes stay allocated for the process lifetime of the model.
  /// UNVERIFIED: whether needle_load copies the bytes. If it keeps the pointer, freeing would
  /// be a use-after-free, so the buffer is freed only when a new model replaces it.
  private var modelBuffer: UnsafeMutableRawBufferPointer?

  func load(path: String) throws {
    dispatchPrecondition(condition: .onQueue(Self.queue))
    #if canImport(CNeedle)
    try ensureSupportedOS()

    let url = fileURL(from: path)
    let data: Data
    do {
      data = try Data(contentsOf: url)
    } catch {
      throw NeedleLoadException("cannot read \(url.lastPathComponent)").causedBy(error)
    }
    guard !data.isEmpty else {
      throw NeedleLoadException("\(url.lastPathComponent) is empty")
    }

    setenv("NEEDLE_TELEMETRY", "0", 1)
    setenv("DO_NOT_TRACK", "1", 1)

    let buffer = UnsafeMutableRawBufferPointer.allocate(byteCount: data.count, alignment: 64)
    data.copyBytes(to: buffer)
    let bytes = buffer.bindMemory(to: UInt8.self)

    let result = needle_load(bytes.baseAddress, UInt64(bytes.count))
    guard result >= 0 else {
      let message = Self.lastError()
      buffer.deallocate()
      throw NeedleLoadException(message)
    }

    modelBuffer?.deallocate()
    modelBuffer = buffer
    #else
    throw NeedleNotBundledException()
    #endif
  }

  func complete(system: String, toolsJson: String, text: String) throws -> String {
    dispatchPrecondition(condition: .onQueue(Self.queue))
    #if canImport(CNeedle)
    try ensureSupportedOS()
    guard needle_models() & NEEDLE_TEXT != 0 else {
      throw NeedleNotLoadedException()
    }

    needle_reset()
    let initResult = system.withCString { systemPointer in
      toolsJson.withCString { toolsPointer in
        needle_init(systemPointer, toolsPointer, nil)
      }
    }
    guard initResult >= 0 else {
      throw NeedleCompleteException("needle_init: \(Self.lastError())")
    }

    // One extra byte keeps the output null-terminated even when Needle fills the capacity.
    var output = [CChar](repeating: 0, count: Self.outputCapacity + 1)
    let result = text.withCString { inputPointer in
      output.withUnsafeMutableBufferPointer { outputBuffer in
        needle_complete(
          inputPointer,
          nil,
          0,
          Self.maxNewTokens,
          outputBuffer.baseAddress,
          Int32(Self.outputCapacity)
        )
      }
    }
    guard result >= 0 else {
      throw NeedleCompleteException("needle_complete: \(Self.lastError())")
    }

    return output.withUnsafeBufferPointer { String(cString: $0.baseAddress!) }
    #else
    throw NeedleNotBundledException()
    #endif
  }

  /// The C API has no unload. This only resets the conversation state; the model stays in memory
  /// until the process ends or another needleLoad replaces it.
  func unload() {
    dispatchPrecondition(condition: .onQueue(Self.queue))
    #if canImport(CNeedle)
    needle_reset()
    #endif
  }

  #if canImport(CNeedle)
  /// libneedle.a at the pinned revision is built with minos iOS 26.2 (LC_BUILD_VERSION).
  private func ensureSupportedOS() throws {
    guard #available(iOS 26.2, *) else {
      throw NeedleUnsupportedOSException()
    }
  }

  private static func lastError() -> String {
    guard let pointer = needle_last_error() else { return "unknown error" }
    let message = String(cString: pointer)
    return message.isEmpty ? "unknown error" : message
  }
  #endif
}

/// Accepts a plain path or a `file://` URI (Expo FileSystem gives URIs).
func fileURL(from path: String) -> URL {
  if let url = URL(string: path), url.isFileURL {
    return url
  }
  return URL(fileURLWithPath: path)
}

enum BackupExclusion {
  static func exclude(path: String) throws {
    var url = fileURL(from: path)
    guard FileManager.default.fileExists(atPath: url.path(percentEncoded: false)) else {
      throw FileNotFoundException(path)
    }
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    do {
      try url.setResourceValues(values)
    } catch {
      throw ExcludeFromBackupException(path).causedBy(error)
    }
  }
}
