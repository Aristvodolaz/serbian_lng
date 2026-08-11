import Foundation
import Security

protocol TokenStoring: AnyObject {
    var tokens: AuthTokens? { get }
    func save(_ tokens: AuthTokens)
    func clear()
}

/// Refresh tokens outlive the process, so they belong in the keychain rather
/// than in `UserDefaults`.
final class KeychainTokenStore: TokenStoring {
    private let service: String
    private let account = "auth-tokens"
    private var cached: AuthTokens?
    private var didLoad = false

    init(service: String = Bundle.main.bundleIdentifier ?? "com.az.Serbian") {
        self.service = service
    }

    var tokens: AuthTokens? {
        if !didLoad {
            cached = readFromKeychain()
            didLoad = true
        }
        return cached
    }

    func save(_ tokens: AuthTokens) {
        cached = tokens
        didLoad = true
        guard let data = try? RecCoder.encoder.encode(tokens) else { return }

        var query = baseQuery
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock

        let status = SecItemAdd(query as CFDictionary, nil)
        if status == errSecDuplicateItem {
            _ = SecItemUpdate(
                baseQuery as CFDictionary,
                [kSecValueData as String: data] as CFDictionary
            )
        }
    }

    func clear() {
        cached = nil
        didLoad = true
        _ = SecItemDelete(baseQuery as CFDictionary)
    }

    private var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    private func readFromKeychain() -> AuthTokens? {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return try? RecCoder.decoder.decode(AuthTokens.self, from: data)
    }
}

/// Used by previews and unit tests.
final class InMemoryTokenStore: TokenStoring {
    private(set) var tokens: AuthTokens?

    init(tokens: AuthTokens? = nil) {
        self.tokens = tokens
    }

    func save(_ tokens: AuthTokens) { self.tokens = tokens }
    func clear() { tokens = nil }
}
