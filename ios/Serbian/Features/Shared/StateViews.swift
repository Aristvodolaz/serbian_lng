import SwiftUI

struct LoadingView: View {
    var body: some View {
        VStack(spacing: Metrics.regular) {
            ProgressView()
                .controlSize(.large)
                .tint(Palette.indigo)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorStateView: View {
    var message: String
    var retry: (() -> Void)?

    var body: some View {
        VStack(spacing: Metrics.regular) {
            KilimRule(tint: Palette.oxblood, opacity: 0.4)
                .frame(width: 80)
            Text("Нешто није у реду")
                .font(.recDisplaySmall)
                .foregroundStyle(Palette.ink)
            Text(message)
                .font(.recFootnote)
                .foregroundStyle(Palette.inkSoft)
                .multilineTextAlignment(.center)
            if let retry {
                Button("Пробај поново", action: retry)
                    .buttonStyle(.recGhost)
                    .frame(maxWidth: 220)
            }
        }
        .padding(Metrics.loose)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct EmptyStateView: View {
    var title: LocalizedStringKey
    var message: LocalizedStringKey

    var body: some View {
        VStack(spacing: Metrics.tight) {
            KilimRule(opacity: 0.45)
                .frame(width: 80)
            Text(title)
                .font(.recDisplaySmall)
                .foregroundStyle(Palette.ink)
            Text(message)
                .font(.recFootnote)
                .foregroundStyle(Palette.inkSoft)
                .multilineTextAlignment(.center)
        }
        .padding(Metrics.loose)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Shown for the moment it takes to validate a stored session.
struct LaunchView: View {
    var body: some View {
        ZStack {
            HeroPalette.gradient.ignoresSafeArea()
            VStack(spacing: Metrics.regular) {
                WordmarkView(size: 44)
                ProgressView()
                    .tint(HeroPalette.latin)
            }
        }
    }
}

/// РЕЧ · REČ lockup used on the hero and launch screens.
struct WordmarkView: View {
    var size: CGFloat = 52

    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: 8) {
            Text("РЕЧ")
                .font(.system(size: size, weight: .semibold, design: .serif))
                .tracking(size * 0.03)
                .foregroundStyle(HeroPalette.wordmark)
            Text("REČ")
                .font(.system(size: size * 0.38, weight: .medium, design: .serif))
                .italic()
                .foregroundStyle(HeroPalette.latin)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("РЕЧ")
    }
}
