package com.rec.app.ui.screens.profile

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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringArrayResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.components.BadgeMedal
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.InitialAvatar
import com.rec.app.ui.components.RecCard
import com.rec.app.ui.components.RecSecondaryButton
import com.rec.app.ui.components.SectionLabel
import com.rec.app.ui.components.SegmentedSwitch
import com.rec.app.ui.components.SkeletonBlock
import com.rec.app.ui.components.StatTile
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.NumberStyle
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

// Language names are shown in their own language, so they are not translated resources.
private val LanguageOptions = listOf("Русский", "English")

@Composable
fun ProfileRoute(viewModel: ProfileViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(viewModel) { viewModel.refresh() }
    ProfileScreen(
        state = state,
        onRetry = viewModel::refresh,
        onLanguage = viewModel::setLanguage,
        onLogout = viewModel::logout,
    )
}

@Composable
fun ProfileScreen(
    state: ProfileUiState,
    onRetry: () -> Unit,
    onLanguage: (english: Boolean) -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        val content = state.content
        when {
            content != null -> ProfileContent(content, onLanguage, onLogout)
            state.error != null -> ErrorContent(state.error.asString(), onRetry = onRetry)
            else -> ProfileSkeleton()
        }
    }
}

@Composable
private fun ProfileContent(content: ProfileContentUi, onLanguage: (Boolean) -> Unit, onLogout: () -> Unit) {
    val colors = RecTheme.colors
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Spacing.screen, vertical = Spacing.lg),
    ) {
        ProfileHero(content)

        Spacer(Modifier.height(Spacing.lg))
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
            StatTile(
                icon = Icons.AutoMirrored.Filled.MenuBook,
                value = content.wordsLearned.toString(),
                label = stringResource(R.string.stat_words),
                tint = colors.primary,
                modifier = Modifier.weight(1f),
            )
            StatTile(
                icon = Icons.Filled.TrackChanges,
                value = "${content.accuracy}%",
                label = stringResource(R.string.stat_accuracy),
                tint = colors.success,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(Spacing.md))
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
            StatTile(
                icon = Icons.Filled.School,
                value = content.lessonsCompleted.toString(),
                label = stringResource(R.string.stat_lessons),
                tint = colors.accent,
                modifier = Modifier.weight(1f),
            )
            StatTile(
                icon = Icons.Filled.CalendarMonth,
                value = content.weeksActive.toString(),
                label = stringResource(R.string.stat_weeks),
                tint = colors.danger,
                modifier = Modifier.weight(1f),
            )
        }

        if (content.week.isNotEmpty()) {
            Spacer(Modifier.height(Spacing.xxl))
            SectionLabel(stringResource(R.string.profile_week))
            WeekStrip(content.week)
        }

        if (content.badges.isNotEmpty()) {
            Spacer(Modifier.height(Spacing.xxl))
            SectionLabel(stringResource(R.string.profile_badges))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                contentPadding = PaddingValues(vertical = Spacing.xs),
            ) {
                itemsIndexed(content.badges, key = { index, badge -> "$index-${badge.titleCyrillic}" }) { _, badge ->
                    Column(
                        modifier = Modifier.width(84.dp).semantics(mergeDescendants = true) { },
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        BadgeMedal()
                        Spacer(Modifier.height(Spacing.sm))
                        Text(
                            badge.titleCyrillic,
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.inkSoft,
                            textAlign = TextAlign.Center,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(Spacing.xxl))
        SectionLabel(stringResource(R.string.profile_language))
        SegmentedSwitch(
            options = LanguageOptions,
            selectedIndex = if (content.english) 1 else 0,
            onSelect = { onLanguage(it == 1) },
        )

        Spacer(Modifier.height(Spacing.xxl))
        RecSecondaryButton(
            text = stringResource(R.string.profile_logout),
            onClick = onLogout,
            contentColor = colors.danger,
            borderColor = colors.danger.copy(alpha = 0.4f),
            leadingIcon = Icons.AutoMirrored.Filled.Logout,
        )
    }
}

@Composable
private fun ProfileHero(content: ProfileContentUi) {
    val colors = RecTheme.colors
    val shape = RoundedCornerShape(Radius.xl)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(Elevation.raised, shape, ambientColor = colors.primary, spotColor = colors.primary)
            .clip(shape)
            .background(colors.heroBrush),
    ) {
        Box(Modifier.matchParentSize()) {
            Box(Modifier.size(160.dp).align(Alignment.TopEnd).offset(x = 50.dp, y = (-60).dp).background(colors.onHero.copy(alpha = 0.10f), CircleShape))
        }
        Row(
            modifier = Modifier.padding(Spacing.xl),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.lg),
        ) {
            InitialAvatar(
                name = content.displayName,
                size = 64.dp,
                brush = SolidColor(colors.onHero.copy(alpha = 0.22f)),
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                Text(
                    content.displayName,
                    style = MaterialTheme.typography.headlineSmall,
                    color = colors.onHero,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.semantics { heading() },
                )
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    HeroChip(
                        icon = Icons.Filled.LocalFireDepartment,
                        text = content.streakDays.toString(),
                        description = stringResource(R.string.cd_streak_format, content.streakDays),
                    )
                    HeroChip(
                        icon = Icons.Filled.Diamond,
                        text = stringResource(R.string.profile_xp_format, content.xp),
                        description = stringResource(R.string.cd_xp_format, content.xp),
                    )
                }
            }
        }
    }
}

/** Translucent chip on the hero gradient, like the glass controls on the reference's blue cards. */
@Composable
private fun HeroChip(icon: ImageVector, text: String, description: String) {
    val colors = RecTheme.colors
    Row(
        modifier = Modifier
            .background(colors.onHero.copy(alpha = 0.20f), PillShape)
            .padding(horizontal = Spacing.md, vertical = Spacing.xs + Spacing.xxs)
            .clearAndSetSemantics { contentDescription = description },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.xs),
    ) {
        Icon(icon, contentDescription = null, tint = colors.onHero, modifier = Modifier.size(16.dp))
        Text(text, style = NumberStyle, color = colors.onHero)
    }
}

/** The week as seven day markers in a white capsule; active days are filled and checked. */
@Composable
private fun WeekStrip(week: List<DayUi>) {
    val colors = RecTheme.colors
    val weekdayLetters = stringArrayResource(R.array.weekday_letters)
    val activeLabel = stringResource(R.string.cd_day_active)
    val inactiveLabel = stringResource(R.string.cd_day_inactive)
    RecCard(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(Radius.xl)) {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.lg),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            week.forEach { day ->
                val letter = weekdayLetters.getOrElse(day.weekday - 1) { "" }
                Column(
                    modifier = Modifier.clearAndSetSemantics {
                        contentDescription = "$letter, ${if (day.active) activeLabel else inactiveLabel}"
                    },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                ) {
                    Text(letter, style = MaterialTheme.typography.labelMedium, color = colors.inkSoft)
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .background(if (day.active) colors.success else colors.surfaceMuted, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (day.active) {
                            Icon(Icons.Filled.Check, contentDescription = null, tint = colors.surface, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileSkeleton() {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = Spacing.screen, vertical = Spacing.lg),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        SkeletonBlock(Modifier.fillMaxWidth().height(104.dp), RoundedCornerShape(Radius.xl))
        repeat(2) {
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                SkeletonBlock(Modifier.weight(1f).height(132.dp), RoundedCornerShape(Radius.lg))
                SkeletonBlock(Modifier.weight(1f).height(132.dp), RoundedCornerShape(Radius.lg))
            }
        }
        SkeletonBlock(Modifier.fillMaxWidth().height(96.dp), RoundedCornerShape(Radius.xl))
    }
}
