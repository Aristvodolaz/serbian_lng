package com.rec.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.Mono
import com.rec.app.ui.theme.RecTheme

/** Shared press-in feel for tappable cards — lighter than buttons (0.98x) since these are bigger surfaces. */
@Composable
private fun rememberCardPressScale(interactionSource: MutableInteractionSource): Float {
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "card-press-scale",
    )
    return scale
}

@Composable
fun ScriptCard(
    label: String,
    sample: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    val interactionSource = remember { MutableInteractionSource() }
    val scale = rememberCardPressScale(interactionSource)
    val bg by animateColorAsState(if (selected) colors.indigo.copy(alpha = 0.10f) else colors.surface, tween(180), label = "script-card-bg")
    val border by animateColorAsState(if (selected) colors.indigo else colors.thread.copy(alpha = 0.6f), tween(180), label = "script-card-border")

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = bg,
        border = BorderStroke(1.5.dp, border),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(label, style = MaterialTheme.typography.titleMedium, color = colors.ink)
                Text(sample, style = MaterialTheme.typography.bodySmall, color = colors.inkSoft)
            }
            AnimatedVisibility(visible = selected, enter = scaleIn(tween(180)), exit = scaleOut(tween(120))) {
                Box(
                    modifier = Modifier.size(22.dp).background(colors.indigo, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Filled.Check, contentDescription = null, tint = colors.cream, modifier = Modifier.size(13.dp))
                }
            }
        }
    }
}

@Composable
fun ChoiceCard(
    text: String,
    state: ChoiceState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    val (targetBorder, targetBg, targetFg) = when (state) {
        ChoiceState.NEUTRAL -> Triple(colors.thread.copy(alpha = 0.6f), colors.surface, colors.ink)
        ChoiceState.SELECTED -> Triple(colors.indigo, colors.indigo.copy(alpha = 0.08f), colors.ink)
        ChoiceState.CORRECT -> Triple(colors.good, colors.good.copy(alpha = 0.12f), colors.good)
        ChoiceState.WRONG -> Triple(colors.oxblood, colors.oxblood.copy(alpha = 0.12f), colors.oxblood)
    }
    val border by animateColorAsState(targetBorder, tween(200), label = "choice-border")
    val bg by animateColorAsState(targetBg, tween(200), label = "choice-bg")
    val fg by animateColorAsState(targetFg, tween(200), label = "choice-fg")
    val interactionSource = remember { MutableInteractionSource() }
    val scale = rememberCardPressScale(interactionSource)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = state == ChoiceState.NEUTRAL || state == ChoiceState.SELECTED,
                onClick = onClick,
            ),
        shape = RoundedCornerShape(12.dp),
        color = bg,
        border = BorderStroke(1.5.dp, border),
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 13.dp, vertical = 11.dp),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (state == ChoiceState.CORRECT || state == ChoiceState.WRONG) FontWeight.Bold else FontWeight.Normal,
            color = fg,
        )
    }
}

enum class ChoiceState { NEUTRAL, SELECTED, CORRECT, WRONG }

/** Read-only summary of the chosen script on the register form — tapping it jumps back to the picker. */
@Composable
fun ScriptSummaryChip(
    label: String,
    sample: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    Surface(
        modifier = modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = colors.surface2,
        border = BorderStroke(1.dp, colors.thread.copy(alpha = 0.5f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.TextFields, contentDescription = null, tint = colors.inkSoft, modifier = Modifier.size(18.dp))
                Column(modifier = Modifier.padding(start = 10.dp)) {
                    Text(label, style = MaterialTheme.typography.titleMedium, color = colors.ink)
                    Text(sample, style = MaterialTheme.typography.bodySmall, color = colors.inkSoft)
                }
            }
            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = colors.inkSoft)
        }
    }
}

@Composable
fun StatCard(value: String, label: String, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = colors.surface2,
        border = BorderStroke(1.dp, colors.thread.copy(alpha = 0.5f)),
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(value, fontFamily = Mono, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge, color = colors.ink)
            Text(label, style = MaterialTheme.typography.labelSmall, color = colors.inkSoft)
        }
    }
}
