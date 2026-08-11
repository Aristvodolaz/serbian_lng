import SwiftUI

/// Type scale of the design system: a serif display face for Serbian text, the
/// system sans for interface copy, tabular mono for numbers.
///
/// Everything is expressed relative to a text style so Dynamic Type keeps
/// working.
extension Font {
    static let recWordmark = Font.system(size: 52, weight: .semibold, design: .serif)
    static let recWordmarkLatin = Font.system(size: 20, weight: .medium, design: .serif)

    static let recDisplay = Font.system(.title, design: .serif).weight(.semibold)
    static let recDisplaySmall = Font.system(.title3, design: .serif).weight(.semibold)
    static let recSentence = Font.system(.title, design: .serif)
    static let recWord = Font.system(size: 40, weight: .semibold, design: .serif)

    static let recBody = Font.system(.body)
    static let recCallout = Font.system(.callout)
    static let recCalloutStrong = Font.system(.callout).weight(.semibold)
    static let recFootnote = Font.system(.footnote)
    static let recCaption = Font.system(.caption)

    /// Uppercase eyebrow labels ("ПРЕВЕДИТЕ РЕЧЕНИЦУ", stat captions).
    static let recEyebrow = Font.system(.caption2).weight(.bold)
    static let recButton = Font.system(.headline)

    static let recMono = Font.system(.title3, design: .monospaced).weight(.semibold).monospacedDigit()
    static let recMonoSmall = Font.system(.caption, design: .monospaced).monospacedDigit()
}

/// Spacing, radii and hit targets. iOS values from the Apple HIG side of the
/// design spec — safe-area insets are read at runtime, never hard-coded.
enum Metrics {
    static let screenPadding: CGFloat = 20
    static let cardCorner: CGFloat = 14
    static let largeCorner: CGFloat = 18
    static let minimumTapTarget: CGFloat = 44

    static let tight: CGFloat = 8
    static let regular: CGFloat = 16
    static let loose: CGFloat = 24
}
