package com.rec.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

enum class LessonPathStatus { DONE, CURRENT, LOCKED }

private data class NodeStyle(val bg: Color, val fg: Color, val border: Color?, val elevated: Boolean)

@Composable
fun PathNode(
    label: String,
    status: LessonPathStatus,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    val style = when (status) {
        LessonPathStatus.DONE -> NodeStyle(colors.good, Color.White, null, elevated = true)
        LessonPathStatus.CURRENT -> NodeStyle(colors.ochre, Color(0xFF2A1C00), null, elevated = true)
        LessonPathStatus.LOCKED -> NodeStyle(colors.surface2, colors.inkSoft, colors.thread, elevated = false)
    }
    val icon = when (status) {
        LessonPathStatus.DONE -> Icons.Filled.Check
        LessonPathStatus.CURRENT -> Icons.Filled.Star
        LessonPathStatus.LOCKED -> Icons.Filled.Lock
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Box(contentAlignment = Alignment.Center) {
            // A slow expanding-and-fading halo behind the *current* lesson —
            // the one node that actually needs to grab the eye on a path
            // that's otherwise just a static list of circles.
            if (status == LessonPathStatus.CURRENT) {
                val pulse = rememberInfiniteTransition(label = "current-node-pulse")
                val pulseScale by pulse.animateFloat(
                    initialValue = 1f,
                    targetValue = 1.45f,
                    animationSpec = infiniteRepeatable(tween(1500, easing = LinearEasing), RepeatMode.Restart),
                    label = "pulse-scale",
                )
                val pulseAlpha by pulse.animateFloat(
                    initialValue = 0.4f,
                    targetValue = 0f,
                    animationSpec = infiniteRepeatable(tween(1500, easing = LinearEasing), RepeatMode.Restart),
                    label = "pulse-alpha",
                )
                Box(
                    Modifier
                        .size(58.dp)
                        .graphicsLayer {
                            scaleX = pulseScale
                            scaleY = pulseScale
                            alpha = pulseAlpha
                        }
                        .background(colors.ochre, CircleShape),
                )
            }

            Surface(
                shape = CircleShape,
                color = style.bg,
                border = style.border?.let { BorderStroke(1.5.dp, it) },
                modifier = Modifier
                    .size(58.dp)
                    .then(if (style.elevated) Modifier.shadow(6.dp, CircleShape) else Modifier),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = style.fg, modifier = Modifier.size(18.dp))
                }
            }
        }
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = colors.ink,
            textAlign = TextAlign.Center,
            maxLines = 1,
            modifier = Modifier.padding(top = 4.dp).width(64.dp),
        )
    }
}
