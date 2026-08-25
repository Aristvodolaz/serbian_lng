import SwiftUI

enum LegalDocument: String, Identifiable {
    case privacyPolicy = "privacy-policy-pdn"
    case termsOfUse = "terms-of-use"

    var title: String {
        switch self {
        case .privacyPolicy: return "Политика конфиденциальности"
        case .termsOfUse: return "Пользовательское соглашение"
        }
    }

    var id: String { rawValue }
}

struct CreateAccountView: View {
    let scriptPreference: ScriptPreference

    @Environment(SessionStore.self) private var session

    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var languagePreference: LanguagePreference = .ru
    @State private var errorMessage: String?
    @State private var isSubmitting = false
    @State private var showingDocument: LegalDocument?

    /// Mirrors `RegisterDto`: e-mail plus at least eight characters.
    private var canSubmit: Bool {
        !displayName.trimmingCharacters(in: .whitespaces).isEmpty
            && email.contains("@")
            && password.count >= 8
            && !isSubmitting
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Metrics.loose) {
                StepDots(count: 3, current: 2)
                    .frame(maxWidth: .infinity)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Направите налог")
                        .font(.recDisplay)
                        .foregroundStyle(Palette.ink)
                    Text("Напредак и серија дана се чувају на серверу.")
                        .font(.recCallout)
                        .foregroundStyle(Palette.inkSoft)
                }

                VStack(spacing: Metrics.regular) {
                    FormField(label: "Име") {
                        TextField("Милица", text: $displayName)
                            .textContentType(.name)
                            .textInputAutocapitalization(.words)
                    }

                    FormField(label: "Е-пошта") {
                        TextField("milica@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }

                    FormField(label: "Лозинка", footnote: "Најмање 8 знакова.") {
                        SecureField("••••••••", text: $password)
                            .textContentType(.newPassword)
                    }
                }

                if let errorMessage {
                    InlineMessage(text: errorMessage)
                }

                selectedScriptSummary
                languagePreferenceSection

                Button {
                    Task { await submit() }
                } label: {
                    if isSubmitting {
                        ProgressView().tint(Palette.onIndigo)
                    } else {
                        Text("Направи налог")
                    }
                }
                .buttonStyle(.recPrimary)
                .disabled(!canSubmit)

                privacyHint
            }
            .padding(.horizontal, Metrics.screenPadding)
            .padding(.top, Metrics.regular)
            .padding(.bottom, Metrics.loose)
        }
        .scrollDismissesKeyboard(.interactively)
        .groundBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $showingDocument) { document in
            LegalDocumentView(fileName: document.rawValue, title: document.title)
        }
    }

    private var privacyHint: some View {
        HStack(spacing: 2) {
            Text("Нажимая продолжить, вы принимаете ")
                .font(.recFootnote)
                .foregroundStyle(Palette.inkSoft)
            Button { showingDocument = .privacyPolicy } label: {
                Text("политику конфиденциальности")
                    .font(.recFootnote)
                    .foregroundStyle(Palette.indigo)
            }
            .buttonStyle(.plain)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
    }

    private var languagePreferenceSection: some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            EyebrowLabel(text: "Язык переводов")
            ForEach(LanguagePreference.allCases) { preference in
                Button {
                    languagePreference = preference
                } label: {
                    HStack {
                        Text(preference.title)
                            .font(.recCalloutStrong)
                            .foregroundStyle(Palette.ink)
                        Spacer()
                        Image(systemName: languagePreference == preference
                              ? "largecircle.fill.circle"
                              : "circle")
                            .foregroundStyle(
                                languagePreference == preference ? Palette.indigo : Palette.line
                            )
                    }
                    .padding(.horizontal, 14)
                    .frame(minHeight: 56)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Palette.surface)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(
                                languagePreference == preference ? Palette.indigo : Palette.line,
                                lineWidth: 1.5
                            )
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var selectedScriptSummary: some View {
        HStack(spacing: Metrics.tight) {
            Image(systemName: "textformat.abc")
                .foregroundStyle(Palette.indigo)
            VStack(alignment: .leading, spacing: 1) {
                Text(scriptPreference.title)
                    .font(.recCalloutStrong)
                    .foregroundStyle(Palette.ink)
                Text(scriptPreference.sample)
                    .font(.recCaption)
                    .foregroundStyle(Palette.inkSoft)
            }
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Palette.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Palette.line, lineWidth: 1)
        )
    }

    private func submit() async {
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await session.register(
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password,
                displayName: displayName.trimmingCharacters(in: .whitespaces),
                scriptPreference: scriptPreference,
                languagePreference: languagePreference
            )
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }
}

struct SignInView: View {
    @Environment(SessionStore.self) private var session

    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    private var canSubmit: Bool {
        email.contains("@") && !password.isEmpty && !isSubmitting
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Metrics.loose) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Пријавите се")
                        .font(.recDisplay)
                        .foregroundStyle(Palette.ink)
                    Text("Настави где си стао.")
                        .font(.recCallout)
                        .foregroundStyle(Palette.inkSoft)
                }

                VStack(spacing: Metrics.regular) {
                    FormField(label: "Е-пошта") {
                        TextField("milica@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }

                    FormField(label: "Лозинка") {
                        SecureField("••••••••", text: $password)
                            .textContentType(.password)
                    }
                }

                if let errorMessage {
                    InlineMessage(text: errorMessage)
                }

                Button {
                    Task { await submit() }
                } label: {
                    if isSubmitting {
                        ProgressView().tint(Palette.onIndigo)
                    } else {
                        Text("Пријави се")
                    }
                }
                .buttonStyle(.recPrimary)
                .disabled(!canSubmit)

                ServerAddressField()
            }
            .padding(.horizontal, Metrics.screenPadding)
            .padding(.top, Metrics.regular)
            .padding(.bottom, Metrics.loose)
        }
        .scrollDismissesKeyboard(.interactively)
        .groundBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func submit() async {
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await session.signIn(
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password
            )
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }
}
