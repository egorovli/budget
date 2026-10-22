Pod::Spec.new do |s|
  s.name           = 'BudgetAI'
  s.version        = '1.0.0'
  s.summary        = 'On-device speech, Apple Foundation Models, and Needle for Sort of Budget'
  s.description    = 'Local Expo module: on-device speech recognition, Apple Foundation Models guided generation, and the Needle tool-call model. Nothing leaves the device.'
  s.author         = 'Sort of Budget'
  s.homepage       = 'https://github.com/egorovli/budget'
  # ExpoModulesCore 58 requires iOS 16.4. iOS 26 APIs are guarded with #available.
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '6.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '*.swift'

  # Built by scripts/fetch-needle.sh (not committed). Without it the module still builds;
  # the Needle functions then reject with "Needle is not bundled".
  s.vendored_frameworks = 'Needle.xcframework'

  s.frameworks      = 'AVFoundation', 'Speech'
  # FoundationModels exists only on iOS 26+, so it must be weak-linked.
  s.weak_frameworks = 'FoundationModels'
  # libneedle.a is C++ inside.
  s.libraries       = 'c++'

  # libneedle.a has no x86_64 simulator slice; Apple Silicon simulators are arm64.
  # The `module CNeedle` map, written by scripts/fetch-needle.sh outside the xcframework.
  # A map inside the xcframework is found only after CocoaPods copies it, which can be after
  # Swift compiles; then `canImport(CNeedle)` is silently false. The app target needs the path
  # too: Swift loads the internal imports of a module without library evolution.
  cneedle = "$(inherited) \"#{File.join(__dir__, 'CNeedle')}\""

  s.user_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'SWIFT_INCLUDE_PATHS' => cneedle
  }

  s.pod_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'SWIFT_INCLUDE_PATHS' => cneedle
  }
end
