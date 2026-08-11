import Foundation

/// The four states every remote-backed screen can be in.
enum LoadState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(String)

    var value: Value? {
        if case .loaded(let value) = self { return value }
        return nil
    }

    var errorMessage: String? {
        if case .failed(let message) = self { return message }
        return nil
    }

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }

    var hasLoaded: Bool { value != nil }
}

extension Error {
    /// Messages from `APIError` are already learner-facing Serbian; anything else
    /// falls back to the system description.
    var learnerFacingMessage: String {
        if let apiError = self as? APIError {
            return apiError.errorDescription ?? localizedDescription
        }
        return localizedDescription
    }
}
