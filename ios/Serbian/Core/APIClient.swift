import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case patch = "PATCH"
}

struct APIRequest {
    var method: HTTPMethod = .get
    var path: String
    var query: [URLQueryItem] = []
    var body: Data?
    var requiresAuthentication = true

    static func get(_ path: String, query: [URLQueryItem] = [], authenticated: Bool = true) -> APIRequest {
        APIRequest(method: .get, path: path, query: query, requiresAuthentication: authenticated)
    }

    static func post<Body: Encodable>(
        _ path: String,
        body: Body,
        authenticated: Bool = true
    ) throws -> APIRequest {
        APIRequest(
            method: .post,
            path: path,
            body: try RecCoder.encoder.encode(body),
            requiresAuthentication: authenticated
        )
    }

    static func patch<Body: Encodable>(_ path: String, body: Body) throws -> APIRequest {
        APIRequest(method: .patch, path: path, body: try RecCoder.encoder.encode(body))
    }
}

/// Transport layer: builds requests, attaches the bearer token and transparently
/// refreshes it once when the API answers 401.
final class APIClient {
    var baseURL: URL
    private let session: URLSession
    private let tokenStore: TokenStoring
    /// Coalesces concurrent 401s into a single refresh call.
    private var refreshTask: Task<AuthTokens, any Error>?

    /// Called when refreshing fails and the learner has to sign in again.
    var onAuthenticationLost: (() -> Void)?

    init(baseURL: URL = AppConfiguration.baseURL, tokenStore: TokenStoring) {
        self.baseURL = baseURL
        self.tokenStore = tokenStore

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 20
        configuration.waitsForConnectivity = false
        self.session = URLSession(configuration: configuration)
    }

    var isAuthenticated: Bool { tokenStore.tokens != nil }

    func store(_ tokens: AuthTokens) {
        tokenStore.save(tokens)
    }

    func signOut() {
        refreshTask?.cancel()
        refreshTask = nil
        tokenStore.clear()
    }

    // MARK: - Sending

    func send<Response: Decodable>(_ request: APIRequest, as type: Response.Type) async throws -> Response {
        let data = try await perform(request, allowRefresh: true)
        do {
            return try RecCoder.decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(String(describing: error))
        }
    }

    @discardableResult
    func send(_ request: APIRequest) async throws -> Data {
        try await perform(request, allowRefresh: true)
    }

    private func perform(_ request: APIRequest, allowRefresh: Bool) async throws -> Data {
        var urlRequest = try makeURLRequest(request)

        if request.requiresAuthentication {
            guard let accessToken = tokenStore.tokens?.accessToken else {
                throw APIError.unauthorized
            }
            urlRequest.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch let error as URLError {
            throw APIError.fromURLError(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.transport("Неочекиван одговор сервера.")
        }

        if http.statusCode == 401, request.requiresAuthentication, allowRefresh {
            _ = try await refreshedTokens()
            return try await perform(request, allowRefresh: false)
        }

        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { throw APIError.unauthorized }
            throw APIError.fromResponse(status: http.statusCode, data: data)
        }

        return data
    }

    private func makeURLRequest(_ request: APIRequest) throws -> URLRequest {
        guard var components = URLComponents(
            url: baseURL.appendingPathComponent(request.path),
            resolvingAgainstBaseURL: false
        ) else {
            throw APIError.invalidURL
        }
        if !request.query.isEmpty {
            components.queryItems = request.query
        }
        guard let url = components.url else { throw APIError.invalidURL }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body = request.body {
            urlRequest.httpBody = body
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        return urlRequest
    }

    // MARK: - Refresh

    private func refreshedTokens() async throws -> AuthTokens {
        if let refreshTask {
            return try await refreshTask.value
        }

        guard let current = tokenStore.tokens else {
            throw APIError.unauthorized
        }

        let task = Task { [weak self] () throws -> AuthTokens in
            guard let self else { throw APIError.unauthorized }
            let request = try APIRequest.post(
                "auth/refresh",
                body: RefreshRequest(refreshToken: current.refreshToken),
                authenticated: false
            )
            let data = try await self.perform(request, allowRefresh: false)
            let response = try RecCoder.decoder.decode(AuthResponse.self, from: data)
            return response.tokens
        }
        refreshTask = task
        defer { refreshTask = nil }

        do {
            let tokens = try await task.value
            tokenStore.save(tokens)
            return tokens
        } catch {
            tokenStore.clear()
            onAuthenticationLost?()
            throw APIError.unauthorized
        }
    }
}
