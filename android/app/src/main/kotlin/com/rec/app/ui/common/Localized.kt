package com.rec.app.ui.common

import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import java.util.Locale

/**
 * Renders [content] in [languageTag] regardless of the system language, or in
 * the system language when the tag is null. String resources resolve through
 * the provided context, so changing the tag re-translates the whole UI in
 * place — no activity restart.
 */
@Composable
fun Localized(languageTag: String?, content: @Composable () -> Unit) {
    val base = LocalContext.current
    val localized = remember(base, languageTag) {
        if (languageTag == null) {
            base
        } else {
            val configuration = Configuration(base.resources.configuration)
            configuration.setLocale(Locale.forLanguageTag(languageTag))
            base.createConfigurationContext(configuration)
        }
    }
    CompositionLocalProvider(
        LocalContext provides localized,
        LocalConfiguration provides localized.resources.configuration,
        content = content,
    )
}
