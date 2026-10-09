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
                    correctCount: model.correctCount,
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
            VStack(alignment: .leading, spacing: 4) {
                EyebrowLabel(text: eyebrow(for: exercise))
                prompt(for: exercise)
            }

            VStack(spacing: 9) {
                ForEach(exercise.payload.answers) { answer in
                    ChoiceRow(
                        text: choiceText(for: answer, in: exercise),
                        feedback: model.feedback(for: answer)
                    ) {
                        model.select(answer.id)
                    }
                    .disabled(model.hasAnswered)
                }
            }

            if let message = model.errorMessage {
                InlineMessage(text: message)
            }

            if let result = model.result {
                InlineMessage(
                    text: result.correct
                        ? String(localized: "Тачно!")
                        : String(localized: "Још једном — тачан одговор је означен."),
                    tone: result.correct ? .success : .error
                )
            }

            Spacer(minLength: Metrics.regular)

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
        .animation(.easeOut(duration: 0.2), value: model.result)
        .animation(.easeOut(duration: 0.15), value: model.selectedAnswerID)
    }

    private func eyebrow(for exercise: Exercise) -> LocalizedStringKey {
        switch exercise.type {
        case .translationChoice: return "Преведите реч"
        case .fillWord: return "Попуните празнину"
        case .unknown: return "Вежба"
        }
    }

    /// Cyrillic leads, the transliteration sits underneath — the alphabet is
    /// learned in passing rather than in a separate drill.
    private func prompt(for exercise: Exercise) -> some View {
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
            if exercise.type == .fillWord,
               let translation = exercise.promptTranslation(matching: session.languagePreference),
               !translation.isEmpty,
               exercise.payload.settings?.showSentenceTranslation ?? true {
                Text(translation)
                    .font(.recCallout)
                    .foregroundStyle(Palette.inkSoft)
            }
        }
        .accessibilityElement(children: .combine)
    }

    /// `translation_choice` shows the answer's translation (the question is the
    /// Serbian word, so its own translation would give the answer away);
    /// `fill_word` shows the Serbian word to insert into the blank.
    private func choiceText(for answer: ExerciseAnswer, in exercise: Exercise) -> String {
        switch exercise.type {
        case .translationChoice:
            return answer.translation(matching: session.languagePreference) ?? ""
        case .fillWord:
            return answer.serbian(script: session.scriptPreference) ?? ""
        case .unknown:
            return answer.serbian(script: session.scriptPreference) ?? ""
        }
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
