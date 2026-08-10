package com.rec.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rec.app.ui.theme.Mono
import com.rec.app.ui.theme.RecTheme
import androidx.compose.ui.text.font.FontWeight

@Composable
fun StreakPill(days: Int, modifier: Modifier = Modifier) {
    RecPill(icon = Icons.Filled.LocalFireDepartment, value = days.toString(), tint = RecTheme.colors.oxblood, modifier = modifier)
}

@Composable
fun XpPill(xp: Int, modifier: Modifier = Modifier) {
    RecPill(icon = Icons.Filled.Diamond, value = xp.toString(), tint = RecTheme.colors.indigo, modifier = modifier)
}

@Composable
private fun RecPill(icon: ImageVector, value: String, tint: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = RecTheme.colors.surface2,
        border = BorderStroke(1.dp, RecTheme.colors.thread.copy(alpha = 0.5f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.width(16.dp))
            Text(value, fontFamily = Mono, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = RecTheme.colors.ink)
        }
    }
}
