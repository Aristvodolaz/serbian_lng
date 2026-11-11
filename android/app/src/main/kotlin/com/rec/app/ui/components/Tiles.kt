package com.rec.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

/** One number with its label and a tinted icon, after the reference's stat tiles. */
@Composable
fun StatTile(
    icon: ImageVector,
    value: String,
    label: String,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    RecCard(modifier = modifier.semantics(mergeDescendants = true) { }) {
        Column(Modifier.padding(Spacing.lg)) {
            IconBadge(icon = icon, tint = tint, size = 40.dp)
            Spacer(Modifier.height(Spacing.md))
            Text(value, style = MaterialTheme.typography.displaySmall, color = RecTheme.colors.ink)
            Text(
                label, style = MaterialTheme.typography.bodyMedium, color = RecTheme.colors.inkSoft
            )
        }
    }
}

/** Round trophy medal on the warm gradient: earned badges and the lesson-complete moment. */
@Composable
fun BadgeMedal(modifier: Modifier = Modifier, size: Dp = 56.dp) {
    val colors = RecTheme.colors
    Box(
        modifier = modifier
            .size(size)
            .shadow(
                Elevation.raised,
                CircleShape,
                ambientColor = colors.accent,
                spotColor = colors.accent
            )
            .background(colors.medalBrush, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            Icons.Filled.EmojiEvents,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(size * 0.5f)
        )
    }
}
