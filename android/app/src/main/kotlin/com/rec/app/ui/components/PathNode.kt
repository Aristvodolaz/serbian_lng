package com.rec.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.theme.RecTheme

enum class LessonPathStatus { DONE, CURRENT, LOCKED }

/** Horizontal offset of the lesson at [index] within its unit: the trail leans left, centre, right, centre. */
fun trailOffset(index: Int): Dp = listOf(0.dp, (-40).dp, 0.dp, 40.dp)[index % 4]

private val NodeSize = 64.dp

/**
 * One lesson on the learning path, as on the iOS app: a 64dp disc (green check
 * when done, gold star when current, dashed and locked otherwise), with the
 * title, Latin title and meta underneath. Checkpoints use a flag and an indigo ring.
 */
@Composable
fun PathNode(
    title: String,
    titleLatin: String,
    meta: String,
    status: LessonPathStatus,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isCheckpoint: Boolean = false,
    xOffset: Dp = 0.dp,
) {
    val colors = RecTheme.colors
    val locked = status == LessonPathStatus.LOCKED
    val stateText = stringResource(
        when (status) {
            LessonPathStatus.DONE -> R.string.cd_lesson_done
            LessonPathStatus.CURRENT -> R.string.cd_lesson_current
            LessonPathStatus.LOCKED -> R.string.cd_lesson_locked
        },
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .offset(x = xOffset)
            .semantics { stateDescription = stateText }
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(contentAlignment = Alignment.Center) {
            if (status == LessonPathStatus.CURRENT) {
                // The soft halo that marks the lesson to take next.
                Box(Modifier.size(NodeSize + 12.dp).background(colors.accent.copy(alpha = 0.22f), CircleShape))
            }
            if (isCheckpoint) {
                Box(Modifier.size(NodeSize + 6.dp).border(3.dp, colors.primary, CircleShape))
            }
            Box(
                modifier = Modifier
                    .size(NodeSize)
                    .then(if (locked) Modifier else Modifier.shadow(10.dp, CircleShape, spotColor = Color.Black))
                    .clip(CircleShape)
                    .background(
                        when (status) {
                            LessonPathStatus.DONE -> colors.success
                            LessonPathStatus.CURRENT -> colors.accent
                            LessonPathStatus.LOCKED -> colors.surface
                        },
                    )
                    .then(if (locked) Modifier.dashedRing(colors.outline) else Modifier),
                contentAlignment = Alignment.Center,
            ) {
                when (status) {
                    LessonPathStatus.DONE -> Icon(
                        if (isCheckpoint) Icons.Filled.Flag else Icons.Filled.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp),
                    )
                    LessonPathStatus.CURRENT -> Icon(
                        if (isCheckpoint) Icons.Filled.Flag else Icons.Filled.Star,
                        contentDescription = null,
                        tint = Color(0xFF2A1C00),
                        modifier = Modifier.size(24.dp),
                    )
                    LessonPathStatus.LOCKED -> Icon(
                        Icons.Filled.Lock,
                        contentDescription = null,
                        tint = colors.inkSoft,
                        modifier = Modifier.size(20.dp),
                    )
                }
            }
        }

        Column(
            modifier = Modifier.padding(top = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(1.dp),
        ) {
            Text(
                title,
                style = MaterialTheme.typography.titleMedium,
                color = if (locked) colors.inkSoft else colors.ink,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
            if (titleLatin.isNotBlank() && titleLatin != title) {
                Text(
                    titleLatin,
                    style = MaterialTheme.typography.bodySmall,
                    fontStyle = FontStyle.Italic,
                    color = colors.danger,
                    textAlign = TextAlign.Center,
                    maxLines = 1,
                )
            }
            Text(
                meta,
                style = MaterialTheme.typography.bodySmall,
                color = colors.inkSoft,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
        }
    }
}

/** Three small diamonds bridging two nodes, drifting from one offset to the other. */
@Composable
fun PathTrail(from: Dp, to: Dp, modifier: Modifier = Modifier) {
    val color = RecTheme.colors.thread
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clearAndSetSemantics { },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        repeat(3) { step ->
            val x = from + (to - from) * ((step + 1) / 4f)
            Box(
                Modifier
                    .offset(x = x)
                    .size(7.dp)
                    .rotate(45f)
                    .background(color, RoundedCornerShape(1.dp)),
            )
        }
    }
}

/** Dashed outline for locked discs, drawn in place of a solid border. */
private fun Modifier.dashedRing(color: Color): Modifier = drawBehind {
    val stroke = 1.5.dp.toPx()
    drawCircle(
        color = color,
        radius = size.minDimension / 2 - stroke / 2,
        center = Offset(size.width / 2, size.height / 2),
        style = Stroke(width = stroke, pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 5f))),
    )
}
