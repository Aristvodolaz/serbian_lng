import SwiftUI
import UIKit

/// Colour tokens of the РЕЧ · REČ design system.
///
/// Every token carries an explicit light and dark value instead of deriving one
/// from the other, so both themes stay deliberate.
enum Palette {
    static let ground = Color(light: 0xEDE7DA, dark: 0x161A25)
    static let surface = Color(light: 0xFBF8F1, dark: 0x1D2233)
    static let surfaceRaised = Color(light: 0xFFFFFF, dark: 0x242A3F)

    static let ink = Color(light: 0x211A16, dark: 0xEEE8DB)
    static let inkSoft = Color(light: 0x6B5D50, dark: 0xAFA595)

    /// Navigation and primary actions.
    static let indigo = Color(light: 0x223A5E, dark: 0x8CA2CE)
    static let indigoSoft = Color(light: 0x3A5580, dark: 0x5E76A8)
    /// Latin script and accents.
    static let oxblood = Color(light: 0x7C2530, dark: 0xD68089)
    /// Streak, XP and achievements.
    static let ochre = Color(light: 0xB9832A, dark: 0xE2B563)
    /// Correct answers and completed lessons.
    static let good = Color(light: 0x3F7D4F, dark: 0x74C48A)

    static let thread = Color(light: 0xC9BFA8, dark: 0x3A4258)
    static let line = Color(light: 0x211A16, lightOpacity: 0.13, dark: 0xEEE8DB, darkOpacity: 0.14)

    /// Text and glyphs placed on top of `indigo`.
    static let onIndigo = Color(hex: 0xF6F1E3)

    static let shadow = Color(light: 0x211A16, lightOpacity: 0.28, dark: 0x000000, darkOpacity: 0.55)
}

/// The onboarding hero is always dark indigo, so its palette is fixed rather
/// than theme-dependent.
enum HeroPalette {
    static let wordmark = Color(hex: 0xF7F1E3)
    static let eyebrow = Color(hex: 0xD9C79A)
    static let latin = Color(hex: 0xC9AF7A)
    static let tagline = Color(hex: 0xEFE7D3)
    static let taglineSecondary = Color(hex: 0xB7C4DD)

    static let gradient = EllipticalGradient(
        colors: [Color(hex: 0x3A5580), Color(hex: 0x223A5E), Color(hex: 0x101728)],
        center: UnitPoint(x: 0.15, y: -0.10),
        startRadiusFraction: 0,
        endRadiusFraction: 1.3
    )
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }

    init(light: UInt32, lightOpacity: Double = 1, dark: UInt32, darkOpacity: Double = 1) {
        self.init(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            let opacity = traits.userInterfaceStyle == .dark ? darkOpacity : lightOpacity
            return UIColor(
                red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255,
                alpha: CGFloat(opacity)
            )
        })
    }
}
