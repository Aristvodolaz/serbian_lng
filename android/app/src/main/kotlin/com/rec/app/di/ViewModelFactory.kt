package com.rec.app.di

import androidx.compose.runtime.compositionLocalOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

/** Generic factory so screens can build a ViewModel from [AppContainer] without Hilt. */
class ViewModelFactory(private val creator: () -> ViewModel) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = creator() as T
}

val LocalAppContainer = compositionLocalOf<AppContainer> {
    error("AppContainer not provided — wrap the app in CompositionLocalProvider(LocalAppContainer provides ...)")
}
