package com.rec.app

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.rec.app.di.LocalAppContainer
import com.rec.app.nav.RootApp
import com.rec.app.ui.theme.RecTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Fully transparent bars: the app paints its own ground behind them, so the
        // default translucent scrim would show as a white strip under the nav bar.
        val transparentBars = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT)
        enableEdgeToEdge(statusBarStyle = transparentBars, navigationBarStyle = transparentBars)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }

        val container = (application as RecApplication).container

        setContent {
            CompositionLocalProvider(LocalAppContainer provides container) {
                RecTheme {
                    RootApp()
                }
            }
        }
    }
}
