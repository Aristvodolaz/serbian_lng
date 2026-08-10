package com.rec.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

/** The rotated-square "kilim" badge motif from the profile screen mockup. */
@Composable
fun BadgeDiamond(modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .graphicsLayer { rotationZ = 45f }
            .clip(RoundedCornerShape(6.dp))
            .background(Brush.linearGradient(listOf(colors.ochre, colors.oxblood), start = Offset(0f, 0f))),
    )
}
