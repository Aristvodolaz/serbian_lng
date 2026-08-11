import Foundation

@Observable
final class FlashcardsViewModel {
    private(set) var state: LoadState<[ReviewWord]> = .idle
    private(set) var index = 0
    private(set) var isSubmitting = false
    private(set) var reviewedCount = 0
    private(set) var earnedBadges: [EarnedBadge] = []
    private(set) var errorMessage: String?

    /// A flashcard hides the translation until the learner commits to a guess.
    var isRevealed = false

    private var queue: [ReviewWord] { state.value ?? [] }

    var currentWord: ReviewWord? {
        queue.indices.contains(index) ? queue[index] : nil
    }

    var total: Int { queue.count }

    var positionLabel: String {
        String(localized: "\(min(index + 1, max(total, 1))) / \(total) речи")
    }

    var isFinished: Bool { !queue.isEmpty && index >= queue.count }

    func loadIfNeeded(using api: RecAPI) async {
        guard case .idle = state else { return }
        await load(using: api)
    }

    func load(using api: RecAPI) async {
        state = .loading
        index = 0
        isRevealed = false
        reviewedCount = 0
        earnedBadges = []
        errorMessage = nil

        do {
            state = .loaded(try await api.reviewQueue(limit: 15))
        } catch {
            state = .failed(error.learnerFacingMessage)
        }
    }

    func submit(_ outcome: ReviewOutcome, using api: RecAPI) async {
        guard let word = currentWord, !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        do {
            let submission = try await api.submitReview(wordID: word.wordId, outcome: outcome)
            earnedBadges.append(contentsOf: submission.newBadges)
            reviewedCount += 1
            advance()
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }

    private func advance() {
        isRevealed = false
        index += 1
    }
}
