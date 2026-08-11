package com.rec.app.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme
import kotlinx.coroutines.launch

enum class LessonPathStatus { DONE, CURRENT, LOCKED }

private data class NodeStyle(val bg: Color, val fg: Color, val border: Color?, val elevated: Boolean)

/** Short dashed line between two stacked nodes in the same unit. */
@Composable
fun PathConnector(modifier: Modifier = Modifier) {
    val color = RecTheme.colors.thread
    Canvas(modifier.width(2.dp).height(22.dp)) {
        drawLine(
            color = color,
            start = Offset(size.width / 2, 0f),
            end = Offset(size.width / 2, size.height),
            strokeWidth = size.width,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f)),
        )
    }
}

@Composable
fun PathNode(
    title: String,
    titleLatin: String,
    meta: String,
    status: LessonPathStatus,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onLockedTap: () -> Unit = {},
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

    // Every node responds to touch — a locked one just refuses with a shake
    // instead of doing nothing, so tapping it reads as "not yet", not "broken".
    val scope = rememberCoroutineScope()
    val shakeOffset = remember { Animatable(0f) }
    var shakeTrigger by remember { mutableIntStateOf(0) }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .graphicsLayer { translationX = shakeOffset.value }
            .clickable {
                if (status == LessonPathStatus.LOCKED) {
                    shakeTrigger++
                    onLockedTap()
                    scope.launch {
                        val keyframes = listOf(0f, -8f, 8f, -5f, 5f, 0f)
                        for (v in keyframes) shakeOffset.animateTo(v, tween(45))
                    }
                } else {
                    onClick()
                }
            },
    ) {
        Box(contentAlignment = Alignment.Center) {
            if (status == LessonPathStatus.CURRENT) {
                val pulse = rememberInfiniteHalo()
                Box(
                    Modifier
                        .size(64.dp)
                        .graphicsLayer { scaleX = pulse.first; scaleY = pulse.first; alpha = pulse.second }
                        .background(colors.ochre, CircleShape),
                )
            }

            Surface(
                shape = CircleShape,
                color = style.bg,
                border = style.border?.let { BorderStroke(1.5.dp, it) },
                modifier = Modifier
                    .size(64.dp)
                    .then(if (style.elevated) Modifier.shadow(8.dp, CircleShape) else Modifier),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = style.fg, modifier = Modifier.size(22.dp))
                }
            }
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(top = 8.dp).width(150.dp)) {
            Text(
                title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.ink,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
            Text(
                titleLatin,
                style = MaterialTheme.typography.bodySmall,
                fontStyle = FontStyle.Italic,
                color = colors.oxblood,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
            Text(
                meta,
                style = MaterialTheme.typography.labelSmall,
                color = colors.inkSoft,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
        }
    }
}

/** Returns (scale, alpha) of a slow expanding/fading halo, for the current-lesson glow. */
@Composable
private fun rememberInfiniteHalo(): Pair<Float, Float> {
    val pulse = androidx.compose.animation.core.rememberInfiniteTransition(label = "current-node-pulse")
    val scale by pulse.animateFloat(
        initialValue = 1f,
        targetValue = 1.4f,
        animationSpec = infiniteRepeatable(tween(1500, easing = LinearEasing), RepeatMode.Restart),
        label = "pulse-scale",
    )
    val alpha by pulse.animateFloat(
        initialValue = 0.4f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(tween(1500, easing = LinearEasing), RepeatMode.Restart),
        label = "pulse-alpha",
    )
    return scale to alpha
}
