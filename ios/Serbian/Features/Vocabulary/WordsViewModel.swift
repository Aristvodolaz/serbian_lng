import Foundation

/// Backs the dictionary tab: a searchable list of published words with
/// offset-based pagination, plus the grammar-attribute dictionaries resolved
/// once so word cards can render localized labels.
@Observable
final class WordsViewModel {
    private(set) var state: LoadState<[Word]> = .idle
    private(set) var total = 0
    private(set) var isLoadingMore = false
    private(set) var attributes: WordAttributes?
    private(set) var errorMessage: String?

    var searchText = ""

    private var debounceTask: Task<Void, Never>?
    private var generation = 0
    private var appliedSearch = ""
    private let pageSize = 50

    var words: [Word] { state.value ?? [] }
    var hasMore: Bool { words.count < total }

    func loadIfNeeded(using api: RecAPI) async {
        guard case .idle = state else { return }
        await load(using: api)
    }

    func load(using api: RecAPI) async {
        state = .loading
        errorMessage = nil
        do {
            async let attributes = api.wordAttributes()
            let page = try await api.words(limit: pageSize, offset: 0)
            self.attributes = try await attributes
            appliedSearch = ""
            total = page.total
            print("[REČ] words: \(page.items.count)/\(page.total), атрибуты загружены: \(self.attributes != nil)")
            state = .loaded(page.items)
        } catch {
            print("[REČ] words error: \(String(describing: error))")
            state = .failed(error.learnerFacingMessage)
        }
    }

    /// Debounced server search; the view calls this on every keystroke.
    func search(_ text: String, using api: RecAPI) {
        searchText = text
        debounceTask?.cancel()
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        debounceTask = Task {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else { return }
            await performSearch(trimmed, using: api)
        }
    }

    func loadMore(using api: RecAPI) async {
        guard hasMore, !isLoadingMore, let current = state.value else { return }
        isLoadingMore = true
        errorMessage = nil
        let generationAtStart = generation
        defer { isLoadingMore = false }

        do {
            let page = try await api.words(
                search: appliedSearch.isEmpty ? nil : appliedSearch,
                limit: pageSize,
                offset: current.count
            )
            guard generationAtStart == generation else { return }
            total = page.total
            print("[REČ] words подгрузка offset=\(current.count) → +\(page.items.count) (всего \(current.count + page.items.count)/\(page.total))")
            state = .loaded(current + page.items)
        } catch {
            guard generationAtStart == generation else { return }
            print("[REČ] words подгрузка error: \(String(describing: error))")
            errorMessage = error.learnerFacingMessage
        }
    }

    private func performSearch(_ text: String, using api: RecAPI) async {
        generation += 1
        let generationAtStart = generation
        // Keep the current list on screen while a new query loads.
        if state.value == nil { state = .loading }
        errorMessage = nil

        do {
            let page = try await api.words(
                search: text.isEmpty ? nil : text,
                limit: pageSize,
                offset: 0
            )
            guard generationAtStart == generation else { return }
            appliedSearch = text
            total = page.total
            print("[REČ] words поиск «\(text)» → \(page.items.count)/\(page.total)")
            state = .loaded(page.items)
        } catch {
            guard generationAtStart == generation else { return }
            print("[REČ] words поиск «\(text)» error: \(String(describing: error))")
            if state.value == nil {
                state = .failed(error.learnerFacingMessage)
            } else {
                errorMessage = error.learnerFacingMessage
            }
        }
    }
}
