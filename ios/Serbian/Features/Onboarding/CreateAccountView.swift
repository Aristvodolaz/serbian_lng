import SwiftUI

struct CreateAccountView: View {
    let scriptPreference: ScriptPreference

    @Environment(SessionStore.self) private var session

    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

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
                scriptPreference: scriptPreference
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
