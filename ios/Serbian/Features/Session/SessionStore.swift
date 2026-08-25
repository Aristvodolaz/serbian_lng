import Foundation

/// Owns authentication state and the signed-in learner. Every screen reaches the
/// API through `session.api`, so there is a single place that knows whether we
/// are signed in.
@Observable
final class SessionStore {
    enum Phase: Equatable {
        case launching
        case signedOut
        case signedIn
    }

    private(set) var phase: Phase = .launching
    private(set) var user: UserProfile?

    let api: RecAPI

    init(tokenStore: TokenStoring = KeychainTokenStore()) {
        let client = APIClient(tokenStore: tokenStore)
        self.api = RecAPI(client: client)

        api.onAuthenticationLost = { [weak self] in
            self?.handleAuthenticationLost()
        }
    }

    var serverURL: URL {
        get { api.baseURL }
        set {
            AppConfiguration.overrideBaseURL = newValue
            api.baseURL = newValue
        }
    }

    // MARK: - Lifecycle

    /// Called once at launch: a stored refresh token means we can go straight to
    /// the lesson path.
    func restore() async {
        guard api.isAuthenticated else {
            phase = .signedOut
            return
        }
        do {
            user = try await api.currentUser()
            phase = .signedIn
        } catch APIError.unauthorized {
            api.signOut()
            phase = .signedOut
        } catch {
            // A dead server shouldn't wipe a valid session — keep the learner in
            // and let each screen surface its own error.
            phase = .signedIn
        }
    }

    func register(
        email: String,
        password: String,
        displayName: String,
        scriptPreference: ScriptPreference,
        languagePreference: LanguagePreference
    ) async throws {
        let response = try await api.register(
            email: email,
            password: password,
            displayName: displayName,
            scriptPreference: scriptPreference,
            languagePreference: languagePreference
        )
        user = response.user
        phase = .signedIn
    }

    func signIn(email: String, password: String) async throws {
        let response = try await api.signIn(email: email, password: password)
        user = response.user
        phase = .signedIn
    }

    func signOut() {
        api.signOut()
        user = nil
        phase = .signedOut
    }

    // MARK: - Profile

    func refreshUser() async {
        guard phase == .signedIn else { return }
        if let refreshed = try? await api.currentUser() {
            user = refreshed
        }
    }

    func updateScriptPreference(_ preference: ScriptPreference) async throws {
        user = try await api.updateProfile(scriptPreference: preference)
    }

    func updateLanguagePreference(_ preference: LanguagePreference) async throws {
        user = try await api.updateProfile(languagePreference: preference)
    }

    func updateDisplayName(_ name: String) async throws {
        user = try await api.updateProfile(displayName: name)
    }

    /// Lesson completion is the only thing that moves XP and the streak, so the
    /// header can be updated from its response without another round trip.
    func applyLessonCompletion(_ completion: LessonCompletion) {
        user = user?.updating(xp: completion.totalXp, streakDays: completion.streakDays)
    }

    var scriptPreference: ScriptPreference {
        user?.scriptPreference ?? .both
    }

    var languagePreference: LanguagePreference {
        user?.languagePreference ?? .ru
    }

    var displayName: String {
        user?.displayName ?? String(localized: "Ученик")
    }

    private func handleAuthenticationLost() {
        user = nil
        phase = .signedOut
    }
}
