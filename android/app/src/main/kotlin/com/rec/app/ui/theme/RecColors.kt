package com.rec.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * Semantic color roles, taken from the iOS app's palette (the РЕЧ · REČ design
 * system) so both platforms look the same. Screens read these through
 * `RecTheme.colors` and never hold raw hex values.
 */
@Immutable
data class RecColors(
    /** Screen background. */
    val ground: Color,
    /** Cards and the tab bar. */
    val surface: Color,
    /** Raised fills: fields, stat pills, option rows. */
    val surfaceMuted: Color,
    /** Primary text. */
    val ink: Color,
    /** Secondary text and icons. */
    val inkSoft: Color,
    /** Navigation, selection and primary actions (indigo). */
    val primary: Color,
    val primarySoft: Color,
    /** Text and glyphs placed on [primary]. */
    val onPrimary: Color,
    /** Current lesson, progress and streak (ochre). */
    val accent: Color,
    /** Latin script, wrong answers and errors (oxblood). */
    val danger: Color,
    /** Correct answers and completed lessons (good). */
    val success: Color,
    /** Hairlines and borders. */
    val outline: Color,
    /** Path diamonds between lessons. */
    val thread: Color,
    val isDark: Boolean,
) {
    /** Dark navy hero for the welcome screen and the profile header; text on it is [onHero]. */
    val heroBrush: Brush get() = Brush.linearGradient(listOf(HeroStart, HeroMid))
    val onHero: Color get() = HeroText

    /** Full-bleed vertical version of the hero for the welcome screen. */
    val welcomeBrush: Brush get() = Brush.verticalGradient(listOf(HeroStart, HeroMid, HeroEnd))

    /** Warm medal gradient for trophies and badges. */
    val medalBrush: Brush get() = Brush.linearGradient(listOf(accent, danger))
}

private val HeroStart = Color(0xFF3A5580)
private val HeroMid = Color(0xFF223A5E)
private val HeroEnd = Color(0xFF101728)
private val HeroText = Color(0xFFF7F1E3)

val LightRecColors = RecColors(
    ground = Color(0xFFEDE7DA),
    surface = Color(0xFFFBF8F1),
    surfaceMuted = Color(0xFFFFFFFF),
    ink = Color(0xFF211A16),
    inkSoft = Color(0xFF6B5D50),
    primary = Color(0xFF223A5E),
    primarySoft = Color(0xFF3A5580),
    onPrimary = Color(0xFFF6F1E3),
    accent = Color(0xFFB9832A),
    danger = Color(0xFF7C2530),
    success = Color(0xFF3F7D4F),
    outline = Color(0x21211A16),
    thread = Color(0xFFC9BFA8),
    isDark = false,
)

val DarkRecColors = RecColors(
    ground = Color(0xFF161A25),
    surface = Color(0xFF1D2233),
    surfaceMuted = Color(0xFF242A3F),
    ink = Color(0xFFEEE8DB),
    inkSoft = Color(0xFFAFA595),
    primary = Color(0xFF8CA2CE),
    primarySoft = Color(0xFF5E76A8),
    onPrimary = Color(0xFFF6F1E3),
    accent = Color(0xFFE2B563),
    danger = Color(0xFFD68089),
    success = Color(0xFF74C48A),
    outline = Color(0x24EEE8DB),
    thread = Color(0xFF3A4258),
    isDark = true,
)

val LocalRecColors = staticCompositionLocalOf { LightRecColors }
