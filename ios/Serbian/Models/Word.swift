import Foundation

/// `WordPublicDto` — a published dictionary word. Grammar attributes are stored
/// as stable codes (`noun`, `m`, `singular`, `I`, ...) and resolved to labels
/// via `WordAttributes`.
struct Word: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let cyrillic: String
    let latin: String
    let translationRu: String
    let translationEn: String
    let exampleCyrillic: String?
    let exampleTranslationRu: String?
    let exampleTranslationEn: String?
    let audioUrl: String?
    let partOfSpeech: String?
    let gender: String?
    let number: String?
    let declension: String?
    let conjugation: String?
    let imageUrl: String?

    var audioURL: URL? {
        audioUrl.flatMap(URL.init(string:))
    }

    func translation(matching language: LanguagePreference) -> String {
        language == .en ? translationEn : translationRu
    }

    func exampleTranslation(matching language: LanguagePreference) -> String? {
        language == .en ? exampleTranslationEn : exampleTranslationRu
    }
}

/// `WordsListResponseDto`
struct WordsResponse: Codable, Equatable, Sendable {
    let items: [Word]
    let total: Int
}

/// One entry of a grammar-attribute dictionary (code -> RU/EN label).
struct WordAttributeOption: Codable, Equatable, Sendable {
    let value: String
    let ru: String
    let en: String
}

/// `GET /words/attributes` — bilingual labels for every attribute code.
struct WordAttributes: Codable, Equatable, Sendable {
    let partOfSpeech: [WordAttributeOption]
    let gender: [WordAttributeOption]
    let number: [WordAttributeOption]
    let declension: [WordAttributeOption]
    let conjugation: [WordAttributeOption]
}

/// The five grammar attributes a word card can show, matching backend
/// `WORD_ATTRIBUTE_FIELDS`.
enum WordAttributeField: String, CaseIterable, Sendable {
    case partOfSpeech
    case gender
    case number
    case declension
    case conjugation

    /// Field label shown on the card, in the interface language.
    func label(matching language: LanguagePreference) -> String {
        switch self {
        case .partOfSpeech: return language == .en ? "Part of speech" : "Часть речи"
        case .gender: return language == .en ? "Gender" : "Род"
        case .number: return language == .en ? "Number" : "Число"
        case .declension: return language == .en ? "Declension" : "Склонение"
        case .conjugation: return language == .en ? "Conjugation" : "Спряжение"
        }
    }

    /// The dictionary backing this field (nil when the caller doesn't have it).
    func options(from attributes: WordAttributes?) -> [WordAttributeOption] {
        guard let attributes else { return [] }
        switch self {
        case .partOfSpeech: return attributes.partOfSpeech
        case .gender: return attributes.gender
        case .number: return attributes.number
        case .declension: return attributes.declension
        case .conjugation: return attributes.conjugation
        }
    }

    /// The word's stored code for this field, if set.
    func value(of word: Word) -> String? {
        switch self {
        case .partOfSpeech: return word.partOfSpeech
        case .gender: return word.gender
        case .number: return word.number
        case .declension: return word.declension
        case .conjugation: return word.conjugation
        }
    }

    /// Localized label for a code, falling back to the raw code when unknown.
    func label(for value: String, matching language: LanguagePreference, attributes: WordAttributes?) -> String {
        let match = options(from: attributes).first { $0.value == value }
        guard let match else { return value }
        return language == .en ? match.en : match.ru
    }
}
