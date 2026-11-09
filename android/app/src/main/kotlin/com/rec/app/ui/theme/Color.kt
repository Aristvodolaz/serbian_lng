package com.rec.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Palette: periwinkle ground, white frosted surfaces, royal-blue primary with
 * orange / coral / mint accents. Token names are kept from the old theme so
 * screens keep compiling; the values now follow the blue reference UI.
 */
object RecPalette {
    // Light
    val LightGround = Color(0xFFEEF2FD)
    val LightSurface = Color(0xFFFFFFFF)
    val LightSurface2 = Color(0xFFF4F7FF)
    val LightInk = Color(0xFF131A3A)
    val LightInkSoft = Color(0xFF6B7396)
    val LightIndigo = Color(0xFF2E5BEA)
    val LightIndigoSoft = Color(0xFF7DA0FF)
    val LightOxblood = Color(0xFFF2636E)   // coral: streaks, transliteration accents
    val LightOchre = Color(0xFFFF9A3D)     // orange: current lesson, progress highlight
    val LightThread = Color(0xFFD3DBF2)
    val LightGood = Color(0xFF20A46E)

    // Dark
    val DarkGround = Color(0xFF0B1029)
    val DarkSurface = Color(0xFF161D40)
    val DarkSurface2 = Color(0xFF1E2753)
    val DarkInk = Color(0xFFEEF2FF)
    val DarkInkSoft = Color(0xFFA3ACD4)
    val DarkIndigo = Color(0xFF7C9CFF)
    val DarkIndigoSoft = Color(0xFF4D6BDB)
    val DarkOxblood = Color(0xFFFF8C94)
    val DarkOchre = Color(0xFFFFB66B)
    val DarkThread = Color(0xFF2C3668)
    val DarkGood = Color(0xFF5FD39A)

    // Same in both themes — used as text on the always-blue hero surfaces.
    val Cream = Color(0xFFFFFFFF)
}
