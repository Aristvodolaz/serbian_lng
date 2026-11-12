import SwiftUI

/// Full-screen reader for one grammar theory topic: blocks from the admin
/// editor rendered in both scripts, tables as simple grids, examples with a
/// translation in the interface language.
struct TheoryScreen: View {
    let summary: TheorySummary

    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var topic: TheoryTopic?
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.loose) {
            topBar

            switch (topic, errorMessage) {
            case (nil, nil):
                LoadingView()
            case (nil, .some(let message)):
                ErrorStateView(message: message) {
                    Task { await load() }
                }
            case (.some(let topic), _):
                reader(topic)
            }
        }
        .padding(.horizontal, Metrics.screenPadding)
        .padding(.top, Metrics.tight)
        .padding(.bottom, Metrics.regular)
        .groundBackground()
        .task { await load() }
    }

    private func load() async {
        do {
            topic = try await session.api.theory(id: summary.id)
            errorMessage = nil
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }

    private var topBar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Palette.inkSoft)
                    .frame(width: Metrics.minimumTapTarget, height: Metrics.minimumTapTarget)
            }
            .accessibilityLabel("Затвори теорију")
            Spacer()
        }
    }

    private func reader(_ topic: TheoryTopic) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Metrics.loose) {
                DualScriptText(
                    cyrillic: topic.titleCyrillic,
                    latin: topic.titleLatin,
                    preference: session.scriptPreference,
                    primaryFont: .recDisplaySmall,
                    secondaryFont: .recFootnote
                )
                .padding(.top, Metrics.tight)

                EyebrowLabel(text: "Теорија")

                ForEach(Array(topic.payload.blocks.enumerated()), id: \.offset) { _, block in
                    blockView(block)
                }
            }
            .padding(.bottom, Metrics.loose)
        }
        .scrollIndicators(.hidden)
    }

    private func translatedLine(_ block: TheoryBlock) -> Text {
        Text(session.languagePreference == .en ? (block.translationEn ?? "") : (block.translationRu ?? ""))
            .font(.recCaption)
            .foregroundStyle(Palette.inkSoft)
    }

    @ViewBuilder
    private func blockView(_ block: TheoryBlock) -> some View {
        switch block.type {
        case .heading:
            VStack(alignment: .leading, spacing: 3) {
                DualScriptText(
                    cyrillic: block.textCyrillic ?? "",
                    latin: block.textLatin ?? "",
                    preference: session.scriptPreference,
                    primaryFont: .recCalloutStrong,
                    secondaryFont: .recFootnote
                )
                translatedLine(block)
            }
            .padding(.top, Metrics.tight)
        case .paragraph:
            VStack(alignment: .leading, spacing: 3) {
                DualScriptText(
                    cyrillic: block.textCyrillic ?? "",
                    latin: block.textLatin ?? "",
                    preference: session.scriptPreference,
                    primaryFont: .recBody,
                    secondaryFont: .recFootnote
                )
                translatedLine(block)
            }
        case .table:
            blockTable(block)
        case .example:
            VStack(alignment: .leading, spacing: 2) {
                DualScriptText(
                    cyrillic: block.cyrillic ?? "",
                    latin: block.latin ?? "",
                    preference: session.scriptPreference,
                    primaryFont: .recCalloutStrong,
                    secondaryFont: .recFootnote
                )
                translatedLine(block)
            }
            .padding(Metrics.regular)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                    .fill(Palette.surfaceRaised)
            )
        case .unknown:
            EmptyView()
        }
    }

    private func blockTable(_ block: TheoryBlock) -> some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            VStack(alignment: .leading, spacing: 2) {
                DualScriptText(
                    cyrillic: block.captionCyrillic ?? "",
                    latin: block.captionLatin ?? "",
                    preference: session.scriptPreference,
                    primaryFont: .recCalloutStrong,
                    secondaryFont: .recFootnote
                )
                Text(session.languagePreference == .en ? (block.captionTranslationEn ?? "") : (block.captionTranslationRu ?? ""))
                    .font(.recCaption)
                    .foregroundStyle(Palette.inkSoft)
            }
            Grid(alignment: .leading, horizontalSpacing: Metrics.tight, verticalSpacing: 6) {
                if let headers = block.headers {
                    let translated = session.languagePreference == .en ? block.headersTranslationEn : block.headersTranslationRu
                    GridRow {
                        ForEach(Array(headers.enumerated()), id: \.offset) { index, cell in
                            Group {
                                if let translated, index < translated.count {
                                    Text(translated[index])
                                        .font(.recCalloutStrong)
                                        .foregroundStyle(Palette.ink)
                                } else {
                                    DualScriptText(
                                        cyrillic: cell.cyrillic,
                                        latin: cell.latin,
                                        preference: session.scriptPreference,
                                        primaryFont: .recCalloutStrong,
                                        secondaryFont: .recFootnote,
                                        alignment: .leading
                                    )
                                }
                            }
                            .gridCellAnchor(.leading)
                        }
                    }
                }
                if let rows = block.rows {
                    ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                        GridRow {
                            ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
                                DualScriptText(
                                    cyrillic: cell.cyrillic,
                                    latin: cell.latin,
                                    preference: session.scriptPreference,
                                    primaryFont: .recFootnote,
                                    secondaryFont: .recCaption,
                                    alignment: .leading
                                )
                                .gridCellAnchor(.leading)
                            }
                        }
                    }
                }
            }
        }
        .padding(Metrics.regular)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous)
                .fill(Palette.surfaceRaised)
        )
    }
}
