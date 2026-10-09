import SwiftUI

/// A single dictionary word: both scripts, the translation, a spoken example
/// and every grammar attribute the word carries.
struct WordDetailScreen: View {
    let word: Word
    let attributes: WordAttributes?

    @Environment(SessionStore.self) private var session

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Metrics.loose) {
                header

                if let example = word.exampleCyrillic, !example.isEmpty {
                    exampleCard(example)
                }

                grammarCard
            }
            .padding(.horizontal, Metrics.screenPadding)
            .padding(.vertical, Metrics.regular)
        }
        .groundBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            DualScriptText(
                cyrillic: word.cyrillic,
                latin: word.latin,
                preference: session.scriptPreference,
                primaryFont: .recWord,
                secondaryFont: .recCallout
            )

            Text(word.translation(matching: session.languagePreference))
                .font(.recBody)
                .foregroundStyle(Palette.inkSoft)

            Button {
                SpeechService.shared.pronounce(word)
            } label: {
                Image(systemName: "speaker.wave.2.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Palette.onIndigo)
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(Palette.indigo))
            }
            .buttonStyle(.plain)
            .padding(.top, Metrics.tight)
            .accessibilityLabel("Изговори реч")
        }
    }

    private func exampleCard(_ example: String) -> some View {
        RecCard {
            VStack(alignment: .leading, spacing: 4) {
                Text(example)
                    .font(.recCallout)
                    .foregroundStyle(Palette.ink)
                if let translation = word.exampleTranslation(matching: session.languagePreference) {
                    Text(translation)
                        .font(.recCaption)
                        .foregroundStyle(Palette.inkSoft)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var grammarCard: some View {
        let fields = WordAttributeField.allCases.filter { $0.value(of: word) != nil }
        if !fields.isEmpty {
            RecCard {
                VStack(alignment: .leading, spacing: Metrics.regular) {
                    ForEach(fields, id: \.self) { field in
                        attributeRow(field)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func attributeRow(_ field: WordAttributeField) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: Metrics.regular) {
            Text(field.label(matching: session.languagePreference))
                .font(.recEyebrow)
                .tracking(0.6)
                .foregroundStyle(Palette.inkSoft)
            Spacer(minLength: 0)
            if let value = field.value(of: word) {
                Text(field.label(for: value, matching: session.languagePreference, attributes: attributes))
                    .font(.recCalloutStrong)
                    .foregroundStyle(Palette.ink)
                    .multilineTextAlignment(.trailing)
            }
        }
        .accessibilityElement(children: .combine)
    }
}
