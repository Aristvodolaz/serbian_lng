import SwiftUI

/// Loads a `.md` file from the app bundle and renders it as scrollable text.
struct LegalDocumentView: View {
    let fileName: String
    let title: String

    @State private var content: String = ""
    @State private var loadError: Bool = false

    var body: some View {
        NavigationStack {
            Group {
                if loadError {
                    VStack(spacing: 12) {
                        Image(systemName: "doc.badge.exclamationmark")
                            .font(.title)
                            .foregroundStyle(Palette.oxblood)
                        Text("Не удалось загрузить документ.")
                            .font(.recCallout)
                            .foregroundStyle(Palette.inkSoft)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        Text(content)
                            .font(.recBody)
                            .textSelection(.enabled)
                            .padding(.horizontal, Metrics.screenPadding)
                    }
                }
            }
            .groundBackground()
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Готово") {}
                }
            }
        }
        .onAppear { loadDocument() }
    }

    private func loadDocument() {
        guard
            let url = Bundle.main.url(
                forResource: fileName,
                withExtension: "md"
            ),
            let string = try? String(contentsOf: url, encoding: .utf8)
        else {
            loadError = true
            return
        }
        content = string
    }
}
