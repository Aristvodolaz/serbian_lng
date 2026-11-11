package com.rec.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// The system sans covers Cyrillic and Latin alike, which matters for an app
// that shows both scripts side by side. Heavy display weights give the bold
// headings of the reference UI.
private val Sans = FontFamily.SansSerif

private fun style(weight: FontWeight, size: Int, lineHeight: Int, spacing: Double = 0.0) = TextStyle(
    fontFamily = Sans,
    fontWeight = weight,
    fontSize = size.sp,
    lineHeight = lineHeight.sp,
    letterSpacing = spacing.sp,
)

val RecTypography = Typography(
    displayLarge = style(FontWeight.ExtraBold, 40, 46, -0.5),
    displayMedium = style(FontWeight.ExtraBold, 32, 38, -0.4),
    displaySmall = style(FontWeight.Bold, 28, 34, -0.3),
    headlineSmall = style(FontWeight.Bold, 22, 28, -0.2),
    titleLarge = style(FontWeight.Bold, 19, 24),
    titleMedium = style(FontWeight.SemiBold, 16, 22),
    titleSmall = style(FontWeight.SemiBold, 14, 20),
    bodyLarge = style(FontWeight.Normal, 16, 24),
    bodyMedium = style(FontWeight.Normal, 14, 21),
    bodySmall = style(FontWeight.Normal, 12, 17),
    labelLarge = style(FontWeight.Bold, 15, 20, 0.1),
    labelMedium = style(FontWeight.Bold, 12, 16, 0.4),
    labelSmall = style(FontWeight.Bold, 11, 14, 0.5),
)

/** Counters (streak, XP, progress): tabular figures so digits don't jitter as they change. */
val NumberStyle = style(FontWeight.Bold, 14, 18).copy(fontFeatureSettings = "tnum")
