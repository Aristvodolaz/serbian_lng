import Foundation

/// Where the REČ API lives.
///
/// Resolution order: a value the learner typed into the developer settings, then
/// the `RecAPIBaseURL` Info.plist key (set per build configuration), then the
/// local dev server the backend's README starts on port 3000.
enum AppConfiguration {
    static let fallbackBaseURL = URL(string: "http://localhost:3000")!

    private static let overrideKey = "rec.api.baseURL"

    static var baseURL: URL {
        if let override = overrideBaseURL {
            return override
        }
        if let string = Bundle.main.object(forInfoDictionaryKey: "RecAPIBaseURL") as? String,
           let url = URL(string: string), url.scheme != nil {
            return url
        }
        return fallbackBaseURL
    }

    static var overrideBaseURL: URL? {
        get {
            guard let string = UserDefaults.standard.string(forKey: overrideKey),
                  let url = URL(string: string), url.scheme != nil else { return nil }
            return url
        }
        set {
            if let newValue {
                UserDefaults.standard.set(newValue.absoluteString, forKey: overrideKey)
            } else {
                UserDefaults.standard.removeObject(forKey: overrideKey)
            }
        }
    }
}

enum RecCoder {
    /// The backend serialises dates with `JSON.stringify`, i.e. ISO-8601 with
    /// fractional seconds. Some fields (`lastActivityDate`) are plain calendar
    /// days and stay strings, so only the timestamp fields go through here.
    static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let raw = try decoder.singleValueContainer().decode(String.self)
            if let date = fractionalFormatter.date(from: raw) ?? plainFormatter.date(from: raw) {
                return date
            }
            throw DecodingError.dataCorrupted(
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Unrecognised date format: \(raw)"
                )
            )
        }
        return decoder
    }()

    static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()

    // Read from the decoder's date strategy, which runs outside the main actor.
    // ISO8601DateFormatter is documented as thread-safe for parsing.
    nonisolated(unsafe) private static let fractionalFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    nonisolated(unsafe) private static let plainFormatter = ISO8601DateFormatter()
}
