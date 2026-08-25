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

/// The two buttons on a flashcard: "Учим" and "Знам".
enum ReviewOutcome: String, Encodable, Sendable {
    case learning
    case know

    var title: String {
        switch self {
        case .learning: String(localized: "Учим")
        case .know: String(localized: "Знам")
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
