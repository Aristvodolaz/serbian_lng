package com.rec.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

@Composable
fun RecProgressBar(progress: Float, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    // Animated rather than jumping straight to the new value — each answered
    // exercise fills in a visible step instead of the bar just teleporting.
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(350),
        label = "lesson-progress",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(colors.thread.copy(alpha = 0.35f)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(animatedProgress)
                .align(Alignment.CenterStart)
                .clip(RoundedCornerShape(6.dp))
                .background(colors.ochre),
        )
    }
}
