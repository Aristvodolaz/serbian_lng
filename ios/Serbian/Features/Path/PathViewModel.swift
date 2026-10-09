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
            let path = try await api.learningPath()
            let units = path.units.count
            let lessons = path.units.reduce(0) { $0 + $1.lessons.count }
            print("[REČ] units: \(units) юнитов, \(lessons) уроков")
            state = .loaded(path)
        } catch {
            print("[REČ] units error: \(String(describing: error))")
            state = .failed(error.learnerFacingMessage)
        }
    }
}
