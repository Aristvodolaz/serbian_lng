import SwiftUI

/// Home screen: a winding trail of lessons instead of a list, with the streak
/// and XP pills above it.
struct PathScreen: View {
    @Environment(SessionStore.self) private var session
    @State private var model = PathViewModel()

    var body: some View {
        NavigationStack {
            content
                .groundBackground()
                .safeAreaInset(edge: .top, spacing: 0) { header }
                .navigationTitle("")
                .toolbar(.hidden, for: .navigationBar)
        }
        .task { await model.loadIfNeeded(using: session.api) }
        .fullScreenCover(item: $model.activeTheory) { summary in
            TheoryScreen(summary: summary)
        }
        .fullScreenCover(item: $model.activeLesson) { lesson in
            LessonScreen(lesson: lesson) {
                Task {
                    await model.load(using: session.api)
                    await session.refreshUser()
                }
            }
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
        case .loaded(let path):
            if path.sections.isEmpty {
                EmptyStateView(
                    title: "Нема лекција",
                    message: "Сервер још нема садржај. Покрените `npm run seed` на бекенду."
                )
            } else {
                trail(for: path)
            }
        }
    }

    private func trail(for path: LearningPath) -> some View {
        ScrollView {
            VStack(spacing: 0) {
                SectionHeader(title: "Кораци")
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, Metrics.tight)

                Text("\(path.completedCount) од \(path.lessons.count) лекција")
                    .font(.recCaption)
                    .foregroundStyle(Palette.inkSoft)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, Metrics.loose)

                ForEach(path.sections.sorted { $0.order < $1.order }) { section in
                    SectionTrailSection(
                        section: section,
                        scriptPreference: session.scriptPreference,
                        languagePreference: session.languagePreference,
                        onSelect: { lesson in
                            model.activeLesson = lesson
                        },
                        onSelectTheory: { summary in
                            model.activeTheory = summary
                        }
                    )
                }
            }
            .padding(.horizontal, Metrics.screenPadding)
            .padding(.bottom, Metrics.loose)
        }
        .refreshable { await model.load(using: session.api) }
        .scrollIndicators(.hidden)
    }

    private var header: some View {
        HStack(spacing: Metrics.tight) {
            Pill(
                systemImage: "flame.fill",
                text: "\(session.user?.streakDays ?? 0)",
                tint: Palette.oxblood
            )
            .accessibilityLabel("Серија дана: \(session.user?.streakDays ?? 0)")

            Pill(
                systemImage: "diamond.fill",
                text: "\(session.user?.xp ?? 0)",
                tint: Palette.indigo
            )
            .accessibilityLabel("XP: \(session.user?.xp ?? 0)")

            Spacer()

            AvatarView(name: session.displayName)
        }
        .padding(.horizontal, Metrics.screenPadding)
        .padding(.vertical, Metrics.tight)
        .background(Palette.ground)
    }
}

private struct SectionTrailSection: View {
    var section: SectionPath
    var scriptPreference: ScriptPreference
    var languagePreference: LanguagePreference
    var onSelect: (LessonSummary) -> Void
    var onSelectTheory: (TheorySummary) -> Void

    private var units: [PathUnit] {
        section.units.sorted { $0.order < $1.order }
    }

    private var lessonCount: Int {
        units.reduce(0) { $0 + $1.lessons.count }
    }

    var body: some View {
        VStack(spacing: 0) {
            // The legacy pseudo-section (orphan units) carries no titles and
            // renders without a header.
            if !section.titleCyrillic.isEmpty || !section.titleLatin.isEmpty {
                HStack(spacing: Metrics.tight) {
                    KilimRule(cell: 8, opacity: 0.5)
                        .frame(width: 28)
                    DualScriptText(
                        cyrillic: section.titleCyrillic,
                        latin: section.titleLatin,
                        preference: scriptPreference,
                        primaryFont: .recCalloutStrong,
                        secondaryFont: .recCaption
                    )
                    Spacer()
                    if let level = section.level {
                        Pill(systemImage: "diagram.thumbnail", text: level, tint: Palette.indigo)
                    }
                    Text(section.titleTranslation(matching: languagePreference))
                        .font(.recCaption)
                        .foregroundStyle(Palette.inkSoft)
                }
                .padding(.bottom, Metrics.regular)
            }

            ForEach(units) { unit in
                UnitTrailSection(
                    unit: unit,
                    scriptPreference: scriptPreference,
                    languagePreference: languagePreference,
                    onSelect: onSelect
                )
            }

            if let checkpoint = section.checkpoint {
                if let lastUnit = units.last, lastUnit.lessons.count > 0 {
                    PathTrail(
                        from: UnitTrailSection.xOffset(for: lastUnit.lessons.count - 1),
                        to: UnitTrailSection.xOffset(for: lessonCount)
                    )
                }
                PathNodeRow(
                    lesson: checkpoint,
                    isCheckpoint: true,
                    scriptPreference: scriptPreference,
                    languagePreference: languagePreference,
                    xOffset: UnitTrailSection.xOffset(for: lessonCount),
                    onSelect: onSelect
                )
            }

            if let theory = section.theory?.sorted(by: { $0.order < $1.order }), !theory.isEmpty {
                TheoryTrailRows(
                    topics: theory,
                    scriptPreference: scriptPreference,
                    onSelect: onSelectTheory
                )
            }
        }
        .padding(.bottom, Metrics.loose)
    }
}

/// Theory topic entries for a section — a quiet list under the lesson trail.
private struct TheoryTrailRows: View {
    var topics: [TheorySummary]
    var scriptPreference: ScriptPreference
    var onSelect: (TheorySummary) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            EyebrowLabel(text: "Теорија")
                .padding(.top, Metrics.tight)

            ForEach(topics) { topic in
                Button {
                    onSelect(topic)
                } label: {
                    HStack(spacing: Metrics.tight) {
                        Image(systemName: "book.closed.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Palette.indigo)
                            .frame(width: Metrics.minimumTapTarget, height: Metrics.minimumTapTarget)
                        DualScriptText(
                            cyrillic: topic.titleCyrillic,
                            latin: topic.titleLatin,
                            preference: scriptPreference,
                            primaryFont: .recCalloutStrong,
                            secondaryFont: .recCaption
                        )
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Palette.thread)
                    }
                    .padding(.horizontal, Metrics.tight)
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

private struct UnitTrailSection: View {
    var unit: PathUnit
    var scriptPreference: ScriptPreference
    var languagePreference: LanguagePreference
    var onSelect: (LessonSummary) -> Void

    private var lessons: [LessonSummary] {
        unit.lessons.sorted { $0.order < $1.order }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: Metrics.tight) {
                KilimRule(cell: 8, opacity: 0.5)
                    .frame(width: 28)
                DualScriptText(
                    cyrillic: unit.titleCyrillic,
                    latin: unit.titleLatin,
                    preference: scriptPreference,
                    primaryFont: .recCalloutStrong,
                    secondaryFont: .recCaption
                )
                Spacer()
                Text(unit.titleTranslation(matching: languagePreference))
                    .font(.recCaption)
                    .foregroundStyle(Palette.inkSoft)
            }
            .padding(.bottom, Metrics.regular)

            ForEach(Array(lessons.enumerated()), id: \.element.id) { offset, lesson in
                PathNodeRow(
                    lesson: lesson,
                    scriptPreference: scriptPreference,
                    languagePreference: languagePreference,
                    xOffset: Self.xOffset(for: offset),
                    onSelect: onSelect
                )

                if offset < lessons.count - 1 {
                    PathTrail(
                        from: Self.xOffset(for: offset),
                        to: Self.xOffset(for: offset + 1)
                    )
                }
            }
        }
        .padding(.bottom, Metrics.loose)
    }

    /// The trail leans left, centre, right, centre — the same rhythm as the
    /// mockup's `:nth-child` offsets. The rhythm restarts within every unit,
    /// because sections wrap units freely and a global index would drift.
    static func xOffset(for index: Int) -> CGFloat {
        let pattern: [CGFloat] = [0, -40, 0, 40]
        return pattern[index % pattern.count]
    }
}

private struct PathNodeRow: View {
    var lesson: LessonSummary
    var isCheckpoint: Bool = false
    var scriptPreference: ScriptPreference
    var languagePreference: LanguagePreference
    var xOffset: CGFloat
    var onSelect: (LessonSummary) -> Void

    var body: some View {
        Button {
            onSelect(lesson)
        } label: {
            VStack(spacing: 6) {
                PathNode(status: lesson.status, isCheckpoint: isCheckpoint)
                VStack(spacing: 1) {
                    Text(scriptPreference == .latin ? lesson.titleLatin : lesson.title)
                        .font(.recCalloutStrong)
                        .foregroundStyle(lesson.status == .locked ? Palette.inkSoft : Palette.ink)
                    if scriptPreference == .both, lesson.titleLatin != lesson.title {
                        Text(lesson.titleLatin)
                            .font(.recCaption)
                            .italic()
                            .foregroundStyle(Palette.oxblood)
                    }
                    Text("\(lesson.titleTranslation(matching: languagePreference)) · \(lesson.xpReward) XP")
                        .font(.recCaption)
                        .foregroundStyle(Palette.inkSoft)
                }
                .multilineTextAlignment(.center)
            }
            .offset(x: xOffset)
        }
        .buttonStyle(.plain)
        .disabled(!lesson.status.isOpen)
        .accessibilityLabel(lesson.title)
        .accessibilityValue(lesson.status.accessibilityDescription)
    }
}

private struct PathNode: View {
    var status: LessonStatus
    var isCheckpoint: Bool = false

    private var size: CGFloat { 64 }

    var body: some View {
        ZStack {
            switch status {
            case .done:
                Circle().fill(Palette.good)
                Image(systemName: isCheckpoint ? "flag.fill" : "checkmark")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
            case .current:
                Circle()
                    .fill(Palette.ochre)
                    .overlay(
                        Circle().strokeBorder(Palette.ochre.opacity(0.3), lineWidth: 5)
                            .scaleEffect(1.12)
                    )
                Image(systemName: isCheckpoint ? "flag.fill" : "star.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Color(hex: 0x2A1C00))
            case .locked:
                Circle().fill(Palette.surfaceRaised)
                Circle().strokeBorder(
                    Palette.line,
                    style: StrokeStyle(lineWidth: 1.5, dash: [4, 3])
                )
                Image(systemName: "lock.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Palette.inkSoft)
            }
            if isCheckpoint {
                Circle()
                    .strokeBorder(Palette.indigo, lineWidth: 3)
            }
        }
        .frame(width: size, height: size)
        .shadow(
            color: status == .locked ? .clear : Palette.shadow,
            radius: 12,
            x: 0,
            y: 8
        )
    }
}

/// Three woven diamonds bridging two nodes.
private struct PathTrail: View {
    var from: CGFloat
    var to: CGFloat

    var body: some View {
        VStack(spacing: 6) {
            ForEach(0..<3, id: \.self) { step in
                let progress = CGFloat(step + 1) / 4
                Diamond()
                    .fill(Palette.thread)
                    .frame(width: 7, height: 7)
                    .offset(x: from + (to - from) * progress)
            }
        }
        .padding(.vertical, Metrics.tight)
        .accessibilityHidden(true)
    }
}

private struct Diamond: Shape {
    func path(in rect: CGRect) -> Path {
        Path(diamondIn: rect)
    }
}

private extension LessonStatus {
    var accessibilityDescription: String {
        switch self {
        case .done: String(localized: "завршено")
        case .current: String(localized: "тренутна лекција")
        case .locked: String(localized: "закључано")
        }
    }
}
