package com.rec.app.ui.screens.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.components.EmptyState
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.PathNode
import com.rec.app.ui.components.PathTrail
import com.rec.app.ui.components.SkeletonBlock
import com.rec.app.ui.components.StatPill
import com.rec.app.ui.components.trailOffset
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

@Composable
fun HomeRoute(viewModel: HomeViewModel, onLessonClick: (String) -> Unit, onProfileClick: () -> Unit) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    // Runs on every entry, so progress is fresh after a lesson; loaded content stays visible meanwhile.
    LaunchedEffect(viewModel) { viewModel.refresh() }
    HomeScreen(state = state, onRetry = viewModel::refresh, onLessonClick = onLessonClick, onProfileClick = onProfileClick)
}

@Composable
fun HomeScreen(
    state: HomeUiState,
    onRetry: () -> Unit,
    onLessonClick: (String) -> Unit,
    onProfileClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        val content = state.content
        when {
            content != null -> HomeContent(content, onLessonClick, onProfileClick)
            state.error != null -> ErrorContent(state.error.asString(), onRetry = onRetry)
            else -> HomeSkeleton()
        }
    }
}

@Composable
private fun HomeContent(content: HomeContentUi, onLessonClick: (String) -> Unit, onProfileClick: () -> Unit) {
    val colors = RecTheme.colors
    val context = LocalContext.current
    val lockedHint = stringResource(R.string.home_locked_hint)

    Column(modifier = Modifier.fillMaxSize()) {
        HomeHeader(content, onProfileClick)

        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.screen)) {
            Text(
                stringResource(R.string.nav_home),
                style = MaterialTheme.typography.displaySmall,
                color = colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                stringResource(R.string.home_progress_format, content.completedLessons, content.totalLessons),
                style = MaterialTheme.typography.bodySmall,
                color = colors.inkSoft,
            )
        }

        if (content.units.isEmpty()) {
            EmptyState(
                icon = Icons.Filled.DirectionsWalk,
                title = stringResource(R.string.home_empty_title),
                subtitle = stringResource(R.string.home_empty_subtitle),
            )
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = Spacing.screen, vertical = Spacing.lg),
        ) {
            content.units.forEachIndexed { unitIndex, unit ->
                item(key = "unit-$unitIndex-${unit.id}", contentType = "unit") {
                    UnitHeader(unit, Modifier.padding(top = if (unitIndex == 0) 0.dp else 28.dp, bottom = Spacing.lg))
                }
                unit.lessons.forEachIndexed { index, lesson ->
                    if (index > 0) {
                        item(key = "trail-$unitIndex-$index", contentType = "trail") {
                            PathTrail(from = trailOffset(index - 1), to = trailOffset(index))
                        }
                    }
                    item(key = "lesson-$unitIndex-${lesson.id}", contentType = "lesson") {
                        PathNode(
                            title = lesson.title,
                            titleLatin = lesson.titleLatin,
                            meta = "${lesson.titleTranslation} · ${lesson.xpReward} XP",
                            status = lesson.status,
                            isCheckpoint = lesson.isCheckpoint,
                            xOffset = trailOffset(index),
                            onClick = {
                                // Locked lessons don't open; they explain why instead.
                                if (lesson.status == com.rec.app.ui.components.LessonPathStatus.LOCKED) {
                                    Toast.makeText(context, lockedHint, Toast.LENGTH_SHORT).show()
                                } else {
                                    onLessonClick(lesson.id)
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

/** Streak and XP on the left, the avatar on the right, as in the iOS path header. */
@Composable
private fun HomeHeader(content: HomeContentUi, onProfileClick: () -> Unit) {
    val colors = RecTheme.colors
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.screen, vertical = Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            StatPill(
                icon = Icons.Filled.LocalFireDepartment,
                value = content.streakDays.toString(),
                tint = colors.danger,
                contentDescription = stringResource(R.string.cd_streak_format, content.streakDays),
                onClick = onProfileClick,
            )
            StatPill(
                icon = Icons.Filled.Diamond,
                value = content.xp.toString(),
                tint = colors.primary,
                contentDescription = stringResource(R.string.cd_xp_format, content.xp),
                onClick = onProfileClick,
            )
        }
        Spacer(Modifier.weight(1f))
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(
                    Brush.sweepGradient(listOf(colors.accent, colors.danger, colors.primary, colors.accent)),
                    CircleShape,
                )
                .semantics(mergeDescendants = true) { },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                content.displayName.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                style = MaterialTheme.typography.titleMedium,
                color = colors.onPrimary,
            )
        }
    }
}

/** Unit title in Cyrillic with the Latin form in italic, and the translation on the right. */
@Composable
private fun UnitHeader(unit: UnitUi, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
        Column(modifier = Modifier.weight(1f).semantics { heading() }) {
            Text(unit.titleCyrillic, style = MaterialTheme.typography.titleLarge, color = colors.ink)
            if (unit.titleLatin.isNotBlank()) {
                Text(
                    unit.titleLatin,
                    style = MaterialTheme.typography.bodySmall,
                    fontStyle = FontStyle.Italic,
                    color = colors.danger,
                )
            }
        }
        Text(
            unit.titleTranslation,
            style = MaterialTheme.typography.bodySmall,
            color = colors.inkSoft,
            textAlign = TextAlign.End,
            modifier = Modifier.padding(start = Spacing.md),
        )
    }
}

/** First-load placeholder in the shape of the real screen: header, title, a few lesson discs. */
@Composable
private fun HomeSkeleton() {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = Spacing.screen, vertical = Spacing.lg),
        verticalArrangement = Arrangement.spacedBy(Spacing.lg),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            SkeletonBlock(Modifier.width(72.dp).height(30.dp), CircleShape)
            SkeletonBlock(Modifier.width(72.dp).height(30.dp), CircleShape)
        }
        SkeletonBlock(Modifier.fillMaxWidth(0.5f).height(30.dp))
        repeat(4) {
            SkeletonBlock(Modifier.size(64.dp), CircleShape)
        }
    }
}
