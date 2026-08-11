import Foundation

@Observable
final class ProfileViewModel {
    struct Snapshot: Equatable {
        let stats: UserStats
        let week: WeekActivity
        let earned: [EarnedBadge]
        let catalog: [Badge]

        func isEarned(_ badge: Badge) -> Bool {
            earned.contains { $0.code == badge.code }
        }
    }

    private(set) var state: LoadState<Snapshot> = .idle

    func loadIfNeeded(using api: RecAPI) async {
        guard case .idle = state else { return }
        await load(using: api)
    }

    func load(using api: RecAPI) async {
        if !state.hasLoaded { state = .loading }
        do {
            async let stats = api.stats()
            async let week = api.weekActivity()
            async let earned = api.earnedBadges()
            async let catalog = api.badgeCatalog()

            state = .loaded(
                Snapshot(
                    stats: try await stats,
                    week: try await week,
                    earned: try await earned,
                    catalog: try await catalog
                )
            )
        } catch {
            state = .failed(error.learnerFacingMessage)
        }
    }
}
