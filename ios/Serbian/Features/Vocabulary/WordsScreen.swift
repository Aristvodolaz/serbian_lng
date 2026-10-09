import SwiftUI

/// The dictionary tab: searchable list of all published words. Tapping a row
/// opens the word card; the toolbar launches the spaced-repetition deck.
struct WordsScreen: View {
    @Environment(SessionStore.self) private var session
    @State private var model = WordsViewModel()

    var body: some View {
        NavigationStack {
            content
                .groundBackground()
                .navigationTitle("Речник")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        NavigationLink {
                            FlashcardsScreen()
                        } label: {
                            Label("Понављање", systemImage: "repeat")
                        }
                        .accessibilityLabel("Понављање речи")
                    }
                }
                .searchable(text: $model.searchText, prompt: "Претражите речи")
        }
        .task { await model.loadIfNeeded(using: session.api) }
        .onChange(of: model.searchText) { _, newValue in
            model.search(newValue, using: session.api)
        }
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
                    title: "Ништа није пронађено",
                    message: "Промените унос или потражите другу реч."
                )
            } else {
                list(words)
            }
        }
    }

    private func list(_ words: [Word]) -> some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(words) { word in
                    NavigationLink {
                        WordDetailScreen(word: word, attributes: model.attributes)
                    } label: {
                        WordRow(
                            word: word,
                            scriptPreference: session.scriptPreference,
                            languagePreference: session.languagePreference
                        )
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, Metrics.screenPadding)
                    .onAppear {
                        if word.id == words.last?.id {
                            Task { await model.loadMore(using: session.api) }
                        }
                    }

                    if word.id != words.last?.id {
                        Rectangle()
                            .fill(Palette.line)
                            .frame(height: 1)
                            .padding(.horizontal, Metrics.screenPadding)
                    }
                }

                if model.hasMore {
                    HStack {
                        Spacer()
                        ProgressView().tint(Palette.indigo)
                        Spacer()
                    }
                    .padding(.vertical, Metrics.regular)
                }
            }
            .padding(.bottom, Metrics.loose)
        }
        .scrollIndicators(.hidden)
    }
}

private struct WordRow: View {
    var word: Word
    var scriptPreference: ScriptPreference
    var languagePreference: LanguagePreference

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(scriptPreference == .latin ? word.latin : word.cyrillic)
                    .font(.recCalloutStrong)
                    .foregroundStyle(Palette.ink)
                if scriptPreference == .both, word.latin != word.cyrillic {
                    Text(word.latin)
                        .font(.recCaption)
                        .italic()
                        .foregroundStyle(Palette.oxblood)
                }
            }
            Spacer()
            Text(word.translation(matching: languagePreference))
                .font(.recCallout)
                .foregroundStyle(Palette.inkSoft)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}
