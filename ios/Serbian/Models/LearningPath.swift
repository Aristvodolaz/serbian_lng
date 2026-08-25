import Foundation

/// `LessonPathStatus`
enum LessonStatus: String, Codable, Sendable {
    case done
    case current
    case locked

    /// A status this build doesn't know is treated as locked rather than
    /// failing the whole `/units` response — the same fallback Android's
    /// `HomeViewModel` applies.
    init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = LessonStatus(rawValue: raw) ?? .locked
    }

    var isOpen: Bool { self != .locked }
}

/// `LessonSummaryDto`
struct LessonSummary: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let titleLatin: String
    let titleTranslationRu: String
    let titleTranslationEn: String
    let order: Int
    let xpReward: Int
    let status: LessonStatus
}

/// `UnitPathDto`
struct PathUnit: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let titleCyrillic: String
    let titleLatin: String
    let titleTranslationRu: String
    let titleTranslationEn: String
    let order: Int
    let lessons: [LessonSummary]
}

/// `PathResponseDto`
struct LearningPath: Codable, Equatable, Sendable {
    let units: [PathUnit]

    /// Flattened lessons in path order — the winding trail on the home screen.
    var lessons: [LessonSummary] {
        units.sorted { $0.order < $1.order }
            .flatMap { $0.lessons.sorted { $0.order < $1.order } }
    }

    var currentLesson: LessonSummary? {
        lessons.first { $0.status == .current }
    }

    var completedCount: Int {
        lessons.filter { $0.status == .done }.count
    }
}

/// `ExerciseType`
enum ExerciseType: String, Codable, Sendable {
    case translateChoice = "translate_choice"
    case unknown

    init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = ExerciseType(rawValue: raw) ?? .unknown
    }

    /// `translate_choice` is the only type the backend defines, and the only one
    /// this app has a screen for. Should the backend grow another type, older
    /// builds decode it as `.unknown` and skip it instead of forcing it through
    /// the multiple-choice UI, where the prompt would make no sense.
    var isSupported: Bool { self == .translateChoice }
}

/// `ExerciseChoicePublicDto` — deliberately has no `isCorrect`; the backend only
/// reveals the answer once one has been submitted.
struct ExerciseChoice: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let text: String
    let textRu: String
}

/// `ExercisePublicDto`
struct Exercise: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let type: ExerciseType
    let promptCyrillic: String
    let promptLatin: String
    let promptTranslationRu: String
    let promptTranslationEn: String
    let order: Int
    let choices: [ExerciseChoice]
}

/// `LessonDetailResponseDto`
struct LessonDetail: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let titleLatin: String
    let titleTranslationRu: String
    let titleTranslationEn: String
    let xpReward: Int
    let exercises: [Exercise]

    /// In path order, and limited to the types this build can present — the
    /// score reported back to `/complete` must count only what the learner was
    /// actually asked.
    var playableExercises: [Exercise] {
        exercises
            .filter { $0.type.isSupported }
            .sorted { $0.order < $1.order }
    }
}

/// `AnswerResultResponseDto`
struct AnswerResult: Codable, Equatable, Sendable {
    let correct: Bool
    let correctChoiceId: String
}

/// `CompleteLessonResponseDto`
struct LessonCompletion: Codable, Equatable, Sendable {
    let xpEarned: Int
    let totalXp: Int
    let streakDays: Int
    let newBadges: [EarnedBadge]
}

/// `CompleteLessonDto`
struct CompleteLessonRequest: Encodable, Sendable {
    let correctCount: Int
    let totalCount: Int
}

/// `AnswerExerciseDto`
struct AnswerExerciseRequest: Encodable, Sendable {
    let choiceId: String
}

// MARK: - Translation helpers

extension LessonSummary {
    func titleTranslation(matching language: LanguagePreference) -> String {
        language == .en ? titleTranslationEn : titleTranslationRu
    }
}

extension PathUnit {
    func titleTranslation(matching language: LanguagePreference) -> String {
        language == .en ? titleTranslationEn : titleTranslationRu
    }
}

extension LessonDetail {
    func titleTranslation(matching language: LanguagePreference) -> String {
        language == .en ? titleTranslationEn : titleTranslationRu
    }
}

extension Exercise {
    func promptTranslation(matching language: LanguagePreference) -> String {
        language == .en ? promptTranslationEn : promptTranslationRu
    }
}

extension ExerciseChoice {
    func displayText(matching language: LanguagePreference) -> String {
        // text is Serbian (primary), textRu is Russian translation of the meaning
        language == .ru ? textRu : text
    }
}
