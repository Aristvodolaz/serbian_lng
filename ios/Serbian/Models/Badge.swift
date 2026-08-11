import Foundation

/// `BadgeResponseDto`
struct Badge: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let code: String
    let titleCyrillic: String
    let titleLatin: String
    /// `description` on the wire; renamed to avoid shadowing
    /// `CustomStringConvertible`.
    let details: String

    private enum CodingKeys: String, CodingKey {
        case id, code, titleCyrillic, titleLatin
        case details = "description"
    }
}

/// `EarnedBadgeResponseDto`
struct EarnedBadge: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let code: String
    let titleCyrillic: String
    let titleLatin: String
    let details: String
    let earnedAt: Date

    private enum CodingKeys: String, CodingKey {
        case id, code, titleCyrillic, titleLatin, earnedAt
        case details = "description"
    }

    var badge: Badge {
        Badge(id: id, code: code, titleCyrillic: titleCyrillic, titleLatin: titleLatin, details: details)
    }
}
