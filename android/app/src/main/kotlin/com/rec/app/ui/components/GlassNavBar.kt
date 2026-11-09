package com.rec.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

/**
 * Floating frosted-glass tab bar from the reference: a translucent white capsule
 * with a light rim and soft shadow, floating above the ground. The selected tab
 * becomes a solid blue pill that holds its label.
 */
@Composable
fun GlassNavBar(
    items: List<Pair<ImageVector, String>>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    val capsule = RoundedCornerShape(36.dp)
    // Ground behind the bar so the bottom inset never shows a white strip.
    Box(modifier = modifier.fillMaxWidth().background(colors.ground).navigationBarsPadding()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
                .shadow(18.dp, capsule, spotColor = colors.indigo)
                .clip(capsule)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.White.copy(alpha = 0.88f), Color.White.copy(alpha = 0.62f)),
                    ),
                )
                .border(1.dp, Color.White.copy(alpha = 0.9f), capsule)
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEachIndexed { index, (icon, label) ->
                val selected = index == selectedIndex
                val bg by animateColorAsState(if (selected) colors.indigo else Color.Transparent, tween(240), label = "nav-bg")
                val fg by animateColorAsState(if (selected) colors.cream else colors.inkSoft, tween(240), label = "nav-fg")
                Row(
                    modifier = Modifier
                        .weight(if (selected) 1.6f else 1f)
                        .height(52.dp)
                        .clip(RoundedCornerShape(26.dp))
                        .background(bg)
                        .clickable { onSelect(index) }
                        .padding(horizontal = 10.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(icon, contentDescription = label, tint = fg, modifier = Modifier.size(22.dp))
                    if (selected) {
                        Spacer(Modifier.width(6.dp))
                        Text(label, style = MaterialTheme.typography.labelLarge, color = fg, maxLines = 1)
                    }
                }
            }
        }
    }
}
