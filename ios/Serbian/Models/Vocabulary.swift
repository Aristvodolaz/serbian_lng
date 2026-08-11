import Foundation

/// `WordProgressStatus`
enum WordStatus: String, Codable, Sendable {
    case learning
    case known
}

/// The two buttons on a flashcard: "Учим" and "Знам".
enum ReviewOutcome: String, Encodable, Sendable {
    case learning
    case know

    var title: String {
        switch self {
        case .learning: "Учим"
        case .know: "Знам"
        }
    }
}

/// `ReviewWordResponseDto`
struct ReviewWord: Codable, Identifiable, Equatable, Sendable {
    let wordId: String
    let cyrillic: String
    let latin: String
    let translation: String
    let exampleCyrillic: String?
    let exampleTranslation: String?
    let audioUrl: String?
    let status: WordStatus

    var id: String { wordId }

    var audioURL: URL? {
        guard let audioUrl, !audioUrl.isEmpty else { return nil }
        return URL(string: audioUrl)
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
