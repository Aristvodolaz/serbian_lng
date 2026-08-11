//
//  SerbianApp.swift
//  Serbian — РЕЧ · REČ
//

import SwiftUI

@main
struct SerbianApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .task { await session.restore() }
        }
    }
}
