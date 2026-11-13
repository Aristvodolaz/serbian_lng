package com.rec.app.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.rec.app.ui.common.pressScale
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Sizes
import com.rec.app.ui.theme.Spacing

private val ButtonShape = RoundedCornerShape(14.dp)

/**
 * The main call to action: a solid indigo rounded button, as on the iOS app.
 * While [loading] it keeps its size and swaps the label for a spinner, so the
 * layout doesn't jump and a second tap can't fire.
 */
@Composable
fun RecPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    val colors = RecTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val alpha by animateFloatAsState(if (enabled) 1f else 0.4f, Motion.fast(), label = "button-alpha")
    Box(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .pressScale(interaction, pressedScale = 0.985f)
            .graphicsLayer { this.alpha = alpha }
            .clip(ButtonShape)
            .background(colors.primary)
            .clickable(
                interactionSource = interaction,
                indication = ripple(color = colors.onPrimary),
                enabled = enabled && !loading,
                role = Role.Button,
                onClick = onClick,
            )
            .padding(horizontal = Spacing.xxl, vertical = Spacing.md),
        contentAlignment = Alignment.Center,
    ) {
        AnimatedContent(
            targetState = loading,
            transitionSpec = { fadeIn(Motion.fast()) togetherWith fadeOut(Motion.fast()) },
            label = "button-content",
        ) { isLoading ->
            if (isLoading) {
                CircularProgressIndicator(Modifier.size(22.dp), color = colors.onPrimary, strokeWidth = 2.5.dp)
            } else {
                Text(text, style = MaterialTheme.typography.labelLarge, color = colors.onPrimary)
            }
        }
    }
}

/** Quiet alternative next to a primary button: surface fill with a hairline border. */
@Composable
fun RecSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    contentColor: Color = RecTheme.colors.ink,
    borderColor: Color = RecTheme.colors.outline,
    containerColor: Color = RecTheme.colors.surface,
    leadingIcon: ImageVector? = null,
) {
    val interaction = remember { MutableInteractionSource() }
    Surface(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().heightIn(min = Sizes.button).pressScale(interaction),
        shape = ButtonShape,
        color = containerColor,
        border = BorderStroke(1.5.dp, borderColor),
        interactionSource = interaction,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().heightIn(min = Sizes.button),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (leadingIcon != null) {
                Icon(leadingIcon, contentDescription = null, tint = contentColor, modifier = Modifier.size(18.dp))
                Box(Modifier.size(Spacing.sm))
            }
            Text(text, style = MaterialTheme.typography.labelLarge, color = contentColor)
        }
    }
}

/** Compact capsule for an action inside a card, e.g. "Continue" on the hero. */
@Composable
fun RecPillButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = RecTheme.colors.ink,
    contentColor: Color = RecTheme.colors.ground,
    trailingIcon: ImageVector? = null,
) {
    val interaction = remember { MutableInteractionSource() }
    Surface(
        onClick = onClick,
        modifier = modifier.heightIn(min = Sizes.touchTarget).pressScale(interaction),
        shape = PillShape,
        color = containerColor,
        interactionSource = interaction,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.xl),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text, style = MaterialTheme.typography.labelLarge, color = contentColor)
            if (trailingIcon != null) {
                Icon(trailingIcon, contentDescription = null, tint = contentColor, modifier = Modifier.size(18.dp))
            }
        }
    }
}

/** Round icon-only button (back, close, speak). Always a full 48dp target. */
@Composable
fun RecIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = RecTheme.colors.surface,
    tint: Color = RecTheme.colors.ink,
    elevated: Boolean = true,
) {
    val interaction = remember { MutableInteractionSource() }
    Surface(
        onClick = onClick,
        modifier = modifier.size(Sizes.touchTarget).pressScale(interaction, pressedScale = 0.92f),
        shape = CircleShape,
        color = containerColor,
        shadowElevation = if (elevated) com.rec.app.ui.theme.Elevation.card else 0.dp,
        interactionSource = interaction,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = contentDescription, tint = tint, modifier = Modifier.size(Sizes.icon))
        }
    }
}
