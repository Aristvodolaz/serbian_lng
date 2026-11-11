package com.rec.app.ui.screens.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.InitialAvatar
import com.rec.app.ui.components.LessonRow
import com.rec.app.ui.components.LocalBottomBarInset
import com.rec.app.ui.components.ProgressRing
import com.rec.app.ui.components.RecPillButton
import com.rec.app.ui.components.SkeletonBlock
import com.rec.app.ui.components.StatPill
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.NumberStyle
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.Radius
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
    val colors = RecTheme.colors
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.ground)
            .background(Brush.verticalGradient(listOf(colors.primarySoft.copy(alpha = 0.20f), colors.ground), endY = 900f)),
    ) {
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
    val context = LocalContext.current
    val lockedHint = stringResource(R.string.home_locked_hint)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = Spacing.screen,
            end = Spacing.screen,
            top = Spacing.lg,
            bottom = Spacing.lg + LocalBottomBarInset.current,
        ),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        item(key = "header", contentType = "header") {
            HomeHeader(content, onProfileClick)
        }
        item(key = "hero", contentType = "hero") {
            ContinueCard(content, onLessonClick, Modifier.padding(vertical = Spacing.sm))
        }
        content.units.forEachIndexed { index, unit ->
            item(key = "unit-$index-${unit.id}", contentType = "unit") {
                UnitHeader(unit, Modifier.padding(top = Spacing.md))
            }
            items(unit.lessons, key = { "lesson-$index-${it.id}" }, contentType = { "lesson" }) { lesson ->
                LessonRow(
                    title = lesson.title,
                    titleLatin = lesson.titleLatin,
                    meta = "${lesson.titleTranslation} · ${lesson.xpReward} XP",
                    status = lesson.status,
                    onClick = { onLessonClick(lesson.id) },
                    onLockedTap = { Toast.makeText(context, lockedHint, Toast.LENGTH_SHORT).show() },
                    modifier = Modifier.animateItem(),
                )
            }
        }
    }
}

@Composable
private fun HomeHeader(content: HomeContentUi, onProfileClick: () -> Unit) {
    val colors = RecTheme.colors
    val profileLabel = stringResource(R.string.nav_profile)
    Row(verticalAlignment = Alignment.CenterVertically) {
        InitialAvatar(
            name = content.displayName,
            modifier = Modifier
                .clip(CircleShape)
                .clickable(onClickLabel = profileLabel, role = Role.Button, onClick = onProfileClick),
        )
        Column(modifier = Modifier.weight(1f).padding(horizontal = Spacing.md)) {
            Text(
                stringResource(R.string.home_greeting, content.displayName),
                style = MaterialTheme.typography.titleLarge,
                color = colors.ink,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                stringResource(R.string.home_progress_format, content.completedLessons, content.totalLessons),
                style = MaterialTheme.typography.bodyMedium,
                color = colors.inkSoft,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            StatPill(
                icon = Icons.Filled.LocalFireDepartment,
                value = content.streakDays.toString(),
                tint = colors.accent,
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
    }
}

/** The blue hero: what to do next, overall progress as a ring, and one dark call to action. */
@Composable
private fun ContinueCard(content: HomeContentUi, onLessonClick: (String) -> Unit, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    val shape = RoundedCornerShape(Radius.xl)
    val next = content.nextLesson
    // An empty path is "nothing here yet", not "everything done".
    val isEmpty = content.totalLessons == 0
    val progress = if (content.totalLessons == 0) 0f else content.completedLessons.toFloat() / content.totalLessons

    Box(
        modifier = modifier
            .fillMaxWidth()
            .shadow(Elevation.raised, shape, ambientColor = colors.primary, spotColor = colors.primary)
            .clip(shape)
            .background(colors.heroBrush),
    ) {
        // Soft circles give the flat gradient some depth, like the reference's hero art.
        // matchParentSize keeps the decoration from stretching the card.
        Box(Modifier.matchParentSize()) {
            Box(Modifier.size(180.dp).align(Alignment.TopEnd).offset(x = 60.dp, y = (-70).dp).background(colors.onHero.copy(alpha = 0.10f), CircleShape))
            Box(Modifier.size(120.dp).align(Alignment.BottomStart).offset(x = (-40).dp, y = 50.dp).background(colors.onHero.copy(alpha = 0.08f), CircleShape))
        }

        Row(modifier = Modifier.padding(Spacing.xl), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                if (!isEmpty) {
                    Text(
                        if (next != null) {
                            stringResource(R.string.home_continue_label)
                        } else {
                            stringResource(R.string.home_progress_format, content.completedLessons, content.totalLessons)
                        },
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.onHero.copy(alpha = 0.85f),
                    )
                    Spacer(Modifier.height(Spacing.xs))
                }
                Text(
                    next?.title ?: stringResource(if (isEmpty) R.string.home_empty_title else R.string.home_all_done_title),
                    style = MaterialTheme.typography.headlineSmall,
                    color = colors.onHero,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    next?.let { "${it.titleLatin} · ${it.titleTranslation}" }
                        ?: stringResource(if (isEmpty) R.string.home_empty_subtitle else R.string.home_all_done_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    fontStyle = if (next != null) FontStyle.Italic else FontStyle.Normal,
                    color = colors.onHero.copy(alpha = 0.85f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (next != null) {
                    Spacer(Modifier.height(Spacing.lg))
                    RecPillButton(
                        text = stringResource(R.string.home_continue_cta),
                        onClick = { onLessonClick(next.id) },
                        trailingIcon = Icons.AutoMirrored.Filled.ArrowForward,
                    )
                }
            }
            if (!isEmpty) {
                Spacer(Modifier.width(Spacing.lg))
                ProgressRing(progress = progress) {
                    Text(
                        "${content.completedLessons}/${content.totalLessons}",
                        style = NumberStyle,
                        color = colors.onHero,
                    )
                }
            }
        }
    }
}

@Composable
private fun UnitHeader(unit: UnitUi, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
        Column(modifier = Modifier.weight(1f).semantics(mergeDescendants = true) { heading() }) {
            Text(unit.titleCyrillic, style = MaterialTheme.typography.titleLarge, color = colors.ink)
            Text(unit.titleLatin, style = MaterialTheme.typography.bodyMedium, fontStyle = FontStyle.Italic, color = colors.primary)
        }
        Text(
            unit.titleTranslation,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.inkSoft,
            textAlign = TextAlign.End,
            modifier = Modifier.padding(start = Spacing.md),
        )
    }
}

/** First-load placeholder in the shape of the real screen: header, hero, a few rows. */
@Composable
private fun HomeSkeleton() {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = Spacing.screen, vertical = Spacing.lg),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
            SkeletonBlock(Modifier.size(48.dp), CircleShape)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                SkeletonBlock(Modifier.fillMaxWidth(0.6f).height(18.dp))
                SkeletonBlock(Modifier.fillMaxWidth(0.4f).height(14.dp))
            }
        }
        SkeletonBlock(Modifier.fillMaxWidth().height(176.dp).padding(vertical = Spacing.sm), RoundedCornerShape(Radius.xl))
        SkeletonBlock(Modifier.fillMaxWidth(0.5f).height(22.dp))
        repeat(5) {
            SkeletonBlock(Modifier.fillMaxWidth().height(68.dp), PillShape)
        }
    }
}
