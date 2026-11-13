import SwiftUI

/// Library tab: all published theory sections with their topics, mirroring
/// the trail rows already used inside PathScreen.
struct TheoryLibraryScreen: View {
    @Environment(SessionStore.self) private var session
    @State private var activeTheory: TheorySummary?
    @State private var sections: [TheoryLibrarySection]?
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Metrics.loose) {
                    SectionHeader(title: "Теорија")

                    switch (sections, errorMessage) {
                    case (nil, nil):
                        LoadingView()
                    case (nil, .some(let message)):
                        ErrorStateView(message: message) {
                            Task { await load() }
                        }
                    case (.some(let sections), _):
                        if sections.isEmpty {
                            EmptyStateView(
                                title: "Još nema teorije",
                                message: "Теорија ће се појавити овде."
                            )
                        } else {
                            ForEach(sections) { section in
                                sectionView(section)
                            }
                        }
                    }
                }
                .padding(.horizontal, Metrics.screenPadding)
                .padding(.top, Metrics.tight)
                .padding(.bottom, Metrics.loose)
            }
            .scrollIndicators(.hidden)
            .navigationBarHidden(true)
        }
        .groundBackground()
        .tint(Palette.indigo)
        .task { if sections == nil { await load() } }
        .fullScreenCover(item: $activeTheory) { summary in
            TheoryScreen(summary: summary)
        }
    }

    private func load() async {
        do {
            sections = try await session.api.theoryLibrary().sections
            errorMessage = nil
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }

    private func sectionView(_ section: TheoryLibrarySection) -> some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            HStack(spacing: 8) {
                DualScriptText(
                    cyrillic: section.titleCyrillic,
                    latin: section.titleLatin,
                    preference: session.scriptPreference,
                    primaryFont: .recCalloutStrong,
                    secondaryFont: .recFootnote
                )
                Pill(systemImage: "diagram.thumbnail", text: section.level, tint: Palette.indigo)
            }
            Text(section.titleTranslation(matching: session.languagePreference))
                .font(.recCaption)
                .foregroundStyle(Palette.inkSoft)

            ForEach(section.topics) { topic in
                Button {
                    activeTheory = topic
                } label: {
                    HStack {
                        Image(systemName: "book.closed.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Palette.indigo)
                            .frame(width: Metrics.minimumTapTarget, height: Metrics.minimumTapTarget)
                        DualScriptText(
                            cyrillic: topic.titleCyrillic,
                            latin: topic.titleLatin,
                            preference: session.scriptPreference,
                            primaryFont: .recCalloutStrong,
                            secondaryFont: .recCaption
                        )
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Palette.thread)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                            .fill(Palette.surfaceRaised)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}
