import SwiftUI

/// Spaced-repetition deck: word, pronunciation and an example in one card.
struct FlashcardsScreen: View {
    @Environment(SessionStore.self) private var session
    @State private var model = FlashcardsViewModel()

    var body: some View {
        NavigationStack {
            content
                .padding(.horizontal, Metrics.screenPadding)
                .padding(.bottom, Metrics.regular)
                .groundBackground()
                .navigationTitle("Речник")
                .navigationBarTitleDisplayMode(.inline)
        }
        .task { await model.loadIfNeeded(using: session.api) }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .idle, .loading:
            LoadingView()
        case .failed(let message):
            ErrorStateView(message: message) {
                Task { await model.load(using: session.api) }
            }
        case .loaded(let words):
            if words.isEmpty {
                EmptyStateView(
                    title: "Нема речи за понављање",
                    message: "Вратите се касније — распоред понављања ће донети нове речи."
                )
            } else if model.isFinished {
                finishedView
            } else if let word = model.currentWord {
                deck(word)
            }
        }
    }

    private func deck(_ word: ReviewWord) -> some View {
        VStack(spacing: Metrics.regular) {
            Text(model.positionLabel)
                .font(.recEyebrow)
                .tracking(1)
                .foregroundStyle(Palette.inkSoft)

            FlashcardView(
                word: word,
                isRevealed: model.isRevealed,
                scriptPreference: session.scriptPreference,
                languagePreference: session.languagePreference,
                onSpeak: { SpeechService.shared.pronounce(word) },
                onFlip: {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.82)) {
                        model.isRevealed.toggle()
                    }
                }
            )
            .id(word.id)

            if let message = model.errorMessage {
                InlineMessage(text: message)
            }

            if model.isRevealed {
                HStack(spacing: 10) {
                    Button(ReviewOutcome.learning.title) {
                        Task { await model.submit(.learning, using: session.api) }
                    }
                    .buttonStyle(.recGhost)

                    Button(ReviewOutcome.know.title) {
                        Task { await model.submit(.know, using: session.api) }
                    }
                    .buttonStyle(.recPrimary)
                }
                .disabled(model.isSubmitting)
            } else {
                Button("Прикажи превод", action: {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.82)) {
                        model.isRevealed = true
                    }
                })
                .buttonStyle(.recGhost)
            }
        }
        .animation(.easeOut(duration: 0.2), value: model.isRevealed)
    }

    private var finishedView: some View {
        VStack(spacing: Metrics.regular) {
            Spacer()
            KilimRule(tint: Palette.ochre, opacity: 0.6)
                .frame(width: 120)
            Text("Готово за данас")
                .font(.recDisplay)
                .foregroundStyle(Palette.ink)
            Text("Поновљено речи: \(model.reviewedCount)")
                .font(.recCallout)
                .foregroundStyle(Palette.inkSoft)

            if !model.earnedBadges.isEmpty {
                VStack(spacing: 6) {
                    ForEach(model.earnedBadges) { badge in
                        HStack(spacing: Metrics.tight) {
                            DiamondBadge(isEarned: true, size: 22)
                            Text(badge.titleCyrillic)
                                .font(.recCalloutStrong)
                                .foregroundStyle(Palette.ink)
                        }
                    }
                }
            }

            Spacer()

            Button("Учитај поново") {
                Task { await model.load(using: session.api) }
            }
            .buttonStyle(.recPrimary)
        }
    }
}

private struct FlashcardView: View {
    var word: ReviewWord
    var isRevealed: Bool
    var scriptPreference: ScriptPreference
    var languagePreference: LanguagePreference
    var onSpeak: () -> Void
    var onFlip: () -> Void

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: Metrics.largeCorner, style: .continuous)
                .fill(Palette.surfaceRaised)
                .overlay(
                    RoundedRectangle(cornerRadius: Metrics.largeCorner, style: .continuous)
                        .strokeBorder(Palette.line, lineWidth: 1.5)
                )
                .shadow(color: Palette.shadow.opacity(0.5), radius: 18, x: 0, y: 12)

            VStack(spacing: 6) {
                Text(scriptPreference == .latin ? word.latin : word.cyrillic)
                    .font(.recWord)
                    .foregroundStyle(Palette.ink)
                    .minimumScaleFactor(0.6)

                if scriptPreference != .latin {
                    Text(word.latin)
                        .font(.recCallout)
                        .italic()
                        .foregroundStyle(Palette.oxblood)
                }

                Button(action: onSpeak) {
                    Image(systemName: "speaker.wave.2.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Palette.onIndigo)
                        .frame(width: 38, height: 38)
                        .background(Circle().fill(Palette.indigo))
                }
                .buttonStyle(.plain)
                .padding(.top, 6)
                .accessibilityLabel("Изговори реч")

                if isRevealed {
                    Text(word.translation(matching: languagePreference))
                        .font(.recCalloutStrong)
                        .foregroundStyle(Palette.inkSoft)
                        .padding(.top, 10)

                    if let example = word.exampleCyrillic {
                        VStack(spacing: 3) {
                            Text("„\(example)“")
                                .font(.recCaption)
                                .foregroundStyle(Palette.inkSoft)
                            if let translation = word.exampleTranslation {
                                Text(translation)
                                    .font(.recCaption)
                                    .foregroundStyle(Palette.inkSoft)
                            }
                        }
                        .multilineTextAlignment(.center)
                        .padding(.top, 10)
                        .overlay(alignment: .top) {
                            Rectangle()
                                .fill(Palette.line)
                                .frame(height: 1)
                        }
                        .padding(.horizontal, Metrics.tight)
                    }
                } else {
                    Text("Додирните да видите превод")
                        .font(.recCaption)
                        .foregroundStyle(Palette.inkSoft.opacity(0.8))
                        .padding(.top, 12)
                }
            }
            .padding(Metrics.regular)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .contentShape(Rectangle())
        .onTapGesture(perform: onFlip)
        .accessibilityElement(children: .contain)
    }
}
