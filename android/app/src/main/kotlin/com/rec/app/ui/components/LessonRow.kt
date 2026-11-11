package com.rec.app.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.common.pressScale
import com.rec.app.ui.common.rememberReducedMotion
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing
import kotlinx.coroutines.launch

enum class LessonPathStatus { DONE, CURRENT, LOCKED }

/**
 * A lesson as a capsule row, after the reference's course list: the current
 * lesson is the dark "inverse" row with an arrow, finished ones are quiet white
 * rows with a check, locked ones are muted and shake when tapped.
 */
@Composable
fun LessonRow(
    title: String,
    titleLatin: String,
    meta: String,
    status: LessonPathStatus,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onLockedTap: () -> Unit = {},
) {
    val colors = RecTheme.colors
    val isCurrent = status == LessonPathStatus.CURRENT
    val isLocked = status == LessonPathStatus.LOCKED

    val container = when (status) {
        LessonPathStatus.CURRENT -> colors.ink
        LessonPathStatus.DONE -> colors.surface
        LessonPathStatus.LOCKED -> colors.surfaceMuted
    }
    val titleColor = when (status) {
        LessonPathStatus.CURRENT -> colors.ground
        LessonPathStatus.DONE -> colors.ink
        LessonPathStatus.LOCKED -> colors.inkSoft
    }
    val secondaryColor = if (isCurrent) colors.ground.copy(alpha = 0.72f) else colors.inkSoft
    val stateText = stringResource(
        when (status) {
            LessonPathStatus.DONE -> R.string.cd_lesson_done
            LessonPathStatus.CURRENT -> R.string.cd_lesson_current
            LessonPathStatus.LOCKED -> R.string.cd_lesson_locked
        },
    )

    val scope = rememberCoroutineScope()
    val shake = remember { Animatable(0f) }
    val reducedMotion = rememberReducedMotion()
    val interaction = remember { MutableInteractionSource() }

    Surface(
        onClick = {
            if (isLocked) {
                onLockedTap()
                if (!reducedMotion) {
                    scope.launch {
                        for (offset in listOf(-10f, 10f, -6f, 6f, 0f)) shake.animateTo(
                            offset, tween(45)
                        )
                    }
                }
            } else {
                onClick()
            }
        },
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer { translationX = shake.value }
            .pressScale(interaction, pressedScale = 0.98f)
            .semantics { stateDescription = stateText },
        shape = PillShape,
        color = container,
        shadowElevation = if (isLocked) 0.dp else Elevation.card,
        interactionSource = interaction,
    ) {
        Row(
            modifier = Modifier.padding(Spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(
                        when (status) {
                            LessonPathStatus.CURRENT -> colors.ground
                            LessonPathStatus.DONE -> colors.success.copy(alpha = 0.14f)
                            LessonPathStatus.LOCKED -> colors.surface
                        },
                        CircleShape,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    when (status) {
                        LessonPathStatus.CURRENT -> Icons.Filled.Star
                        LessonPathStatus.DONE -> Icons.Filled.Check
                        LessonPathStatus.LOCKED -> Icons.Filled.Lock
                    },
                    contentDescription = null,
                    tint = when (status) {
                        LessonPathStatus.CURRENT -> colors.accent
                        LessonPathStatus.DONE -> colors.success
                        LessonPathStatus.LOCKED -> colors.inkSoft
                    },
                    modifier = Modifier.size(24.dp),
                )
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = Spacing.md)
            ) {
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    color = titleColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    if (titleLatin.isNotBlank() && titleLatin != title) "$titleLatin · $meta" else meta,
                    style = MaterialTheme.typography.bodySmall,
                    fontStyle = FontStyle.Normal,
                    color = secondaryColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (isCurrent) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(colors.primary, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = colors.onPrimary,
                        modifier = Modifier.size(20.dp),
                    )
                }
            } else {
                Box(Modifier.size(Spacing.md))
            }
        }
    }
}
