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

/// `ExerciseType` — a registry entry on the backend, not an enum there either.
/// New types decode to `.unknown` and are skipped rather than pushed through a
/// UI that would make no sense for them.
enum ExerciseType: String, Codable, Sendable {
    case translationChoice = "translation_choice"
    case fillWord = "fill_word"
    case unknown

    init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = ExerciseType(rawValue: raw) ?? .unknown
    }

    var isSupported: Bool {
        self == .translationChoice || self == .fillWord
    }
}

/// A payload element shared by `question`, `sentence` and `answers`: Serbian in
/// both scripts plus the translations. When `wordId` is set the backend already
/// resolved the dictionary Word's content into these fields.
struct ExerciseText: Codable, Equatable, Sendable {
    let wordId: String?
    let srCyr: String?
    let srLat: String?
    let ru: String?
    let en: String?
    let audioUrl: String?
    let imageUrl: String?
}

/// `ExerciseAnswer` — one option. Deliberately no `isCorrect`: the backend only
/// reveals the answer once one has been submitted.
struct ExerciseAnswer: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let wordId: String?
    let srCyr: String?
    let srLat: String?
    let ru: String?
    let en: String?
    let audioUrl: String?
    let imageUrl: String?
}

struct ExerciseSettings: Codable, Equatable, Sendable {
    let shuffleOptions: Bool?
    let showImage: Bool?
    let showSentenceTranslation: Bool?
    let playAudio: Bool?
}

/// The decoded `payload` of an exercise. Only the fields relevant to the type
/// are present, and `correctAnswerId` is stripped server-side.
struct ExercisePayload: Codable, Equatable, Sendable {
    let question: ExerciseText?
    let sentence: ExerciseText?
    let answers: [ExerciseAnswer]
    let settings: ExerciseSettings?
}

/// `ExercisePublicDto`
struct Exercise: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let type: ExerciseType
    let order: Int
    let payload: ExercisePayload

    /// The prompt element: a word for `translation_choice`, a sentence for `fill_word`.
    var promptItem: ExerciseText? {
        payload.question ?? payload.sentence
    }

    /// Serbian prompt text in the learner's preferred script, falling back to
    /// whatever text the payload actually carries.
    func prompt(script preference: ScriptPreference) -> String? {
        guard let item = promptItem else { return nil }
        switch preference {
        case .latin: return item.srLat ?? item.srCyr
        case .cyrillic: return item.srCyr ?? item.srLat
        case .both: return item.srCyr ?? item.srLat
        }
    }

    /// The prompt's translation into the interface language.
    func promptTranslation(matching language: LanguagePreference) -> String? {
        guard let item = promptItem else { return nil }
        return language == .en ? item.en : item.ru
    }
}

extension ExerciseAnswer {
    /// Choice text: translations for `translation_choice`, Serbian words for
    /// `fill_word` — resolved by the caller with the right preference.
    func translation(matching language: LanguagePreference) -> String? {
        language == .en ? en : ru
    }

    func serbian(script preference: ScriptPreference) -> String? {
        switch preference {
        case .latin: return srLat ?? srCyr
        case .cyrillic: return srCyr ?? srLat
        case .both: return srCyr ?? srLat
        }
    }
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

/// `AnswerResultResponseDto` — `correctAnswer` is only present after a submit.
struct AnswerResult: Codable, Equatable, Sendable {
    let correct: Bool
    let correctAnswerId: String
    let correctAnswer: ExerciseAnswer?
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
    let answerId: String
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

