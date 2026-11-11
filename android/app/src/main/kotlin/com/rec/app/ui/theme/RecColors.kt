package com.rec.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * The app's semantic color roles. Screens and components read these through
 * `RecTheme.colors` and never hold raw hex values, so light and dark stay in
 * step. The palette follows the blue reference UI: a periwinkle ground, white
 * surfaces, a royal-blue primary and warm accents.
 */
@Immutable
data class RecColors(
    /** Screen background. */
    val ground: Color,
    /** Cards, fields, sheets. */
    val surface: Color,
    /** Quiet fills: locked rows, tracks, inactive chips. */
    val surfaceMuted: Color,
    /** Primary text. Also the fill of "inverse" elements such as the active tab. */
    val ink: Color,
    /** Secondary text and icons. */
    val inkSoft: Color,
    val primary: Color,
    /** Lighter partner of [primary] for gradients and tints. */
    val primarySoft: Color,
    val onPrimary: Color,
    /** Warm highlight: streaks, the current lesson, medals. */
    val accent: Color,
    /** Errors and destructive actions. */
    val danger: Color,
    val success: Color,
    /** Hairlines and input borders. */
    val outline: Color,
    /** Translucent fill and rim of the floating navigation bar. */
    val glass: Color,
    val glassBorder: Color,
    val isDark: Boolean,
) {
    /** The blue hero gradient. Identical in both themes, always paired with [onHero]. */
    val heroBrush: Brush get() = Brush.linearGradient(listOf(HeroStart, HeroEnd))
    val onHero: Color get() = Color.White

    /** Full-bleed vertical version of the hero for the welcome screen. */
    val welcomeBrush: Brush get() = Brush.verticalGradient(listOf(HeroStart, HeroEnd, HeroDeep))

    /** Primary call-to-action fill. */
    val primaryBrush: Brush get() = Brush.horizontalGradient(listOf(primary, primarySoft))

    /** Warm medal gradient for trophies and badges. */
    val medalBrush: Brush get() = Brush.linearGradient(listOf(accent, danger))
}

private val HeroStart = Color(0xFF6C93FF)
private val HeroEnd = Color(0xFF2E5BEA)

private val HeroDeep = Color(0xFF1B3BB8)

val LightRecColors = RecColors(
    ground = Color(0xFFEEF2FD),
    surface = Color(0xFFFFFFFF),
    surfaceMuted = Color(0xFFE4EAFA),
    ink = Color(0xFF131A3A),
    inkSoft = Color(0xFF5C6489),
    primary = Color(0xFF2E5BEA),
    primarySoft = Color(0xFF6C93FF),
    onPrimary = Color(0xFFFFFFFF),
    accent = Color(0xFFFF9A3D),
    danger = Color(0xFFD93F4C),
    success = Color(0xFF14855A),
    outline = Color(0xFFD3DBF2),
    glass = Color(0xD9FFFFFF),
    glassBorder = Color(0xE6FFFFFF),
    isDark = false,
)

val DarkRecColors = RecColors(
    ground = Color(0xFF0B1029),
    surface = Color(0xFF161D40),
    surfaceMuted = Color(0xFF1E2753),
    ink = Color(0xFFEEF2FF),
    inkSoft = Color(0xFFA3ACD4),
    primary = Color(0xFF8FAAFF),
    primarySoft = Color(0xFFB4C6FF),
    onPrimary = Color(0xFF0B1029),
    accent = Color(0xFFFFB66B),
    danger = Color(0xFFFF8C94),
    success = Color(0xFF5FD39A),
    outline = Color(0xFF2C3668),
    glass = Color(0xD91E2753),
    glassBorder = Color(0x1FFFFFFF),
    isDark = true,
)

val LocalRecColors = staticCompositionLocalOf { LightRecColors }
