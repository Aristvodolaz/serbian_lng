package com.rec.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.rec.app.di.LocalAppContainer
import com.rec.app.nav.RootApp
import com.rec.app.ui.theme.RecTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

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
