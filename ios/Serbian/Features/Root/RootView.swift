import SwiftUI

struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        ZStack {
            switch session.phase {
            case .launching:
                LaunchView()
            case .signedOut:
                OnboardingFlow()
                    .transition(.opacity)
            case .signedIn:
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: session.phase)
        .tint(Palette.indigo)
    }
}

struct MainTabView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        TabView {
            PathScreen()
                .tabItem {
                    Label("Кораци", systemImage: "figure.walk.motion")
                }

            FlashcardsScreen()
                .tabItem {
                    Label("Речник", systemImage: "rectangle.on.rectangle.angled")
                }

            ProfileScreen()
                .tabItem {
                    Label("Профил", systemImage: "person.crop.circle")
                }
        }
        .task { await session.refreshUser() }
    }
}
