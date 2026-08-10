package com.rec.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

private val LightScheme = lightColorScheme(
    primary = RecPalette.LightIndigo,
    onPrimary = RecPalette.Cream,
    primaryContainer = RecPalette.LightIndigoSoft,
    onPrimaryContainer = RecPalette.Cream,
    secondary = RecPalette.LightOxblood,
    onSecondary = Color.White,
    tertiary = RecPalette.LightOchre,
    onTertiary = Color(0xFF2A1C00),
    background = RecPalette.LightGround,
    onBackground = RecPalette.LightInk,
    surface = RecPalette.LightSurface,
    onSurface = RecPalette.LightInk,
    surfaceVariant = RecPalette.LightSurface2,
    onSurfaceVariant = RecPalette.LightInkSoft,
    outline = RecPalette.LightThread,
    error = Color(0xFFB3261E),
)

private val DarkScheme = darkColorScheme(
    primary = RecPalette.DarkIndigo,
    onPrimary = Color(0xFF0E1524),
    primaryContainer = RecPalette.DarkIndigoSoft,
    onPrimaryContainer = RecPalette.Cream,
    secondary = RecPalette.DarkOxblood,
    onSecondary = Color(0xFF2E0A0F),
    tertiary = RecPalette.DarkOchre,
    onTertiary = Color(0xFF2A1C00),
    background = RecPalette.DarkGround,
    onBackground = RecPalette.DarkInk,
    surface = RecPalette.DarkSurface,
    onSurface = RecPalette.DarkInk,
    surfaceVariant = RecPalette.DarkSurface2,
    onSurfaceVariant = RecPalette.DarkInkSoft,
    outline = RecPalette.DarkThread,
    error = Color(0xFFF2B8B5),
)

@Composable
fun RecTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val recColors = if (darkTheme) DarkRecColors else LightRecColors
    val scheme = if (darkTheme) DarkScheme else LightScheme

    CompositionLocalProvider(LocalRecColors provides recColors) {
        MaterialTheme(
            colorScheme = scheme,
            typography = RecTypography,
            content = content,
        )
    }
}

/** Shorthand so screens can write `RecTheme.colors.oxblood` instead of threading a param. */
object RecTheme {
    val colors: RecColors
        @Composable
        get() = LocalRecColors.current
}
