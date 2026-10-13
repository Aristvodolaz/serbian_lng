import SwiftUI

struct LessonScreen: View {
    let lesson: LessonSummary
    var onFinish: () -> Void

    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var model: LessonViewModel
    @State private var isConfirmingExit = false

    init(lesson: LessonSummary, onFinish: @escaping () -> Void) {
        self.lesson = lesson
        self.onFinish = onFinish
        _model = State(initialValue: LessonViewModel(lesson: lesson))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.loose) {
            topBar

            switch model.state {
            case .idle, .loading:
                LoadingView()
            case .failed(let message):
                ErrorStateView(message: message) {
                    Task { await model.load(using: session.api) }
                }
            case .loaded:
                if let exercise = model.currentExercise {
                    exerciseBody(exercise)
                } else {
                    EmptyStateView(
                        title: "Лекција је празна",
                        message: "Ова лекција још нема вежбе."
                    )
                }
            }
        }
        .padding(.horizontal, Metrics.screenPadding)
        .padding(.top, Metrics.tight)
        .padding(.bottom, Metrics.regular)
        .groundBackground()
        .task { await model.load(using: session.api) }
        .overlay {
            if let completion = model.completion {
                LessonCompletionView(
                    completion: completion,
                    correctCount: model.correctFirstAttemptCount,
                    totalCount: model.exercises.count
                ) {
                    onFinish()
                    dismiss()
                }
                .transition(.opacity)
            }
        }
        .animation(.easeOut(duration: 0.25), value: model.completion)
        // A wrong answer should feel different from a right one, not just look it.
        .sensoryFeedback(trigger: model.result) { _, answer in
            guard let answer else { return nil }
            return answer.correct ? .success : .error
        }
        .sensoryFeedback(.success, trigger: model.completion != nil)
        .confirmationDialog(
            "Прекинути лекцију?",
            isPresented: $isConfirmingExit,
            titleVisibility: .visible
        ) {
            Button("Прекини", role: .destructive) { dismiss() }
            Button("Настави лекцију", role: .cancel) {}
        } message: {
            Text("Напредак у овој лекцији неће бити сачуван.")
        }
    }

    private var topBar: some View {
        HStack(spacing: Metrics.regular) {
            Button {
                if model.canLeaveWithoutConfirming {
                    dismiss()
                } else {
                    isConfirmingExit = true
                }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Palette.inkSoft)
                    .frame(width: Metrics.minimumTapTarget, height: Metrics.minimumTapTarget)
            }
            .accessibilityLabel("Затвори лекцију")

            ProgressTrack(value: model.progress)
        }
    }

    private func exerciseBody(_ exercise: Exercise) -> some View {
        VStack(alignment: .leading, spacing: Metrics.loose) {
            // One case per exercise type: the extension point for new types is a
            // new body view here, not another branch inside a shared renderer.
            switch exercise.type {
            case .translationChoice:
                TranslationChoiceBody(exercise: exercise, model: model, eyebrow: "Преведите реч", showTranslationChoices: true)
            case .fillWord:
                FillWordBody(exercise: exercise, model: model)
            case .unknown:
                TranslationChoiceBody(exercise: exercise, model: model, eyebrow: "Вежба", showTranslationChoices: false)
            }

            if let message = model.errorMessage {
                InlineMessage(text: message)
            }

            Spacer(minLength: Metrics.regular)

            if let result = model.result {
                FeedbackPanel(
                    correct: result.correct,
                    title: result.correct ? "Тачно!" : "Није тачно",
                    detail: result.correct ? nil : correctAnswerText(for: result),
                    actionTitle: model.primaryActionTitle,
                    isBusy: model.isBusy
                ) {
                    Task { await model.primaryAction(using: session.api, session: session) }
                }
            } else {
                Button {
                    Task { await model.primaryAction(using: session.api, session: session) }
                } label: {
                    if model.isBusy {
                        ProgressView().tint(Palette.onIndigo)
                    } else {
                        Text(model.primaryActionTitle)
                    }
                }
                .buttonStyle(.recPrimary)
                .disabled(model.selectedAnswerID == nil || model.isBusy)
            }
        }
        .animation(.easeOut(duration: 0.2), value: model.result)
        .animation(.easeOut(duration: 0.15), value: model.selectedAnswerID)
    }

    /// «Тачан одговор: шумa · лес» — Serbian in the learner's script plus the
    /// translation, so a miss is teachable rather than just marked.
    private func correctAnswerText(for result: AnswerResult) -> String? {
        guard let answer = result.correctAnswer,
              let serbian = answer.serbian(script: session.scriptPreference),
              !serbian.isEmpty else { return nil }
        let translation = answer.translation(matching: session.languagePreference) ?? ""
        if translation.isEmpty {
            return String(localized: "Тачан одговор: \(serbian)")
        }
        return String(localized: "Тачан одговор: \(serbian) · \(translation)")
    }
}

/// Per-type exercise bodies. The `switch` in `exerciseBody` selects one; a new
/// exercise type means a new body view here plus one case — no shared
/// per-type rendering logic and no registries (that's an F10 decision).
private struct TranslationChoiceBody: View {
    @Environment(SessionStore.self) private var session
    let exercise: Exercise
    let model: LessonViewModel
    var eyebrow: LocalizedStringKey
    /// `translation_choice` shows the answer's translation (the question is the
    /// Serbian word, so its own translation would give the answer away);
    /// fallback rendering of an unknown type shows the Serbian word instead.
    var showTranslationChoices: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.loose) {
            VStack(alignment: .leading, spacing: 4) {
                EyebrowLabel(text: eyebrow)
                prompt
            }

            VStack(spacing: 9) {
                ForEach(exercise.payload.answers) { answer in
                    ChoiceRow(
                        text: showTranslationChoices
                            ? answer.translation(matching: session.languagePreference) ?? ""
                            : answer.serbian(script: session.scriptPreference) ?? "",
                        feedback: model.feedback(for: answer)
                    ) {
                        model.select(answer.id)
                    }
                    .disabled(model.hasAnswered)
                }
            }
        }
    }

    /// Cyrillic leads, the transliteration sits underneath — the alphabet is
    /// learned in passing rather than in a separate drill.
    private var prompt: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(exercise.prompt(script: session.scriptPreference) ?? "")
                .font(.recSentence)
                .foregroundStyle(Palette.ink)
            if session.scriptPreference == .both,
               let latin = exercise.prompt(script: .latin),
               latin != exercise.prompt(script: .cyrillic) {
                Text(latin)
                    .font(.recCallout)
                    .italic()
                    .foregroundStyle(Palette.oxblood)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

private struct FillWordBody: View {
    @Environment(SessionStore.self) private var session
    let exercise: Exercise
    let model: LessonViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.loose) {
            VStack(alignment: .leading, spacing: 4) {
                EyebrowLabel(text: "Попуните празнину")
                prompt
            }

            VStack(spacing: 9) {
                ForEach(exercise.payload.answers) { answer in
                    ChoiceRow(
                        text: answer.serbian(script: session.scriptPreference) ?? "",
                        feedback: model.feedback(for: answer)
                    ) {
                        model.select(answer.id)
                    }
                    .disabled(model.hasAnswered)
                }
            }
        }
    }

    private var prompt: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let sentence = exercise.prompt(script: session.scriptPreference) {
                fillWordSentence(sentence)
                    .font(.recSentence)
                    .foregroundStyle(Palette.ink)
            }
            if session.scriptPreference == .both,
               let latin = exercise.prompt(script: .latin),
               latin != exercise.prompt(script: .cyrillic) {
                Text(latin)
                    .font(.recCallout)
                    .italic()
                    .foregroundStyle(Palette.oxblood)
            }
            if let translation = exercise.promptTranslation(matching: session.languagePreference),
               !translation.isEmpty,
               exercise.payload.settings?.showSentenceTranslation ?? true {
                Text(translation)
                    .font(.recCallout)
                    .foregroundStyle(Palette.inkSoft)
            }
        }
        .accessibilityElement(children: .combine)
    }

    /// Renders the fill_word sentence with the `____` gap highlighted — the
    /// blank is the thing being asked about, so it shouldn't read as ordinary
    /// text.
    private func fillWordSentence(_ sentence: String) -> Text {
        var styled = Text("")
        for (index, part) in sentence.components(separatedBy: "____").enumerated() {
            if index > 0 {
                styled = styled + Text("____").fontWeight(.bold).foregroundColor(Palette.ochre)
            }
            if !part.isEmpty {
                styled = styled + Text(part)
            }
        }
        return styled
    }
}

private struct ChoiceRow: View {
    var text: String
    var feedback: LessonViewModel.ChoiceFeedback
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(text)
                    .font(.recCallout)
                    .fontWeight(feedback == .correct ? .bold : .regular)
                    .foregroundStyle(foreground)
                Spacer()
                if let symbol {
                    Image(systemName: symbol)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(foreground)
                }
            }
            .padding(.horizontal, 14)
            .frame(minHeight: Metrics.minimumTapTarget + 4)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(background)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(border, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
        .accessibilityValue(accessibilityValue ?? "")
        .accessibilityAddTraits(.isButton)
    }

    /// VoiceOver reads the outcome of the last check along with the option.
    private var accessibilityValue: String? {
        switch feedback {
        case .correct: String(localized: "тачан одговор")
        case .wrong: String(localized: "погрешан одговор")
        case .neutral, .selected: nil
        }
    }

    private var foreground: Color {
        switch feedback {
        case .neutral, .selected: Palette.ink
        case .correct: Palette.good
        case .wrong: Palette.oxblood
        }
    }

    private var background: Color {
        switch feedback {
        case .neutral: Palette.surface
        case .selected: Palette.indigo.opacity(0.08)
        case .correct: Palette.good.opacity(0.12)
        case .wrong: Palette.oxblood.opacity(0.10)
        }
    }

    private var border: Color {
        switch feedback {
        case .neutral: Palette.line
        case .selected: Palette.indigo
        case .correct: Palette.good
        case .wrong: Palette.oxblood
        }
    }

    private var symbol: String? {
        switch feedback {
        case .neutral, .selected: nil
        case .correct: "checkmark"
        case .wrong: "xmark"
        }
    }
}

/// Shown once `POST /lessons/:id/complete` returns: earned XP, the streak and any
/// badge the backend just awarded.
private struct LessonCompletionView: View {
    var completion: LessonCompletion
    var correctCount: Int
    var totalCount: Int
    var onDismiss: () -> Void

    var body: some View {
        ZStack {
            Palette.ground.ignoresSafeArea()

            VStack(spacing: Metrics.regular) {
                KilimRule(tint: Palette.ochre, opacity: 0.6)
                    .frame(width: 120)

                Text("Лекција завршена")
                    .font(.recDisplay)
                    .foregroundStyle(Palette.ink)

                Text("Lekcija završena")
                    .font(.recCallout)
                    .italic()
                    .foregroundStyle(Palette.oxblood)

                HStack(spacing: Metrics.tight) {
                    StatCard(value: "+\(completion.xpEarned)", label: "XP")
                    StatCard(value: "\(correctCount)/\(max(totalCount, 1))", label: "тачно")
                    StatCard(value: "\(completion.streakDays)", label: "низ")
                }
                .padding(.top, Metrics.tight)

                if !completion.newBadges.isEmpty {
                    VStack(spacing: Metrics.tight) {
                        Text("Ново достигнуће")
                            .font(.recEyebrow)
                            .tracking(1)
                            .foregroundStyle(Palette.inkSoft)

                        ForEach(completion.newBadges) { badge in
                            HStack(spacing: Metrics.tight) {
                                DiamondBadge(isEarned: true, size: 26)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(badge.titleCyrillic)
                                        .font(.recCalloutStrong)
                                        .foregroundStyle(Palette.ink)
                                    Text(badge.details)
                                        .font(.recCaption)
                                        .foregroundStyle(Palette.inkSoft)
                                }
                                Spacer()
                            }
                        }
                    }
                    .padding(.top, Metrics.tight)
                }

                Spacer()

                Button("Настави", action: onDismiss)
                    .buttonStyle(.recPrimary)
            }
            .padding(.horizontal, Metrics.screenPadding)
            .padding(.top, Metrics.loose * 2)
            .padding(.bottom, Metrics.regular)
        }
    }
}
