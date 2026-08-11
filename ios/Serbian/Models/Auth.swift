import Foundation

/// The pair of JWTs issued by `/auth/*`. Persisted in the keychain.
struct AuthTokens: Codable, Equatable, Sendable {
    let accessToken: String
    let refreshToken: String
}

/// `AuthResponseDto`
struct AuthResponse: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let user: UserProfile

    var tokens: AuthTokens {
        AuthTokens(accessToken: accessToken, refreshToken: refreshToken)
    }
}

/// `RegisterDto`
struct RegisterRequest: Encodable, Sendable {
    let email: String
    let password: String
    let displayName: String
    let scriptPreference: ScriptPreference
}

/// `LoginDto`
struct LoginRequest: Encodable, Sendable {
    let email: String
    let password: String
}

/// `RefreshDto`
struct RefreshRequest: Encodable, Sendable {
    let refreshToken: String
}

/// `UpdateUserDto`
struct UpdateProfileRequest: Encodable, Sendable {
    var displayName: String?
    var scriptPreference: ScriptPreference?
}
