import Foundation

/// `WordProgressStatus`
enum WordStatus: String, Codable, Sendable {
    case learning
    case known

    /// An unrecognised status keeps the word in the deck instead of failing the
    /// whole review queue.
    init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = WordStatus(rawValue: raw) ?? .learning
    }
}

/// The four flashcard grades: "Опет", "Тешко", "Добро", "Лако".
enum ReviewOutcome: String, Encodable, Sendable {
    case again
    case hard
    case good
    case easy

    var title: String {
        switch self {
        case .again: String(localized: "Опет")
        case .hard: String(localized: "Тешко")
        case .good: String(localized: "Добро")
        case .easy: String(localized: "Лако")
        }
    }
}

/// `ReviewWordResponseDto`
struct ReviewWord: Codable, Identifiable, Equatable, Sendable {
    let wordId: String
    let cyrillic: String
    let latin: String
    let translationRu: String
    let translationEn: String
    let exampleCyrillic: String?
    let exampleTranslationRu: String?
    let exampleTranslationEn: String?
    let audioUrl: String?
    let imageUrl: String?
    let status: WordStatus

    var id: String { wordId }

    var audioURL: URL? {
        guard let audioUrl, !audioUrl.isEmpty else { return nil }
        return URL(string: audioUrl)
    }
}

extension ReviewWord {
    /// The translation matching the learner's preferred language.
    func translation(matching language: LanguagePreference) -> String {
        language == .en ? translationEn : translationRu
    }

    /// The example translation matching the learner's preferred language.
    func exampleTranslation(matching language: LanguagePreference) -> String? {
        language == .en ? exampleTranslationEn : exampleTranslationRu
    }
}

/// `SubmitReviewResponseDto`
struct ReviewSubmission: Codable, Equatable, Sendable {
    let status: WordStatus
    let nextReviewAt: Date
    let newBadges: [EarnedBadge]
}

/// `SubmitReviewDto`
struct SubmitReviewRequest: Encodable, Sendable {
    let result: ReviewOutcome
}
