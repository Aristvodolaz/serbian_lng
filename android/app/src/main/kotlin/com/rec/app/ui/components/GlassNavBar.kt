package com.rec.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Sizes
import com.rec.app.ui.theme.Spacing

/** Height the bar takes above the system navigation inset: item, capsule padding, outer padding. */
val GlassNavBarHeight = Sizes.navItem + Spacing.sm * 2 + Spacing.md * 2

/**
 * Space at the bottom of a tab screen that the floating bar covers. Scrolling
 * content adds it as bottom padding so its last item can be scrolled clear of the bar.
 */
val LocalBottomBarInset = compositionLocalOf { 0.dp }

@Immutable
data class NavItem(val icon: ImageVector, val label: String)

/**
 * The floating glass tab bar from the reference: a translucent capsule of round
 * icon buttons, the active one filled dark. Every item keeps a fixed size, so
 * switching tabs only animates color and a small scale and never re-lays out
 * the bar.
 */
@Composable
fun GlassNavBar(
    items: List<NavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(vertical = Spacing.md),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier = Modifier
                .shadow(Elevation.floating, PillShape, ambientColor = colors.primary, spotColor = colors.primary)
                .clip(PillShape)
                .background(colors.glass)
                .border(1.dp, colors.glassBorder, PillShape)
                .padding(Spacing.sm)
                .selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEachIndexed { index, item ->
                val selected = index == selectedIndex
                val container by animateColorAsState(
                    if (selected) colors.ink else colors.primary.copy(alpha = 0.10f),
                    Motion.base(),
                    label = "nav-container",
                )
                val content by animateColorAsState(if (selected) colors.ground else colors.inkSoft, Motion.base(), label = "nav-content")
                val scale by animateFloatAsState(if (selected) 1f else 0.92f, Motion.settle(), label = "nav-scale")
                Box(
                    modifier = Modifier
                        .size(Sizes.navItem)
                        .graphicsLayer {
                            scaleX = scale
                            scaleY = scale
                        }
                        .clip(CircleShape)
                        .background(container)
                        .selectable(selected = selected, role = Role.Tab, onClick = { onSelect(index) })
                        .semantics { contentDescription = item.label },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(item.icon, contentDescription = null, tint = content, modifier = Modifier.size(24.dp))
                }
            }
        }
    }
}
