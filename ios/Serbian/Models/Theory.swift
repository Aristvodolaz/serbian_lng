import Foundation

/// `TheorySummaryDto` — a theory topic listed in the path response per section.
struct TheorySummary: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let titleCyrillic: String
    let titleLatin: String
    let order: Int
}

/// `TheoryTopicDto`
struct TheoryTopic: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let sectionId: String
    let titleCyrillic: String
    let titleLatin: String
    let titleTranslationRu: String
    let titleTranslationEn: String
    let payload: TheoryPayload
    let order: Int

    func titleTranslation(matching language: LanguagePreference) -> String {
        language == .en ? titleTranslationEn : titleTranslationRu
    }
}

/// `TheoryPayload`
struct TheoryPayload: Codable, Equatable, Sendable {
    let version: Int
    let blocks: [TheoryBlock]
}

/// One content block of a theory topic. Blocks are typed by a discriminator the
/// admin editor produces; a kind this build doesn't know decodes to `.unknown`
/// and is skipped rather than failing the whole topic.
struct TheoryBlock: Codable, Equatable, Sendable {
    enum Kind: String, Codable, Sendable {
        case heading, paragraph, table, example, unknown

        init(from decoder: any Decoder) throws {
            let raw = try decoder.singleValueContainer().decode(String.self)
            self = Kind(rawValue: raw) ?? .unknown
        }
    }

    /// cyrillic/latin pair for table headers and cells.
    struct Bilingual: Codable, Equatable, Sendable {
        let cyrillic: String
        let latin: String
    }

    let type: Kind
    let textCyrillic: String?
    let textLatin: String?
    let captionCyrillic: String?
    let captionLatin: String?
    let captionTranslationRu: String?
    let captionTranslationEn: String?
    let headers: [Bilingual]?
    let headersTranslationRu: [String]?
    let headersTranslationEn: [String]?
    let rows: [[Bilingual]]?
    let cyrillic: String?
    let latin: String?
    let translationRu: String?
    let translationEn: String?
}
