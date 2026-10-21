Pod::Spec.new do |s|
  s.name           = 'BudgetlyAI'
  s.version        = '1.0.0'
  s.summary        = 'On-device speech, Apple Foundation Models, and Needle for Budgetly'
  s.description    = 'Local Expo module: on-device speech recognition, Apple Foundation Models guided generation, and the Needle tool-call model. Nothing leaves the device.'
  s.author         = 'Budgetly'
  s.homepage       = 'https://github.com/egorovli/budgetly'
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
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }

  s.pod_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    # CocoaPods copies the static xcframework slice (with Headers/module.modulemap for
    # `module CNeedle`) to this directory before compiling.
    # UNVERIFIED: that Swift finds the CNeedle module map through this path (and HEADER_SEARCH_PATHS).
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_XCFRAMEWORKS_BUILD_DIR}/BudgetlyAI/Headers"'
  }
end
