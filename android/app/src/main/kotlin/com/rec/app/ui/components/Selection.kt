package com.rec.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.ui.common.pressScale
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Sizes
import com.rec.app.ui.theme.Spacing

enum class ChoiceState { NEUTRAL, SELECTED, CORRECT, WRONG }

/**
 * One answer in an exercise. Correct and wrong answers carry an icon as well
 * as a color, so the result doesn't depend on telling green from red.
 */
@Composable
fun ChoiceCard(
    text: String,
    state: ChoiceState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    val targetAccent = when (state) {
        ChoiceState.NEUTRAL -> colors.outline
        ChoiceState.SELECTED -> colors.primary
        ChoiceState.CORRECT -> colors.success
        ChoiceState.WRONG -> colors.danger
    }
    val border by animateColorAsState(targetAccent, Motion.fast(), label = "choice-border")
    val container by animateColorAsState(
        if (state == ChoiceState.NEUTRAL) colors.surface else targetAccent.copy(alpha = 0.12f),
        Motion.fast(),
        label = "choice-container",
    )
    val content by animateColorAsState(
        when (state) {
            ChoiceState.CORRECT -> colors.success
            ChoiceState.WRONG -> colors.danger
            else -> colors.ink
        },
        Motion.fast(),
        label = "choice-content",
    )
    val interaction = remember { MutableInteractionSource() }
    val answered = state == ChoiceState.CORRECT || state == ChoiceState.WRONG

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = Sizes.button)
            .pressScale(interaction, pressedScale = 0.97f)
            .semantics { selected = state != ChoiceState.NEUTRAL }
            .clip(RoundedCornerShape(Radius.md))
            .selectable(
                selected = state == ChoiceState.SELECTED,
                interactionSource = interaction,
                indication = ripple(),
                enabled = !answered,
                role = Role.RadioButton,
                onClick = onClick,
            ),
        shape = RoundedCornerShape(Radius.md),
        color = container,
        border = BorderStroke(1.5.dp, border),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.md),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = if (answered) FontWeight.Bold else FontWeight.SemiBold,
                color = content,
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f, fill = false),
            )
            if (answered) {
                Icon(
                    if (state == ChoiceState.CORRECT) Icons.Filled.Check else Icons.Filled.Close,
                    contentDescription = null,
                    tint = content,
                    modifier = Modifier.padding(start = Spacing.sm).size(18.dp),
                )
            }
        }
    }
}

/**
 * A titled option row. With [showChevron] it is a link to somewhere else
 * (the chosen-script summary); otherwise it is a radio-style choice.
 */
@Composable
fun OptionCard(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    showChevron: Boolean = false,
) {
    val colors = RecTheme.colors
    val border by animateColorAsState(if (selected && !showChevron) colors.primary else colors.outline, Motion.fast(), label = "option-border")
    val container by animateColorAsState(
        if (selected && !showChevron) colors.primary.copy(alpha = 0.08f) else colors.surface,
        Motion.fast(),
        label = "option-container",
    )
    val interaction = remember { MutableInteractionSource() }
    val shape = RoundedCornerShape(Radius.lg)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .pressScale(interaction, pressedScale = 0.98f)
            .clip(shape)
            .selectable(
                selected = selected,
                interactionSource = interaction,
                indication = ripple(),
                role = if (showChevron) Role.Button else Role.RadioButton,
                onClick = onClick,
            ),
        shape = shape,
        color = container,
        border = BorderStroke(1.5.dp, border),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.lg),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = colors.ink)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = colors.inkSoft)
            }
            if (showChevron) {
                Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = colors.inkSoft)
            } else {
                AnimatedVisibility(
                    visible = selected,
                    enter = scaleIn(Motion.fast()) + fadeIn(Motion.fast()),
                    exit = scaleOut(Motion.fast()) + fadeOut(Motion.fast()),
                ) {
                    Box(
                        modifier = Modifier.size(24.dp).background(colors.primary, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Filled.Check, contentDescription = null, tint = colors.onPrimary, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }
    }
}

/** Capsule switch between a few short options; the chosen one fills with the primary color. */
@Composable
fun SegmentedSwitch(
    options: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .shadow(Elevation.card, PillShape)
            .background(colors.surface, PillShape)
            .padding(Spacing.xs)
            .selectableGroup(),
    ) {
        options.forEachIndexed { index, label ->
            val selected = index == selectedIndex
            val container by animateColorAsState(if (selected) colors.primary else Color.Transparent, Motion.base(), label = "segment-container")
            val content by animateColorAsState(if (selected) colors.onPrimary else colors.inkSoft, Motion.base(), label = "segment-content")
            Box(
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = Sizes.touchTarget)
                    .clip(PillShape)
                    .background(container)
                    .selectable(selected = selected, role = Role.Tab, onClick = { onSelect(index) }),
                contentAlignment = Alignment.Center,
            ) {
                Text(label, style = MaterialTheme.typography.labelLarge, color = content)
            }
        }
    }
}
