package com.rec.app.nav

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rec.app.di.LocalAppContainer
import com.rec.app.di.ViewModelFactory
import com.rec.app.ui.common.Localized
import com.rec.app.ui.components.LoadingContent
import com.rec.app.ui.screens.auth.AuthScreen
import com.rec.app.ui.screens.auth.AuthViewModel
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.RecTheme

@Composable
fun RootApp() {
    val container = LocalAppContainer.current
    // null until the stored session has been read, so neither screen flashes first.
    val isLoggedIn by container.authRepository.isLoggedIn.collectAsStateWithLifecycle(initialValue = null)
    // The language chosen in the profile is the interface language; signed out, the system's is used.
    val language by container.userRepository.interfaceLanguage.collectAsStateWithLifecycle(initialValue = null)

    Localized(languageTag = language) {
        // Signing in or out only flips this flag; the crossfade does the navigation.
        AnimatedContent(
            targetState = isLoggedIn,
            transitionSpec = { fadeIn(Motion.slow()) togetherWith fadeOut(Motion.base()) },
            label = "session",
        ) { loggedIn ->
            when (loggedIn) {
                null -> LoadingContent(Modifier.background(RecTheme.colors.ground))
                false -> {
                    val viewModel: AuthViewModel = viewModel(factory = ViewModelFactory { AuthViewModel(container.authRepository) })
                    AuthScreen(viewModel)
                }
                true -> MainScaffold()
            }
        }
    }
}
