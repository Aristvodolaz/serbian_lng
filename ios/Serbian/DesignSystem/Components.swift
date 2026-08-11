import SwiftUI

// MARK: - Buttons

struct RecPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        StyleBody(configuration: configuration)
    }

    private struct StyleBody: View {
        let configuration: ButtonStyleConfiguration
        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            configuration.label
                .font(.recButton)
                .foregroundStyle(Palette.onIndigo)
                .frame(maxWidth: .infinity, minHeight: Metrics.minimumTapTarget)
                .background(
                    RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                        .fill(Palette.indigo)
                )
                .opacity(isEnabled ? (configuration.isPressed ? 0.86 : 1) : 0.4)
                .scaleEffect(configuration.isPressed ? 0.985 : 1)
                .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
        }
    }
}

struct RecGhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        StyleBody(configuration: configuration)
    }

    private struct StyleBody: View {
        let configuration: ButtonStyleConfiguration
        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            configuration.label
                .font(.recButton)
                .foregroundStyle(Palette.inkSoft)
                .frame(maxWidth: .infinity, minHeight: Metrics.minimumTapTarget)
                .background(
                    RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                        .strokeBorder(Palette.line, lineWidth: 1.5)
                )
                .opacity(isEnabled ? (configuration.isPressed ? 0.7 : 1) : 0.4)
                .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
        }
    }
}

/// Primary action on top of the dark indigo hero, where `Palette.indigo` would
/// disappear into the background.
struct RecHeroButtonStyle: ButtonStyle {
    var isProminent = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.recButton)
            .foregroundStyle(isProminent ? Color(hex: 0x223A5E) : HeroPalette.tagline)
            .frame(maxWidth: .infinity, minHeight: Metrics.minimumTapTarget)
            .background(
                RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                    .fill(isProminent ? HeroPalette.wordmark : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                    .strokeBorder(
                        isProminent ? Color.clear : HeroPalette.tagline.opacity(0.5),
                        lineWidth: 1.5
                    )
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == RecHeroButtonStyle {
    static var recHero: RecHeroButtonStyle { RecHeroButtonStyle() }
    static var recHeroQuiet: RecHeroButtonStyle { RecHeroButtonStyle(isProminent: false) }
}

extension ButtonStyle where Self == RecPrimaryButtonStyle {
    static var recPrimary: RecPrimaryButtonStyle { RecPrimaryButtonStyle() }
}

extension ButtonStyle where Self == RecGhostButtonStyle {
    static var recGhost: RecGhostButtonStyle { RecGhostButtonStyle() }
}

// MARK: - Status pills

struct Pill: View {
    var systemImage: String
    var text: String
    var tint: Color

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: systemImage)
                .font(.system(size: 11, weight: .bold))
            Text(text)
                .font(.recMonoSmall)
                .fontWeight(.bold)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 11)
        .padding(.vertical, 6)
        .background(
            Capsule().fill(Palette.surfaceRaised)
        )
        .overlay(
            Capsule().strokeBorder(Palette.line, lineWidth: 1)
        )
    }
}

// MARK: - Avatar

struct AvatarView: View {
    var name: String
    var size: CGFloat = 30

    private var initial: String {
        String(name.trimmingCharacters(in: .whitespaces).prefix(1)).uppercased()
    }

    var body: some View {
        Circle()
            .fill(
                AngularGradient(
                    colors: [Palette.ochre, Palette.oxblood, Palette.indigo, Palette.ochre],
                    center: .center
                )
            )
            .overlay(
                Text(initial)
                    .font(.system(size: size * 0.42, weight: .bold, design: .serif))
                    .foregroundStyle(Palette.onIndigo)
            )
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

// MARK: - Progress

struct ProgressTrack: View {
    /// 0...1
    var value: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Palette.line)
                Capsule()
                    .fill(Palette.ochre)
                    .frame(width: proxy.size.width * min(max(value, 0), 1))
            }
        }
        .frame(height: 8)
        .animation(.easeOut(duration: 0.25), value: value)
        .accessibilityElement()
        .accessibilityLabel("Напредак")
        .accessibilityValue("\(Int(min(max(value, 0), 1) * 100))%")
    }
}

// MARK: - Cards

struct RecCard<Content: View>: View {
    var padding: CGFloat = Metrics.regular
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: Metrics.largeCorner, style: .continuous)
                    .fill(Palette.surfaceRaised)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.largeCorner, style: .continuous)
                    .strokeBorder(Palette.line, lineWidth: 1)
            )
    }
}

struct StatCard: View {
    var value: String
    var label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(.recMono)
                .foregroundStyle(Palette.ink)
            Text(label.uppercased())
                .font(.recEyebrow)
                .tracking(0.6)
                .foregroundStyle(Palette.inkSoft)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Palette.surfaceRaised)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Palette.line, lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
    }
}

/// Rotated diamond in the spirit of the kilim ornament, used for achievements.
struct DiamondBadge: View {
    var isEarned: Bool
    var size: CGFloat = 54

    var body: some View {
        RoundedRectangle(cornerRadius: 6, style: .continuous)
            .fill(
                LinearGradient(
                    colors: isEarned
                        ? [Palette.ochre, Palette.oxblood]
                        : [Palette.line, Palette.line],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: size, height: size)
            .rotationEffect(.degrees(45))
            .frame(width: size * 1.42, height: size * 1.42)
            .accessibilityHidden(true)
    }
}

// MARK: - Dual script

/// The core idea of the design: Serbian text is shown in both alphabets side by
/// side, unless the learner explicitly picked one.
struct DualScriptText: View {
    var cyrillic: String
    var latin: String
    var preference: ScriptPreference
    var primaryFont: Font = .recDisplaySmall
    var secondaryFont: Font = .recFootnote
    var alignment: HorizontalAlignment = .leading

    var body: some View {
        VStack(alignment: alignment, spacing: 2) {
            Text(preference == .latin ? latin : cyrillic)
                .font(primaryFont)
                .foregroundStyle(Palette.ink)
            if preference == .both, latin != cyrillic {
                Text(latin)
                    .font(secondaryFont)
                    .italic()
                    .foregroundStyle(Palette.oxblood)
            }
        }
        .multilineTextAlignment(alignment == .center ? .center : .leading)
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Forms

/// A labelled input container: 44pt tall, 14pt corners, hairline border.
struct FormField<Content: View>: View {
    var label: String
    var footnote: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            EyebrowLabel(text: label)
            content
                .font(.recBody)
                .foregroundStyle(Palette.ink)
                .padding(.horizontal, 14)
                .frame(minHeight: Metrics.minimumTapTarget + 4)
                .background(
                    RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                        .fill(Palette.surfaceRaised)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                        .strokeBorder(Palette.line, lineWidth: 1.5)
                )
            if let footnote {
                Text(footnote)
                    .font(.recCaption)
                    .foregroundStyle(Palette.inkSoft)
            }
        }
    }
}

/// Inline validation / server error message.
struct InlineMessage: View {
    var text: String
    var tone: Tone = .error

    enum Tone {
        case error
        case success

        var color: Color {
            switch self {
            case .error: Palette.oxblood
            case .success: Palette.good
            }
        }

        var symbol: String {
            switch self {
            case .error: "exclamationmark.triangle.fill"
            case .success: "checkmark.seal.fill"
            }
        }
    }

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Image(systemName: tone.symbol)
                .font(.system(size: 12, weight: .bold))
            Text(text)
                .font(.recFootnote)
        }
        .foregroundStyle(tone.color)
        .frame(maxWidth: .infinity, alignment: .leading)
        .transition(.opacity)
    }
}

// MARK: - Layout helpers

struct SectionHeader: View {
    var cyrillic: String
    var latin: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(cyrillic)
                .font(.recDisplaySmall)
                .foregroundStyle(Palette.ink)
            Text("/ \(latin)")
                .font(.recCaption)
                .italic()
                .foregroundStyle(Palette.oxblood)
        }
        .accessibilityElement(children: .combine)
    }
}

struct EyebrowLabel: View {
    var text: String

    var body: some View {
        Text(text.uppercased())
            .font(.recEyebrow)
            .tracking(1)
            .foregroundStyle(Palette.inkSoft)
    }
}

struct StepDots: View {
    var count: Int
    var current: Int

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<count, id: \.self) { index in
                Capsule()
                    .fill(index == current ? Palette.indigo : Palette.line)
                    .frame(width: index == current ? 16 : 6, height: 6)
            }
        }
        .animation(.easeOut(duration: 0.2), value: current)
        .accessibilityHidden(true)
    }
}

/// Screen background used by every tab.
struct GroundBackground: ViewModifier {
    func body(content: Content) -> some View {
        content.background(Palette.ground.ignoresSafeArea())
    }
}

extension View {
    func groundBackground() -> some View {
        modifier(GroundBackground())
    }
}
