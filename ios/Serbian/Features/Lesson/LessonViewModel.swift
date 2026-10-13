import Foundation

/// Drives one lesson session: fetch the exercises, submit each answer, then
/// report the score once at the end.
///
/// The correct choice is never known locally — it arrives with the answer
/// response, which is why `check()` has to await the server before the UI can
/// show feedback.
///
/// Wrong answers re-queue: an exercise the user got wrong moves to the end of
/// the queue and repeats until answered correctly, while XP counts only the
/// FIRST attempt of each exercise.
@Observable
final class LessonViewModel {
    let lesson: LessonSummary

    private(set) var state: LoadState<LessonDetail> = .idle
    private(set) var queue: [Exercise] = []
    private(set) var result: AnswerResult?
    private(set) var completedCount = 0
    private(set) var correctFirstAttemptCount = 0
    private(set) var advancedCount = 0
    private(set) var isBusy = false
    private(set) var completion: LessonCompletion?
    private(set) var errorMessage: String?

    var selectedAnswerID: String?

    private var answeredExerciseIDs = Set<String>()

    init(lesson: LessonSummary) {
        self.lesson = lesson
    }

    var exercises: [Exercise] {
        state.value?.playableExercises ?? []
    }

    var currentExercise: Exercise? {
        queue.first
    }

    /// Nothing has been answered yet, so closing loses nothing and asking would
    /// only be in the way.
    var canLeaveWithoutConfirming: Bool {
        advancedCount == 0 && selectedAnswerID == nil && result == nil
    }

    var progress: Double {
        guard !exercises.isEmpty else { return 0 }
        return Double(completedCount) / Double(exercises.count)
    }

    var hasAnswered: Bool { result != nil }

    var isLastExercise: Bool { queue.count == 1 }

    var primaryActionTitle: String {
        if !hasAnswered { return String(localized: "Провери") }
        // The run ends here only if the last remaining exercise was answered
        // correctly — a wrong answer on it just repeats.
        let finished = result?.correct == true && isLastExercise
        return finished ? String(localized: "Заврши") : String(localized: "Настави")
    }

    // MARK: - Loading

    func load(using api: RecAPI) async {
        state = .loading
        do {
            let detail = try await api.lesson(id: lesson.id)
            state = .loaded(detail)
            // `shuffleOptions` is honored once, at load — repeats of a wrong
            // answer reuse the same order rather than re-randomizing.
            queue = detail.playableExercises.map { exercise in
                exercise.payload.settings?.shuffleOptions == true ? shuffled(exercise) : exercise
            }
        } catch {
            state = .failed(error.learnerFacingMessage)
        }
    }

    private func shuffled(_ exercise: Exercise) -> Exercise {
        Exercise(
            id: exercise.id,
            type: exercise.type,
            order: exercise.order,
            payload: ExercisePayload(
                question: exercise.payload.question,
                sentence: exercise.payload.sentence,
                answers: exercise.payload.answers.shuffled(),
                settings: exercise.payload.settings
            )
        )
    }

    // MARK: - Answering

    func select(_ answerID: String) {
        guard !hasAnswered else { return }
        selectedAnswerID = answerID
    }

    func primaryAction(using api: RecAPI, session: SessionStore) async {
        if hasAnswered {
            await advance(using: api, session: session)
        } else {
            await check(using: api)
        }
    }

    private func check(using api: RecAPI) async {
        guard let exercise = currentExercise, let answerID = selectedAnswerID, !isBusy else { return }
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }

        do {
            let answer = try await api.answer(
                lessonID: lesson.id,
                exerciseID: exercise.id,
                answerID: answerID
            )
            result = answer
            SoundService.shared.play(answer.correct ? .correct : .wrong)
            // Only the first attempt of an exercise earns XP credit.
            if answer.correct && !answeredExerciseIDs.contains(exercise.id) {
                answeredExerciseIDs.insert(exercise.id)
                correctFirstAttemptCount += 1
            }
        } catch {
            // Keep the selection and stay on «Провери» — a network hiccup
            // should not cost the user their answer.
            errorMessage = error.learnerFacingMessage
        }
    }

    private func advance(using api: RecAPI, session: SessionStore) async {
        guard !isBusy, result != nil else { return }
        advancedCount += 1

        if result?.correct == true {
            if queue.count == 1 {
                // The last exercise stays on screen until completeLesson
                // confirms — a failed call would otherwise leave an empty
                // screen with the error hidden and no way to retry.
                await finish(using: api, session: session)
                return
            }
            completedCount += 1
            queue.removeFirst()
        } else {
            // Wrong answer: re-queue at the end and repeat until correct.
            queue.append(queue.removeFirst())
        }

        selectedAnswerID = nil
        result = nil
    }

    private func finish(using api: RecAPI, session: SessionStore) async {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }

        do {
            let summary = try await api.completeLesson(
                id: lesson.id,
                correctCount: correctFirstAttemptCount,
                totalCount: max(exercises.count, 1)
            )
            // The completion counts as done only now: the last exercise kept
            // its place in the queue until this call succeeded, so a failure
            // above leaves the screen — and the «Заврши» retry — intact.
            completedCount += 1
            queue = []
            result = nil
            selectedAnswerID = nil
            session.applyLessonCompletion(summary)
            completion = summary
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }

    // MARK: - Feedback helpers

    func feedback(for answer: ExerciseAnswer) -> ChoiceFeedback {
        guard let result else {
            return selectedAnswerID == answer.id ? .selected : .neutral
        }
        if answer.id == result.correctAnswerId { return .correct }
        if answer.id == selectedAnswerID { return .wrong }
        return .neutral
    }

    enum ChoiceFeedback {
        case neutral
        case selected
        case correct
        case wrong
    }
}
