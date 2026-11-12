package com.rec.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Serif for headings and sentences, sans for controls and body: the same split
// as the iOS app. Both scripts render in either face on Android.
private val Sans = FontFamily.SansSerif
private val Serif = FontFamily.Serif

private fun style(
    family: FontFamily,
    weight: FontWeight,
    size: Int,
    lineHeight: Int,
    spacing: Double = 0.0,
) = TextStyle(
    fontFamily = family,
    fontWeight = weight,
    fontSize = size.sp,
    lineHeight = lineHeight.sp,
    letterSpacing = spacing.sp,
)

val RecTypography = Typography(
    displayLarge = style(Serif, FontWeight.Bold, 36, 42, -0.5),
    displayMedium = style(Serif, FontWeight.Bold, 30, 36, -0.4),
    displaySmall = style(Serif, FontWeight.Bold, 26, 32, -0.3),
    headlineSmall = style(Serif, FontWeight.Bold, 22, 28, -0.2),
    titleLarge = style(Sans, FontWeight.Bold, 19, 24),
    titleMedium = style(Sans, FontWeight.Bold, 16, 22),
    titleSmall = style(Sans, FontWeight.SemiBold, 14, 20),
    bodyLarge = style(Sans, FontWeight.Normal, 16, 23),
    bodyMedium = style(Sans, FontWeight.Normal, 14, 20),
    bodySmall = style(Sans, FontWeight.Normal, 12, 17),
    labelLarge = style(Sans, FontWeight.SemiBold, 15, 20, 0.1),
    labelMedium = style(Sans, FontWeight.SemiBold, 12, 16, 0.4),
    labelSmall = style(Sans, FontWeight.SemiBold, 11, 14, 0.6),
)

/** Counters (streak, XP, progress): tabular figures so digits don't jitter as they change. */
val NumberStyle = style(Sans, FontWeight.Bold, 14, 18).copy(fontFeatureSettings = "tnum")
