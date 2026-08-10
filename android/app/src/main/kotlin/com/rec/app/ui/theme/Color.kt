package com.rec.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Ports the design tokens from the РЕЧ/REČ web mockup 1:1 (see the `:root` /
 * `[data-theme="dark"]` custom properties there) so the app matches it exactly
 * rather than re-deriving a palette from scratch.
 */
object RecPalette {
    // Light
    val LightGround = Color(0xFFEDE7DA)
    val LightSurface = Color(0xFFFBF8F1)
    val LightSurface2 = Color(0xFFFFFFFF)
    val LightInk = Color(0xFF211A16)
    val LightInkSoft = Color(0xFF6B5D50)
    val LightIndigo = Color(0xFF223A5E)
    val LightIndigoSoft = Color(0xFF3A5580)
    val LightOxblood = Color(0xFF7C2530)
    val LightOchre = Color(0xFFB9832A)
    val LightThread = Color(0xFFC9BFA8)
    val LightGood = Color(0xFF3F7D4F)

    // Dark
    val DarkGround = Color(0xFF161A25)
    val DarkSurface = Color(0xFF1D2233)
    val DarkSurface2 = Color(0xFF242A3F)
    val DarkInk = Color(0xFFEEE8DB)
    val DarkInkSoft = Color(0xFFAFA595)
    val DarkIndigo = Color(0xFF8CA2CE)
    val DarkIndigoSoft = Color(0xFF5E76A8)
    val DarkOxblood = Color(0xFFD68089)
    val DarkOchre = Color(0xFFE2B563)
    val DarkThread = Color(0xFF3A4258)
    val DarkGood = Color(0xFF74C48A)

    // Same in both themes — used as text on the always-dark hero/indigo surfaces.
    val Cream = Color(0xFFF6F1E3)
}
