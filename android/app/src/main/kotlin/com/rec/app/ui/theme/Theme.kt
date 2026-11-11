package com.rec.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color

/**
 * Maps the app roles onto Material 3 slots so stock components (dialogs, text
 * buttons, ripples, text selection) inherit the brand without per-call colors.
 */
private fun RecColors.toMaterialScheme(): ColorScheme {
    val base = if (isDark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = primary,
        onPrimary = onPrimary,
        primaryContainer = primarySoft,
        onPrimaryContainer = onPrimary,
        secondary = accent,
        onSecondary = ink,
        tertiary = success,
        background = ground,
        onBackground = ink,
        surface = surface,
        onSurface = ink,
        surfaceVariant = surfaceMuted,
        onSurfaceVariant = inkSoft,
        surfaceContainerLowest = surface,
        surfaceContainerLow = surface,
        surfaceContainer = surface,
        surfaceContainerHigh = surface,
        surfaceContainerHighest = surfaceMuted,
        surfaceTint = Color.Transparent,
        outline = outline,
        outlineVariant = outline,
        error = danger,
        onError = onPrimary,
    )
}

@Composable
fun RecTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkRecColors else LightRecColors
    CompositionLocalProvider(LocalRecColors provides colors) {
        MaterialTheme(
            colorScheme = colors.toMaterialScheme(),
            typography = RecTypography,
            shapes = RecShapes,
            content = content,
        )
    }
}

/** Shorthand so screens can write `RecTheme.colors.primary` instead of threading a param. */
object RecTheme {
    val colors: RecColors
        @Composable
        @ReadOnlyComposable
        get() = LocalRecColors.current
}
