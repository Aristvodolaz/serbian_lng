import SwiftUI

/// The API host is not baked in: a tester can point the app at a laptop or a
/// staging box without a rebuild.
struct ServerAddressField: View {
    @Environment(SessionStore.self) private var session

    @State private var isEditing = false
    @State private var text = ""
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            Button {
                text = session.serverURL.absoluteString
                errorMessage = nil
                withAnimation(.easeOut(duration: 0.2)) { isEditing.toggle() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "externaldrive.connected.to.line.below")
                        .font(.system(size: 12, weight: .semibold))
                    Text("Сервер")
                        .font(.recCaption)
                    Spacer()
                    Text(session.serverURL.absoluteString)
                        .font(.recMonoSmall)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    Image(systemName: isEditing ? "chevron.up" : "chevron.down")
                        .font(.system(size: 10, weight: .bold))
                }
                .foregroundStyle(Palette.inkSoft)
                .frame(minHeight: Metrics.minimumTapTarget)
            }
            .buttonStyle(.plain)

            if isEditing {
                FormField(label: "Адреса API-ја") {
                    TextField("http://localhost:3000", text: $text)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                if let errorMessage {
                    InlineMessage(text: errorMessage)
                }

                HStack(spacing: Metrics.tight) {
                    Button("Врати подразумевано") {
                        AppConfiguration.overrideBaseURL = nil
                        session.serverURL = AppConfiguration.baseURL
                        text = session.serverURL.absoluteString
                        errorMessage = nil
                    }
                    .buttonStyle(.recGhost)

                    Button("Сачувај", action: save)
                        .buttonStyle(.recPrimary)
                }
            }
        }
    }

    private func save() {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmed), url.scheme != nil, url.host != nil else {
            errorMessage = "Адреса није исправна."
            return
        }
        session.serverURL = url
        errorMessage = nil
        withAnimation(.easeOut(duration: 0.2)) { isEditing = false }
    }
}
