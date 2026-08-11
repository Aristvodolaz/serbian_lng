import Foundation

/// Drives one lesson session: fetch the exercises, submit each answer, then
/// report the score once at the end.
///
/// The correct choice is never known locally — it arrives with the answer
/// response, which is why `check()` has to await the server before the UI can
/// show feedback.
@Observable
final class LessonViewModel {
    let lesson: LessonSummary

    private(set) var state: LoadState<LessonDetail> = .idle
    private(set) var exerciseIndex = 0
    private(set) var result: AnswerResult?
    private(set) var correctCount = 0
    private(set) var isBusy = false
    private(set) var completion: LessonCompletion?
    private(set) var errorMessage: String?

    var selectedChoiceID: String?

    init(lesson: LessonSummary) {
        self.lesson = lesson
    }

    var exercises: [Exercise] {
        state.value?.playableExercises ?? []
    }

    var currentExercise: Exercise? {
        exercises.indices.contains(exerciseIndex) ? exercises[exerciseIndex] : nil
    }

    /// Nothing has been answered yet, so closing loses nothing and asking would
    /// only be in the way.
    var canLeaveWithoutConfirming: Bool {
        exerciseIndex == 0 && selectedChoiceID == nil && result == nil
    }

    var progress: Double {
        guard !exercises.isEmpty else { return 0 }
        let answered = Double(exerciseIndex) + (result == nil ? 0 : 1)
        return answered / Double(exercises.count)
    }

    var hasAnswered: Bool { result != nil }

    var isLastExercise: Bool { exerciseIndex >= exercises.count - 1 }

    var primaryActionTitle: String {
        if !hasAnswered { return String(localized: "Провери") }
        return isLastExercise ? String(localized: "Заврши") : String(localized: "Настави")
    }

    // MARK: - Loading

    func load(using api: RecAPI) async {
        state = .loading
        do {
            state = .loaded(try await api.lesson(id: lesson.id))
        } catch {
            state = .failed(error.learnerFacingMessage)
        }
    }

    // MARK: - Answering

    func select(_ choiceID: String) {
        guard !hasAnswered else { return }
        selectedChoiceID = choiceID
    }

    func primaryAction(using api: RecAPI, session: SessionStore) async {
        if hasAnswered {
            await advance(using: api, session: session)
        } else {
            await check(using: api)
        }
    }

    private func check(using api: RecAPI) async {
        guard let exercise = currentExercise, let choiceID = selectedChoiceID, !isBusy else { return }
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }

        do {
            let answer = try await api.answer(
                lessonID: lesson.id,
                exerciseID: exercise.id,
                choiceID: choiceID
            )
            result = answer
            if answer.correct { correctCount += 1 }
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }

    private func advance(using api: RecAPI, session: SessionStore) async {
        guard !isBusy else { return }

        if isLastExercise {
            await finish(using: api, session: session)
            return
        }

        exerciseIndex += 1
        selectedChoiceID = nil
        result = nil
    }

    private func finish(using api: RecAPI, session: SessionStore) async {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }

        do {
            let summary = try await api.completeLesson(
                id: lesson.id,
                correctCount: correctCount,
                totalCount: max(exercises.count, 1)
            )
            session.applyLessonCompletion(summary)
            completion = summary
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }

    // MARK: - Feedback helpers

    func feedback(for choice: ExerciseChoice) -> ChoiceFeedback {
        guard let result else {
            return selectedChoiceID == choice.id ? .selected : .neutral
        }
        if choice.id == result.correctChoiceId { return .correct }
        if choice.id == selectedChoiceID { return .wrong }
        return .neutral
    }

    enum ChoiceFeedback {
        case neutral
        case selected
        case correct
        case wrong
    }
}
