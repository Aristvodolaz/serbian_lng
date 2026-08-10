package com.rec.app.ui.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * App-specific tokens that don't map cleanly onto Material3's ColorScheme
 * slots (ground/surface2/inkSoft/thread/good) — mirrors the extra CSS custom
 * properties in the web mockup that go beyond a generic primary/secondary set.
 */
data class RecColors(
    val ground: Color,
    val surface: Color,
    val surface2: Color,
    val ink: Color,
    val inkSoft: Color,
    val indigo: Color,
    val indigoSoft: Color,
    val oxblood: Color,
    val ochre: Color,
    val thread: Color,
    val good: Color,
    val cream: Color,
)

val LightRecColors = RecColors(
    ground = RecPalette.LightGround,
    surface = RecPalette.LightSurface,
    surface2 = RecPalette.LightSurface2,
    ink = RecPalette.LightInk,
    inkSoft = RecPalette.LightInkSoft,
    indigo = RecPalette.LightIndigo,
    indigoSoft = RecPalette.LightIndigoSoft,
    oxblood = RecPalette.LightOxblood,
    ochre = RecPalette.LightOchre,
    thread = RecPalette.LightThread,
    good = RecPalette.LightGood,
    cream = RecPalette.Cream,
)

val DarkRecColors = RecColors(
    ground = RecPalette.DarkGround,
    surface = RecPalette.DarkSurface,
    surface2 = RecPalette.DarkSurface2,
    ink = RecPalette.DarkInk,
    inkSoft = RecPalette.DarkInkSoft,
    indigo = RecPalette.DarkIndigo,
    indigoSoft = RecPalette.DarkIndigoSoft,
    oxblood = RecPalette.DarkOxblood,
    ochre = RecPalette.DarkOchre,
    thread = RecPalette.DarkThread,
    good = RecPalette.DarkGood,
    cream = RecPalette.Cream,
)

val LocalRecColors = staticCompositionLocalOf { LightRecColors }
