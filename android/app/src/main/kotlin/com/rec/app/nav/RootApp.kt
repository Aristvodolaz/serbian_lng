package com.rec.app.nav

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rec.app.di.LocalAppContainer
import com.rec.app.di.ViewModelFactory
import com.rec.app.ui.screens.auth.AuthScreen
import com.rec.app.ui.screens.auth.AuthViewModel
import com.rec.app.ui.theme.RecTheme

@Composable
fun RootApp() {
    val container = LocalAppContainer.current
    val isLoggedIn by container.authRepository.isLoggedIn.collectAsState(initial = null)

    // Crossfades the three top-level states instead of hard-cutting between
    // them — most noticeable right after a successful login/register, where
    // the auth screen would otherwise blink straight to Home.
    AnimatedContent(
        targetState = isLoggedIn,
        transitionSpec = { fadeIn(tween(280)) togetherWith fadeOut(tween(180)) },
        label = "auth-state",
    ) { loggedIn ->
        when (loggedIn) {
            null -> Box(Modifier.fillMaxSize().background(RecTheme.colors.ground), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            false -> {
                val vm: AuthViewModel = viewModel(factory = ViewModelFactory { AuthViewModel(container.authRepository) })
                AuthScreen(viewModel = vm)
            }
            // No manual navigation needed on logout: clearing tokens flips
            // isLoggedIn to false via the same StateFlow, which recomposes
            // this AnimatedContent straight back to AuthScreen.
            true -> MainScaffold(onLoggedOut = {})
        }
    }
}
