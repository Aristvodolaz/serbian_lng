package com.rec.app.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.common.rememberReducedMotion
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

/** Centered spinner for work that has no layout to preview (e.g. opening a lesson). */
@Composable
fun LoadingContent(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = RecTheme.colors.primary)
    }
}

/** Icon, title and optional subtitle/action for empty and finished states. */
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    tint: Color = RecTheme.colors.primary,
    action: (@Composable () -> Unit)? = null,
) {
    Column(
        modifier = modifier.fillMaxSize().padding(Spacing.xxl),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        IconBadge(icon = icon, tint = tint, size = 88.dp)
        Spacer(Modifier.height(Spacing.xl))
        Text(title, style = MaterialTheme.typography.headlineSmall, color = RecTheme.colors.ink, textAlign = TextAlign.Center)
        if (subtitle != null) {
            Spacer(Modifier.height(Spacing.sm))
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = RecTheme.colors.inkSoft, textAlign = TextAlign.Center)
        }
        if (action != null) {
            Spacer(Modifier.height(Spacing.xxl))
            action()
        }
    }
}

/** A dead-end error screen is the worst state to leave someone in, so every failure offers a retry. */
@Composable
fun ErrorContent(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    EmptyState(
        icon = Icons.Filled.CloudOff,
        title = message,
        tint = RecTheme.colors.danger,
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
        action = {
            RecSecondaryButton(
                text = stringResource(R.string.action_retry),
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth(0.7f),
            )
        },
    )
}

/**
 * Placeholder block shown while a screen's first load is in flight. Keeping
 * the layout's shape on screen reads as faster than a bare spinner.
 */
@Composable
fun SkeletonBlock(modifier: Modifier = Modifier, shape: Shape = RoundedCornerShape(Radius.md)) {
    val reducedMotion = rememberReducedMotion()
    val alpha = if (reducedMotion) {
        0.7f
    } else {
        val transition = rememberInfiniteTransition(label = "skeleton")
        val pulse by transition.animateFloat(
            initialValue = 0.45f,
            targetValue = 0.9f,
            animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
            label = "skeleton-alpha",
        )
        pulse
    }
    Box(modifier.graphicsLayer { this.alpha = alpha }.clip(shape).background(RecTheme.colors.surfaceMuted))
}
