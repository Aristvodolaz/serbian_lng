import Foundation

/// `users/enums/script-preference.enum.ts`
enum ScriptPreference: String, Codable, CaseIterable, Identifiable, Sendable {
    case cyrillic
    case latin
    case both

    var id: String { rawValue }

    /// Falls back to the backend's own default rather than failing every
    /// response that carries a user object.
    init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = ScriptPreference(rawValue: raw) ?? .both
    }

    /// Labels come straight from the script-picker screen of the design.
    var title: String {
        switch self {
        case .cyrillic: String(localized: "Ћирилица")
        case .latin: String(localized: "Latinica")
        case .both: String(localized: "Оба писма")
        }
    }

    /// Deliberately not localised: it is a specimen of the script being chosen.
    var sample: String {
        switch self {
        case .cyrillic: "Здраво, како си?"
        case .latin: "Zdravo, kako si?"
        case .both: "Здраво / Zdravo"
        }
    }
}

/// `users/enums/language-preference.enum.ts`
enum LanguagePreference: String, Codable, CaseIterable, Identifiable, Sendable {
    case ru
    case en

    var id: String { rawValue }

    init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = LanguagePreference(rawValue: raw) ?? .ru
    }

    var title: String {
        switch self {
        case .ru: String(localized: "Русский")
        case .en: String(localized: "English")
        }
    }
}

/// `UserResponseDto`
struct UserProfile: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let email: String
    let displayName: String
    let scriptPreference: ScriptPreference
    let languagePreference: LanguagePreference
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
        scriptPreference: ScriptPreference? = nil,
        languagePreference: LanguagePreference? = nil
    ) -> UserProfile {
        UserProfile(
            id: id,
            email: email,
            displayName: displayName,
            scriptPreference: scriptPreference ?? self.scriptPreference,
            languagePreference: languagePreference ?? self.languagePreference,
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
    /// Whole percent, 0–100 — the backend already rounds it.
    let accuracy: Int
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

    /// Single-letter weekday initials for the profile strip. Localised as one
    /// space-separated run so a translator sees the whole week at once and can
    /// keep Mon–Sun order — the same shape as Android's `weekday_letters` array.
    var initial: String {
        let initials = String(localized: "П У С Ч П С Н").split(separator: " ")
        let index = weekday - 1
        return initials.indices.contains(index) ? String(initials[index]) : "?"
    }
}

/// `WeekActivityResponseDto`
struct WeekActivity: Codable, Equatable, Sendable {
    let days: [DayActivity]
}
