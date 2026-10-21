import ExpoModulesCore

// All errors that reach JavaScript. `reason` is the message; `causedBy(_:)` appends the
// underlying system error.

final class MicrophoneDeniedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Microphone access is denied. Allow it in Settings > Privacy & Security > Microphone."
  }
}

final class SpeechAuthorizationDeniedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Speech recognition access is denied. Allow it in Settings > Privacy & Security > Speech Recognition."
  }
}

final class SpeechUnsupportedException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "On-device speech recognition is not supported for '\(param)' on this device"
  }
}

final class SpeechNotReadyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "The speech model for '\(param)' is not installed. Call downloadSpeech first."
  }
}

final class SpeechUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Speech recognition for '\(param)' is not available now"
  }
}

final class SpeechDownloadException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Could not download the speech model for '\(param)'"
  }
}

final class AlreadyListeningException: Exception, @unchecked Sendable {
  override var reason: String {
    "Listening is already in progress"
  }
}

final class NotListeningException: Exception, @unchecked Sendable {
  override var reason: String {
    "Listening is not in progress"
  }
}

final class ListeningCancelledException: Exception, @unchecked Sendable {
  override var reason: String {
    "Listening was cancelled before it started"
  }
}

final class AudioSessionException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Could not start the microphone: \(param)"
  }
}

final class AppleModelUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "The Apple Foundation Model is not available: \(param)"
  }
}

final class InvalidToolsJsonException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Invalid tools JSON: \(param)"
  }
}

final class AppleModelGenerationException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "The Apple Foundation Model failed: \(param)"
  }
}

final class NeedleNotBundledException: Exception, @unchecked Sendable {
  override var reason: String {
    "Needle is not bundled. Run modules/budgetly-ai/scripts/fetch-needle.sh and rebuild the app."
  }
}

final class NeedleUnsupportedOSException: Exception, @unchecked Sendable {
  override var reason: String {
    "Needle needs iOS 26.2 or later (the vendor library is built for iOS 26.2)"
  }
}

final class NeedleNotLoadedException: Exception, @unchecked Sendable {
  override var reason: String {
    "No Needle text model is loaded. Call needleLoad first."
  }
}

final class NeedleLoadException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Could not load the Needle model: \(param)"
  }
}

final class NeedleCompleteException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Needle failed: \(param)"
  }
}

final class FileNotFoundException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "File not found: \(param)"
  }
}

final class ExcludeFromBackupException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Could not exclude from backup: \(param)"
  }
}
