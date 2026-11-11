package com.rec.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Sizes
import com.rec.app.ui.theme.Spacing

/** The standard raised surface. Pass [onClick] to make the whole card tappable. */
@Composable
fun RecCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    shape: Shape = RoundedCornerShape(Radius.lg),
    color: Color = RecTheme.colors.surface,
    elevation: Dp = Elevation.card,
    content: @Composable () -> Unit,
) {
    if (onClick != null) {
        Surface(
            onClick = onClick,
            modifier = modifier,
            shape = shape,
            color = color,
            shadowElevation = elevation,
            content = content
        )
    } else {
        Surface(
            modifier = modifier,
            shape = shape,
            color = color,
            shadowElevation = elevation,
            content = content
        )
    }
}

/** Screen header: optional round back button, a title, and trailing actions. */
@Composable
fun RecTopBar(
    modifier: Modifier = Modifier,
    title: String? = null,
    onBack: (() -> Unit)? = null,
    backIcon: ImageVector = Icons.AutoMirrored.Filled.ArrowBack,
    backDescription: String = stringResource(R.string.cd_back),
    actions: @Composable RowScope.() -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(64.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            RecIconButton(icon = backIcon, contentDescription = backDescription, onClick = onBack)
            Box(Modifier.size(Spacing.md))
        }
        Text(
            text = title.orEmpty(),
            style = MaterialTheme.typography.titleLarge,
            color = RecTheme.colors.ink,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .weight(1f)
                .semantics { heading() },
        )
        actions()
    }
}

/** Round avatar with the first letter of [name] on the hero gradient. */
@Composable
fun InitialAvatar(
    name: String,
    modifier: Modifier = Modifier,
    size: Dp = Sizes.avatar,
    brush: Brush = RecTheme.colors.heroBrush,
    contentColor: Color = RecTheme.colors.onHero,
) {
    Box(
        modifier = modifier
            .size(size)
            .background(brush, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            name.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
            style = MaterialTheme.typography.titleLarge,
            color = contentColor,
        )
    }
}

/** A small tinted circle holding an icon: list leading visuals, state badges. */
@Composable
fun IconBadge(
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    container: Color = tint.copy(alpha = 0.14f),
    size: Dp = 44.dp,
) {
    Box(
        modifier = modifier
            .size(size)
            .background(container, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.material3.Icon(
            icon, contentDescription = null, tint = tint, modifier = Modifier.size(size * 0.48f)
        )
    }
}

/** Uppercase-free section label above a group of controls. */
@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text,
        style = MaterialTheme.typography.titleSmall,
        color = RecTheme.colors.inkSoft,
        modifier = modifier
            .padding(bottom = Spacing.sm)
            .semantics { heading() },
    )
}
