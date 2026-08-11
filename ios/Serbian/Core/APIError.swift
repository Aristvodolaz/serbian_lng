import Foundation

enum APIError: Error, LocalizedError, Equatable {
    case invalidURL
    case offline
    case timedOut
    case transport(String)
    /// The learner needs to sign in again — the refresh token is gone or stale.
    case unauthorized
    case server(status: Int, message: String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            "Неисправна адреса сервера."
        case .offline:
            "Нема интернет везе."
        case .timedOut:
            "Сервер не одговара."
        case .transport(let message):
            message
        case .unauthorized:
            "Сесија је истекла. Пријавите се поново."
        case .server(_, let message):
            message
        case .decoding:
            "Неочекиван одговор сервера."
        }
    }

    /// NestJS error bodies: `{ statusCode, message, error }`, where `message` is
    /// either a string or an array of validation messages.
    struct Body: Decodable {
        let message: String?

        private enum CodingKeys: String, CodingKey {
            case message
        }

        init(from decoder: any Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            if let single = try? container.decode(String.self, forKey: .message) {
                message = single
            } else if let list = try? container.decode([String].self, forKey: .message) {
                message = list.joined(separator: "\n")
            } else {
                message = nil
            }
        }
    }

    static func fromResponse(status: Int, data: Data) -> APIError {
        let parsed = try? RecCoder.decoder.decode(Body.self, from: data)
        let message = parsed?.message ?? defaultMessage(for: status)
        return .server(status: status, message: message)
    }

    private static func defaultMessage(for status: Int) -> String {
        switch status {
        case 400: "Подаци нису исправни."
        case 403: "Немате приступ."
        case 404: "Није нађено."
        case 409: "Тај налог већ постоји."
        case 500...599: "Грешка на серверу. Пробајте касније."
        default: "Захтев није успео (\(status))."
        }
    }

    static func fromURLError(_ error: URLError) -> APIError {
        switch error.code {
        case .notConnectedToInternet, .dataNotAllowed, .networkConnectionLost:
            .offline
        case .timedOut:
            .timedOut
        case .cannotConnectToHost, .cannotFindHost:
            .transport("Сервер није доступан на \(AppConfiguration.baseURL.absoluteString).")
        default:
            .transport(error.localizedDescription)
        }
    }
}
