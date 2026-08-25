import Foundation

/// One typed method per REČ API endpoint. Paths mirror the NestJS controllers,
/// so this file is the only place that knows about URLs.
final class RecAPI {
    private let client: APIClient

    init(client: APIClient) {
        self.client = client
    }

    var baseURL: URL {
        get { client.baseURL }
        set { client.baseURL = newValue }
    }

    var isAuthenticated: Bool { client.isAuthenticated }

    var onAuthenticationLost: (() -> Void)? {
        get { client.onAuthenticationLost }
        set { client.onAuthenticationLost = newValue }
    }

    // MARK: - auth

    func register(
        email: String,
        password: String,
        displayName: String,
        scriptPreference: ScriptPreference,
        languagePreference: LanguagePreference
    ) async throws -> AuthResponse {
        let request = try APIRequest.post(
            "auth/register",
            body: RegisterRequest(
                email: email,
                password: password,
                displayName: displayName,
                scriptPreference: scriptPreference,
                languagePreference: languagePreference
            ),
            authenticated: false
        )
        let response = try await client.send(request, as: AuthResponse.self)
        client.store(response.tokens)
        return response
    }

    func signIn(email: String, password: String) async throws -> AuthResponse {
        let request = try APIRequest.post(
            "auth/login",
            body: LoginRequest(email: email, password: password),
            authenticated: false
        )
        let response = try await client.send(request, as: AuthResponse.self)
        client.store(response.tokens)
        return response
    }

    func signOut() {
        client.signOut()
    }

    // MARK: - users

    func currentUser() async throws -> UserProfile {
        try await client.send(.get("users/me"), as: UserProfile.self)
    }

    func updateProfile(
        displayName: String? = nil,
        scriptPreference: ScriptPreference? = nil,
        languagePreference: LanguagePreference? = nil
    ) async throws -> UserProfile {
        let request = try APIRequest.patch(
            "users/me",
            body: UpdateProfileRequest(
                displayName: displayName,
                scriptPreference: scriptPreference,
                languagePreference: languagePreference
            )
        )
        return try await client.send(request, as: UserProfile.self)
    }

    func stats() async throws -> UserStats {
        try await client.send(.get("users/me/stats"), as: UserStats.self)
    }

    func weekActivity() async throws -> WeekActivity {
        try await client.send(.get("users/me/week"), as: WeekActivity.self)
    }

    // MARK: - content

    func learningPath() async throws -> LearningPath {
        try await client.send(.get("units"), as: LearningPath.self)
    }

    func lesson(id: String) async throws -> LessonDetail {
        try await client.send(.get("lessons/\(id)"), as: LessonDetail.self)
    }

    func answer(lessonID: String, exerciseID: String, choiceID: String) async throws -> AnswerResult {
        let request = try APIRequest.post(
            "lessons/\(lessonID)/exercises/\(exerciseID)/answer",
            body: AnswerExerciseRequest(choiceId: choiceID)
        )
        return try await client.send(request, as: AnswerResult.self)
    }

    func completeLesson(
        id: String,
        correctCount: Int,
        totalCount: Int
    ) async throws -> LessonCompletion {
        let request = try APIRequest.post(
            "lessons/\(id)/complete",
            body: CompleteLessonRequest(correctCount: correctCount, totalCount: totalCount)
        )
        return try await client.send(request, as: LessonCompletion.self)
    }

    // MARK: - vocabulary

    func reviewQueue(limit: Int = 20) async throws -> [ReviewWord] {
        try await client.send(
            .get("vocabulary/review", query: [URLQueryItem(name: "limit", value: String(limit))]),
            as: [ReviewWord].self
        )
    }

    func submitReview(wordID: String, outcome: ReviewOutcome) async throws -> ReviewSubmission {
        let request = try APIRequest.post(
            "vocabulary/\(wordID)/review",
            body: SubmitReviewRequest(result: outcome)
        )
        return try await client.send(request, as: ReviewSubmission.self)
    }

    // MARK: - badges

    func badgeCatalog() async throws -> [Badge] {
        try await client.send(.get("badges"), as: [Badge].self)
    }

    func earnedBadges() async throws -> [EarnedBadge] {
        try await client.send(.get("badges/me"), as: [EarnedBadge].self)
    }

    // MARK: - tts

    func speak(_ text: String) async throws -> Data {
        try await client.send(
            .get(
                "tts/speak",
                query: [URLQueryItem(name: "text", value: text)],
                authenticated: false
            )
        )
    }
}
