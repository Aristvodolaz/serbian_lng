package com.rec.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsBottomHeight
import androidx.compose.foundation.background
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.RecTheme

@Immutable
data class NavItem(val icon: ImageVector, val label: String)

/**
 * The bottom tab bar of the iOS app: icon above a label, the selected tab in
 * indigo, a hairline on top, and the system navigation inset below.
 */
@Composable
fun RecTabBar(
    items: List<NavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    Column(modifier = modifier.fillMaxWidth().background(colors.surface)) {
        HorizontalDivider(color = colors.outline)
        Row(
            modifier = Modifier.fillMaxWidth().height(58.dp).selectableGroup(),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            items.forEachIndexed { index, item ->
                val selected = index == selectedIndex
                val tint by animateColorAsState(
                    if (selected) colors.primary else colors.inkSoft,
                    Motion.base(),
                    label = "tab-tint",
                )
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .selectable(selected = selected, role = Role.Tab, onClick = { onSelect(index) }),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Icon(item.icon, contentDescription = item.label, tint = tint, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.height(2.dp))
                    Text(item.label, style = MaterialTheme.typography.labelSmall, color = tint)
                }
            }
        }
        Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.navigationBars))
    }
}
