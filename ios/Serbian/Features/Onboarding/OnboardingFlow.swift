import SwiftUI

/// Welcome → script picker → account. The script choice is made before the
/// account exists, then sent along with registration, exactly as the backend's
/// `POST /auth/register` expects.
struct OnboardingFlow: View {
    enum Route: Hashable {
        case scriptPicker
        case createAccount(ScriptPreference)
        case signIn
    }

    @State private var route: [Route] = []

    var body: some View {
        NavigationStack(path: $route) {
            WelcomeView(
                onStart: { route.append(.scriptPicker) },
                onSignIn: { route.append(.signIn) }
            )
            .navigationDestination(for: Route.self) { destination in
                switch destination {
                case .scriptPicker:
                    ScriptPickerView { preference in
                        route.append(.createAccount(preference))
                    }
                case .createAccount(let preference):
                    CreateAccountView(scriptPreference: preference)
                case .signIn:
                    SignInView()
                }
            }
        }
    }
}

struct WelcomeView: View {
    var onStart: () -> Void
    var onSignIn: () -> Void

    var body: some View {
        ZStack {
            HeroPalette.gradient.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: Metrics.loose)

                Text("Учите српски · реч по реч")
                    .font(.recEyebrow)
                    .tracking(1.6)
                    .textCase(.uppercase)
                    .foregroundStyle(HeroPalette.eyebrow)
                    .padding(.bottom, Metrics.regular)

                WordmarkView()

                VStack(spacing: 4) {
                    Text("Учите српски, реч по реч.")
                        .font(.recBody)
                        .foregroundStyle(HeroPalette.tagline)
                    Text("Learn Serbian, word by word.")
                        .font(.recFootnote)
                        .italic()
                        .foregroundStyle(HeroPalette.taglineSecondary)
                }
                .multilineTextAlignment(.center)
                .padding(.top, Metrics.regular)

                KilimRule(tint: HeroPalette.latin, opacity: 0.55)
                    .frame(width: 140)
                    .padding(.top, Metrics.loose)

                Spacer()

                Text("Оба писма стоје једно уз друго — ћирилица и латиница се уче заједно, а не одвојено.")
                    .font(.recFootnote)
                    .foregroundStyle(HeroPalette.taglineSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Metrics.tight)
                    .padding(.bottom, Metrics.regular)

                VStack(spacing: 10) {
                    Button("Почни", action: onStart)
                        .buttonStyle(.recHero)
                    Button("Већ имам налог", action: onSignIn)
                        .buttonStyle(.recHeroQuiet)
                }
            }
            .padding(.horizontal, Metrics.screenPadding)
            .padding(.bottom, Metrics.tight)
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

struct ScriptPickerView: View {
    var onContinue: (ScriptPreference) -> Void

    @State private var selection: ScriptPreference = .both

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.loose) {
            StepDots(count: 3, current: 1)
                .frame(maxWidth: .infinity)

            VStack(alignment: .leading, spacing: 2) {
                Text("Изаберите писмо")
                    .font(.recDisplay)
                    .foregroundStyle(Palette.ink)
                Text("Choose your script")
                    .font(.recCallout)
                    .foregroundStyle(Palette.inkSoft)
            }

            VStack(spacing: 10) {
                ForEach(ScriptPreference.allCases) { preference in
                    ScriptCard(
                        preference: preference,
                        isSelected: selection == preference
                    ) {
                        selection = preference
                    }
                }
            }

            Text("Избор одређује сваку следећу лекцију. Може се променити у профилу.")
                .font(.recCaption)
                .foregroundStyle(Palette.inkSoft)

            Spacer()

            Button("Настави") { onContinue(selection) }
                .buttonStyle(.recPrimary)
        }
        .padding(.horizontal, Metrics.screenPadding)
        .padding(.top, Metrics.regular)
        .padding(.bottom, Metrics.tight)
        .groundBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ScriptCard: View {
    var preference: ScriptPreference
    var isSelected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Metrics.tight) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(preference.title)
                        .font(.recCalloutStrong)
                        .foregroundStyle(Palette.ink)
                    Text(preference.sample)
                        .font(.recCaption)
                        .foregroundStyle(Palette.inkSoft)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Palette.onIndigo)
                        .frame(width: 20, height: 20)
                        .background(Circle().fill(Palette.indigo))
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(minHeight: 62)
            .background(
                RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                    .fill(isSelected ? Palette.indigo.opacity(0.10) : Palette.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                    .strokeBorder(isSelected ? Palette.indigo : Palette.line, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }
}
