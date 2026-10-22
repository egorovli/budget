import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

// Only the on-device SystemLanguageModel is used. PrivateCloudComputeLanguageModel sends the
// prompt off the device and must never be used here.

struct AppleModelStatusValue: Sendable {
  let available: Bool
  let reason: String?
}

enum AppleModel {
  static func status() -> AppleModelStatusValue {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      return AppleModelInterpreter.status()
    }
    #endif
    return AppleModelStatusValue(available: false, reason: "unsupportedOS")
  }

  static func interpret(instructions: String, toolsJson: String, text: String) async throws -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      return try await AppleModelInterpreter.run(
        instructions: instructions,
        toolsJson: toolsJson,
        text: text
      )
    }
    #endif
    throw AppleModelUnavailableException("unsupportedOS")
  }
}

// MARK: - Tool list (OpenAI function shape)

struct ToolParameter: Sendable {
  let name: String
  let description: String?
  /// JSON Schema type: string, number, integer, boolean.
  let type: String
  /// Closed set of string values (`enum`). Empty means free text.
  let choices: [String]
  let isRequired: Bool
}

struct ToolSpec: Sendable {
  let name: String
  let description: String
  let parameters: [ToolParameter]
}

enum ToolCatalog {
  /// The discriminator property of each tool object in the schema. Tools use `name` as an
  /// argument (add_account, add_reserve), so the discriminator is `tool`.
  static let discriminator = "tool"

  static func parse(_ json: String) throws -> [ToolSpec] {
    guard let data = json.data(using: .utf8),
      let entries = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]]
    else {
      throw InvalidToolsJsonException("expected a JSON array of tool objects")
    }

    var seenNames = Set<String>()
    return try entries.map { entry in
      // Accept `{ type: "function", function: {...} }` and a bare `{ name, parameters }`.
      let function = (entry["function"] as? [String: Any]) ?? entry
      guard let name = function["name"] as? String, !name.isEmpty else {
        throw InvalidToolsJsonException("a tool has no name")
      }
      guard seenNames.insert(name).inserted else {
        throw InvalidToolsJsonException("tool '\(name)' appears twice")
      }

      let schema = function["parameters"] as? [String: Any] ?? [:]
      let properties = schema["properties"] as? [String: Any] ?? [:]
      let required = Set(schema["required"] as? [String] ?? [])

      let parameters = try properties.map { key, value -> ToolParameter in
        guard key != discriminator else {
          throw InvalidToolsJsonException("tool '\(name)' has a reserved parameter name '\(key)'")
        }
        guard let property = value as? [String: Any] else {
          throw InvalidToolsJsonException("parameter '\(key)' of tool '\(name)' is not an object")
        }
        var seenChoices = Set<String>()
        let choices = (property["enum"] as? [Any] ?? [])
          .compactMap { $0 as? String }
          .filter { seenChoices.insert($0).inserted }
        return ToolParameter(
          name: key,
          description: property["description"] as? String,
          type: property["type"] as? String ?? "string",
          choices: choices,
          isRequired: required.contains(key)
        )
      }
      // JSONSerialization does not keep key order. Use a stable order: required first.
      .sorted { ($0.isRequired ? 0 : 1, $0.name) < ($1.isRequired ? 0 : 1, $1.name) }

      return ToolSpec(
        name: name,
        description: function["description"] as? String ?? "",
        parameters: parameters
      )
    }
  }
}

#if canImport(FoundationModels)

// MARK: - Guided generation

/// Schema shape (per tool, a discriminated union):
///
///     ToolCall = anyOf(
///       add_expense { tool: "add_expense", amount: Double, account: anyOf(<Account names>)?, ... },
///       transfer    { tool: "transfer", ... },
///       ...,
///       no_matching_tool { tool: "no_matching_tool" }
///     )
///
/// Each tool object has only its own arguments; string arguments with `enum` are anyOf choices,
/// so the model cannot invent an Account, Reserve, or Currency. `no_matching_tool` gives the
/// empty result.
@available(iOS 26.0, *)
enum AppleModelInterpreter {
  static let noToolName = "no_matching_tool"

  static func status() -> AppleModelStatusValue {
    let model = SystemLanguageModel.default
    switch model.availability {
    case .available:
      // UNVERIFIED: Locale.current follows the app's localizations, not only the device language.
      guard model.supportsLocale(Locale.current) else {
        return AppleModelStatusValue(available: false, reason: "unsupportedLanguage")
      }
      return AppleModelStatusValue(available: true, reason: nil)
    case .unavailable(let reason):
      switch reason {
      case .deviceNotEligible:
        return AppleModelStatusValue(available: false, reason: "deviceNotEligible")
      case .appleIntelligenceNotEnabled:
        return AppleModelStatusValue(available: false, reason: "appleIntelligenceNotEnabled")
      case .modelNotReady:
        return AppleModelStatusValue(available: false, reason: "modelNotReady")
      @unknown default:
        return AppleModelStatusValue(available: false, reason: "unavailable")
      }
    }
  }

  static func run(instructions: String, toolsJson: String, text: String) async throws -> String {
    if case .unavailable = SystemLanguageModel.default.availability {
      throw AppleModelUnavailableException(status().reason ?? "unavailable")
    }

    let tools = try ToolCatalog.parse(toolsJson)
    guard !tools.contains(where: { $0.name == noToolName }) else {
      throw InvalidToolsJsonException("'\(noToolName)' is a reserved tool name")
    }

    let schema: GenerationSchema
    do {
      schema = try makeSchema(tools)
    } catch {
      throw InvalidToolsJsonException("the tools do not form a valid generation schema").causedBy(error)
    }

    let session = LanguageModelSession(instructions: instructions)
    let content: GeneratedContent
    do {
      let response = try await session.respond(
        to: text,
        schema: schema,
        options: GenerationOptions(samplingMode: .greedy)
      )
      content = response.content
    } catch let error as LanguageModelSession.GenerationError {
      throw AppleModelGenerationException(describe(error)).causedBy(error)
    } catch {
      throw AppleModelGenerationException("unexpected error").causedBy(error)
    }

    return try encode(content, tools: tools)
  }

  static func makeSchema(_ tools: [ToolSpec]) throws -> GenerationSchema {
    var choices = tools.map(toolSchema)
    choices.append(
      DynamicGenerationSchema(
        name: noToolName,
        description: "Use when no tool fits the request.",
        properties: [discriminatorProperty(noToolName)]
      )
    )
    let root = DynamicGenerationSchema(
      name: "ToolCall",
      description: "The one tool call that does what the user asked, or no_matching_tool.",
      anyOf: choices
    )
    return try GenerationSchema(root: root, dependencies: [])
  }

  private static func discriminatorProperty(_ toolName: String) -> DynamicGenerationSchema.Property {
    DynamicGenerationSchema.Property(
      name: ToolCatalog.discriminator,
      description: "The tool name",
      schema: DynamicGenerationSchema(type: String.self, guides: [.constant(toolName)]),
      isOptional: false
    )
  }

  private static func toolSchema(_ tool: ToolSpec) -> DynamicGenerationSchema {
    var properties = [discriminatorProperty(tool.name)]
    for parameter in tool.parameters {
      properties.append(
        DynamicGenerationSchema.Property(
          name: parameter.name,
          description: parameter.description,
          schema: parameterSchema(parameter, toolName: tool.name),
          isOptional: !parameter.isRequired
        )
      )
    }
    return DynamicGenerationSchema(
      name: tool.name,
      description: tool.description,
      properties: properties
    )
  }

  private static func parameterSchema(_ parameter: ToolParameter, toolName: String) -> DynamicGenerationSchema {
    switch parameter.type {
    case "number":
      return DynamicGenerationSchema(type: Double.self)
    case "integer":
      return DynamicGenerationSchema(type: Int.self)
    case "boolean":
      return DynamicGenerationSchema(type: Bool.self)
    default:
      guard !parameter.choices.isEmpty else {
        return DynamicGenerationSchema(type: String.self)
      }
      return DynamicGenerationSchema(
        name: "\(toolName)_\(parameter.name)",
        description: parameter.description,
        anyOf: parameter.choices
      )
    }
  }

  /// Converts the generated union to `[{"name": ..., "arguments": {...}}]`, or `[]`.
  static func encode(_ content: GeneratedContent, tools: [ToolSpec]) throws -> String {
    var calls: [[String: Any]] = []

    if case .structure(let properties, let orderedKeys) = content.kind,
      case .string(let name)? = properties[ToolCatalog.discriminator]?.kind,
      name != noToolName,
      tools.contains(where: { $0.name == name })
    {
      var arguments: [String: Any] = [:]
      for key in orderedKeys where key != ToolCatalog.discriminator {
        if let value = properties[key].flatMap(jsonValue) {
          arguments[key] = value
        }
      }
      calls.append(["name": name, "arguments": arguments])
    }

    let data = try JSONSerialization.data(withJSONObject: calls, options: [.withoutEscapingSlashes])
    return String(decoding: data, as: UTF8.self)
  }

  private static func jsonValue(_ content: GeneratedContent) -> Any? {
    switch content.kind {
    case .null:
      return nil
    case .bool(let value):
      return value
    case .number(let value):
      return value
    case .string(let value):
      return value
    case .array(let items):
      return items.compactMap(jsonValue)
    case .structure(let properties, _):
      return properties.compactMapValues(jsonValue)
    @unknown default:
      return nil
    }
  }

  private static func describe(_ error: LanguageModelSession.GenerationError) -> String {
    switch error {
    case .unsupportedLanguageOrLocale:
      return "the model does not support the language of this text"
    case .exceededContextWindowSize:
      return "the instructions, tools, and text exceed the context window"
    case .guardrailViolation:
      return "the safety guardrails blocked the request"
    case .refusal:
      return "the model refused the request"
    case .assetsUnavailable:
      return "the model assets are not available now"
    case .rateLimited:
      return "the system rate-limited the request"
    case .concurrentRequests:
      return "another request is running in this session"
    case .decodingFailure:
      return "the model output did not match the schema"
    case .unsupportedGuide:
      return "the schema uses a guide that the model does not support"
    @unknown default:
      return error.localizedDescription
    }
  }
}

#endif
