package com.rec.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.Mono
import com.rec.app.ui.theme.RecTheme

@Composable
fun ScriptCard(
    label: String,
    sample: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    Surface(
        modifier = modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = if (selected) colors.indigo.copy(alpha = 0.10f) else colors.surface,
        border = BorderStroke(1.5.dp, if (selected) colors.indigo else colors.thread.copy(alpha = 0.6f)),
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
            if (selected) {
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
    val (border, bg, fg) = when (state) {
        ChoiceState.NEUTRAL -> Triple(colors.thread.copy(alpha = 0.6f), colors.surface, colors.ink)
        ChoiceState.SELECTED -> Triple(colors.indigo, colors.indigo.copy(alpha = 0.08f), colors.ink)
        ChoiceState.CORRECT -> Triple(colors.good, colors.good.copy(alpha = 0.12f), colors.good)
        ChoiceState.WRONG -> Triple(colors.oxblood, colors.oxblood.copy(alpha = 0.12f), colors.oxblood)
    }
    Surface(
        modifier = modifier.fillMaxWidth().clickable(onClick = onClick, enabled = state == ChoiceState.NEUTRAL || state == ChoiceState.SELECTED),
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
