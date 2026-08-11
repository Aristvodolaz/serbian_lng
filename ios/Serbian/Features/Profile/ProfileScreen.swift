import SwiftUI

struct ProfileScreen: View {
    @Environment(SessionStore.self) private var session
    @State private var model = ProfileViewModel()
    @State private var isShowingSettings = false

    var body: some View {
        NavigationStack {
            content
                .groundBackground()
                .navigationTitle("Профил")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            isShowingSettings = true
                        } label: {
                            Image(systemName: "gearshape")
                        }
                        .accessibilityLabel("Подешавања")
                    }
                }
                .sheet(isPresented: $isShowingSettings) {
                    SettingsSheet()
                }
        }
        .task { await model.loadIfNeeded(using: session.api) }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .idle, .loading:
            LoadingView()
        case .failed(let message):
            ErrorStateView(message: message) {
                Task { await model.load(using: session.api) }
            }
        case .loaded(let snapshot):
            ScrollView {
                VStack(alignment: .leading, spacing: Metrics.loose) {
                    header(snapshot)
                    statGrid(snapshot.stats)
                    weekStrip(snapshot.week)
                    badgeRow(snapshot)
                }
                .padding(.horizontal, Metrics.screenPadding)
                .padding(.vertical, Metrics.regular)
            }
            .refreshable {
                await model.load(using: session.api)
                await session.refreshUser()
            }
            .scrollIndicators(.hidden)
        }
    }

    private func header(_ snapshot: Snapshot) -> some View {
        HStack(spacing: 10) {
            AvatarView(name: session.displayName, size: 46)
            VStack(alignment: .leading, spacing: 2) {
                Text(session.displayName)
                    .font(.recCalloutStrong)
                    .foregroundStyle(Palette.ink)
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11, weight: .bold))
                    Text("\(snapshot.stats.streakDays) дана низа")
                        .font(.recCaption)
                        .fontWeight(.bold)
                }
                .foregroundStyle(Palette.oxblood)
            }
            Spacer()
        }
    }

    private func statGrid(_ stats: UserStats) -> some View {
        LazyVGrid(
            columns: [GridItem(spacing: Metrics.tight), GridItem(spacing: Metrics.tight)],
            spacing: Metrics.tight
        ) {
            StatCard(value: "\(stats.wordsLearned)", label: "речи")
            StatCard(value: "\(stats.accuracy)%", label: "тачност")
            StatCard(value: "\(stats.lessonsCompleted)", label: "лекција")
            StatCard(value: "\(stats.weeksActive)", label: "недеље")
        }
    }

    private func weekStrip(_ week: WeekActivity) -> some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            EyebrowLabel(text: "Ова недеља")
            HStack(spacing: 0) {
                ForEach(week.days) { day in
                    VStack {
                        Text(day.initial)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(day.active ? .white : Palette.inkSoft)
                            .frame(width: 26, height: 26)
                            .background(
                                RoundedRectangle(cornerRadius: 7, style: .continuous)
                                    .fill(day.active ? Palette.good : Palette.line)
                            )
                    }
                    .frame(maxWidth: .infinity)
                    .accessibilityLabel(
                        "\(day.date): \(day.active ? String(localized: "активан дан") : String(localized: "без активности"))"
                    )
                }
            }
        }
    }

    private func badgeRow(_ snapshot: Snapshot) -> some View {
        VStack(alignment: .leading, spacing: Metrics.tight) {
            EyebrowLabel(text: "Достигнућа")
            HStack(alignment: .top, spacing: Metrics.tight) {
                ForEach(snapshot.catalog) { badge in
                    let isEarned = snapshot.isEarned(badge)
                    VStack(spacing: 4) {
                        DiamondBadge(isEarned: isEarned, size: 40)
                        Text(badge.titleCyrillic)
                            .font(.recCaption)
                            .foregroundStyle(isEarned ? Palette.ink : Palette.inkSoft)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .opacity(isEarned ? 1 : 0.45)
                    .accessibilityElement(children: .combine)
                    .accessibilityValue(isEarned ? String(localized: "освојено") : String(localized: "није освојено"))
                }
            }
        }
    }

    private typealias Snapshot = ProfileViewModel.Snapshot
}

struct SettingsSheet: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var displayName = ""
    @State private var scriptPreference: ScriptPreference = .both
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var savedMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Metrics.loose) {
                    FormField(label: "Име") {
                        TextField("Милица", text: $displayName)
                            .textInputAutocapitalization(.words)
                    }

                    VStack(alignment: .leading, spacing: Metrics.tight) {
                        EyebrowLabel(text: "Писмо")
                        ForEach(ScriptPreference.allCases) { preference in
                            Button {
                                scriptPreference = preference
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(preference.title)
                                            .font(.recCalloutStrong)
                                            .foregroundStyle(Palette.ink)
                                        Text(preference.sample)
                                            .font(.recCaption)
                                            .foregroundStyle(Palette.inkSoft)
                                    }
                                    Spacer()
                                    Image(systemName: scriptPreference == preference
                                          ? "largecircle.fill.circle"
                                          : "circle")
                                        .foregroundStyle(
                                            scriptPreference == preference ? Palette.indigo : Palette.line
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
                                            scriptPreference == preference ? Palette.indigo : Palette.line,
                                            lineWidth: 1.5
                                        )
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if let errorMessage {
                        InlineMessage(text: errorMessage)
                    }
                    if let savedMessage {
                        InlineMessage(text: savedMessage, tone: .success)
                    }

                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView().tint(Palette.onIndigo)
                        } else {
                            Text("Сачувај")
                        }
                    }
                    .buttonStyle(.recPrimary)
                    .disabled(isSaving)

                    Divider().overlay(Palette.line)

                    ServerAddressField()

                    Button("Одјави се") {
                        session.signOut()
                        dismiss()
                    }
                    .buttonStyle(.recGhost)
                    .tint(Palette.oxblood)

                    Text(session.user?.email ?? "")
                        .font(.recCaption)
                        .foregroundStyle(Palette.inkSoft)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                .padding(.horizontal, Metrics.screenPadding)
                .padding(.vertical, Metrics.regular)
            }
            .groundBackground()
            .navigationTitle("Подешавања")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Затвори") { dismiss() }
                }
            }
        }
        .onAppear {
            displayName = session.displayName
            scriptPreference = session.scriptPreference
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        savedMessage = nil
        defer { isSaving = false }

        let trimmed = displayName.trimmingCharacters(in: .whitespaces)
        do {
            if trimmed != session.displayName, !trimmed.isEmpty {
                try await session.updateDisplayName(trimmed)
            }
            if scriptPreference != session.scriptPreference {
                try await session.updateScriptPreference(scriptPreference)
            }
            savedMessage = String(localized: "Сачувано.")
        } catch {
            errorMessage = error.learnerFacingMessage
        }
    }
}
