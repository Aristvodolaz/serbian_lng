import Foundation

/// `users/enums/script-preference.enum.ts`
enum ScriptPreference: String, Codable, CaseIterable, Identifiable, Sendable {
    case cyrillic
    case latin
    case both

    var id: String { rawValue }

    /// Labels come straight from the script-picker screen of the design.
    var title: String {
        switch self {
        case .cyrillic: "Ћирилица"
        case .latin: "Latinica"
        case .both: "Оба писма"
        }
    }

    var sample: String {
        switch self {
        case .cyrillic: "Здраво, како си?"
        case .latin: "Zdravo, kako si?"
        case .both: "Здраво / Zdravo"
        }
    }
}

/// `UserResponseDto`
struct UserProfile: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let email: String
    let displayName: String
    let scriptPreference: ScriptPreference
    let xp: Int
    let streakDays: Int
    /// Calendar day (`yyyy-MM-dd`), not a timestamp — kept as sent.
    let lastActivityDate: String?
    let createdAt: Date
}

extension UserProfile {
    func updating(
        xp: Int? = nil,
        streakDays: Int? = nil,
        scriptPreference: ScriptPreference? = nil
    ) -> UserProfile {
        UserProfile(
            id: id,
            email: email,
            displayName: displayName,
            scriptPreference: scriptPreference ?? self.scriptPreference,
            xp: xp ?? self.xp,
            streakDays: streakDays ?? self.streakDays,
            lastActivityDate: lastActivityDate,
            createdAt: createdAt
        )
    }
}

/// `UserStatsResponseDto`
struct UserStats: Codable, Equatable, Sendable {
    let wordsLearned: Int
    let accuracy: Double
    let lessonsCompleted: Int
    let weeksActive: Int
    let xp: Int
    let streakDays: Int
}

/// `DayActivityDto`
struct DayActivity: Codable, Identifiable, Equatable, Sendable {
    let date: String
    /// ISO weekday, Mon = 1 ... Sun = 7.
    let weekday: Int
    let active: Bool

    var id: String { date }

    /// Single-letter Serbian weekday initials, as on the profile screen.
    var initial: String {
        let initials = ["П", "У", "С", "Ч", "П", "С", "Н"]
        let index = weekday - 1
        return initials.indices.contains(index) ? initials[index] : "?"
    }
}

/// `WeekActivityResponseDto`
struct WeekActivity: Codable, Equatable, Sendable {
    let days: [DayActivity]
}
