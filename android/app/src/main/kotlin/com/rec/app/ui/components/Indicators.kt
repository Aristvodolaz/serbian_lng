package com.rec.app.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.NumberStyle
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

/** Thin capsule progress bar; fills step by step instead of jumping to the new value. */
@Composable
fun RecProgressBar(progress: Float, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    val target = progress.coerceIn(0f, 1f)
    val animated by animateFloatAsState(target, Motion.slow(), label = "progress")
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(10.dp)
            .clip(PillShape)
            .background(colors.primary.copy(alpha = 0.14f))
            .semantics { progressBarRangeInfo = ProgressBarRangeInfo(target, 0f..1f) },
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(animated)
                .clip(PillShape)
                .background(colors.primaryBrush),
        )
    }
}

/** Circular progress with content in the middle, like the "2/3" ring on the reference hero card. */
@Composable
fun ProgressRing(
    progress: Float,
    modifier: Modifier = Modifier,
    size: Dp = 72.dp,
    strokeWidth: Dp = 7.dp,
    color: Color = RecTheme.colors.onHero,
    trackColor: Color = RecTheme.colors.onHero.copy(alpha = 0.25f),
    content: @Composable () -> Unit = {},
) {
    val target = progress.coerceIn(0f, 1f)
    val animated by animateFloatAsState(target, Motion.slow(), label = "ring")
    Box(
        modifier = modifier
            .size(size)
            .semantics { progressBarRangeInfo = ProgressBarRangeInfo(target, 0f..1f) },
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.size(size)) {
            val stroke = strokeWidth.toPx()
            val inset = stroke / 2
            val arcSize = Size(this.size.width - stroke, this.size.height - stroke)
            drawArc(trackColor, 0f, 360f, false, Offset(inset, inset), arcSize, style = Stroke(stroke))
            drawArc(color, -90f, 360f * animated, false, Offset(inset, inset), arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
        }
        content()
    }
}

/** Onboarding step indicator: the active step stretches into a capsule. */
@Composable
fun PageDots(total: Int, activeIndex: Int, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Row(
        modifier = modifier.clearAndSetSemantics { },
        horizontalArrangement = Arrangement.spacedBy(Spacing.xs + Spacing.xxs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(total) { index ->
            val active = index == activeIndex
            val width by animateDpAsState(if (active) 24.dp else 8.dp, Motion.settle(), label = "dot-width")
            Box(
                Modifier
                    .height(8.dp)
                    .width(width)
                    .background(if (active) colors.primary else colors.outline, PillShape),
            )
        }
    }
}

/** Icon plus number capsule for counters such as the streak and XP. */
@Composable
fun StatPill(
    icon: ImageVector,
    value: String,
    tint: Color,
    contentDescription: String,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    val content: @Composable () -> Unit = {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.xs + Spacing.xxs),
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
            Text(value, style = NumberStyle, color = RecTheme.colors.ink)
        }
    }
    val semanticsModifier = modifier.semantics(mergeDescendants = true) { this.contentDescription = contentDescription }
    if (onClick != null) {
        Surface(onClick = onClick, modifier = semanticsModifier, shape = PillShape, color = RecTheme.colors.surface, shadowElevation = 2.dp, content = content)
    } else {
        Surface(modifier = semanticsModifier, shape = PillShape, color = RecTheme.colors.surface, shadowElevation = 2.dp, content = content)
    }
}

/** Small text capsule: "3 / 8" in a lesson, a status tag. */
@Composable
fun CounterPill(
    text: String,
    modifier: Modifier = Modifier,
    containerColor: Color = RecTheme.colors.surface,
    contentColor: Color = RecTheme.colors.ink,
) {
    Surface(modifier = modifier, shape = PillShape, color = containerColor) {
        Text(
            text,
            style = NumberStyle,
            color = contentColor,
            modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
        )
    }
}
