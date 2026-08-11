import Foundation

/// `LessonPathStatus`
enum LessonStatus: String, Codable, Sendable {
    case done
    case current
    case locked

    var isOpen: Bool { self != .locked }
}

/// `LessonSummaryDto`
struct LessonSummary: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let titleLatin: String
    let titleTranslation: String
    let order: Int
    let xpReward: Int
    let status: LessonStatus
}

/// `UnitPathDto`
struct PathUnit: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let titleCyrillic: String
    let titleLatin: String
    let titleTranslation: String
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

    /// The instruction shown above the prompt.
    var instruction: String {
        switch self {
        case .translateChoice, .unknown: "Преведите реченицу"
        }
    }
}

/// `ExerciseChoicePublicDto` — deliberately has no `isCorrect`; the backend only
/// reveals the answer once one has been submitted.
struct ExerciseChoice: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let text: String
}

/// `ExercisePublicDto`
struct Exercise: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let type: ExerciseType
    let promptCyrillic: String
    let promptLatin: String
    let order: Int
    let choices: [ExerciseChoice]
}

/// `LessonDetailResponseDto`
struct LessonDetail: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let titleLatin: String
    let xpReward: Int
    let exercises: [Exercise]

    var orderedExercises: [Exercise] {
        exercises.sorted { $0.order < $1.order }
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
