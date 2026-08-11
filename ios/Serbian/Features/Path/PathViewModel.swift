import Foundation

@Observable
final class PathViewModel {
    private(set) var state: LoadState<LearningPath> = .idle
    /// The lesson opened as a full-screen exercise session.
    var activeLesson: LessonSummary?

    func loadIfNeeded(using api: RecAPI) async {
        guard case .idle = state else { return }
        await load(using: api)
    }

    func load(using api: RecAPI) async {
        if !state.hasLoaded { state = .loading }
        do {
            state = .loaded(try await api.learningPath())
        } catch {
            state = .failed(error.learnerFacingMessage)
        }
    }
}
