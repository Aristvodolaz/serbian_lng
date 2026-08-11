package com.rec.app.ui.screens.home

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.LessonPathStatus
import com.rec.app.ui.components.PathConnector
import com.rec.app.ui.components.PathNode
import com.rec.app.ui.components.StreakPill
import com.rec.app.ui.components.XpPill
import com.rec.app.ui.theme.RecTheme

@Composable
fun HomeScreen(viewModel: HomeViewModel, onLessonClick: (String) -> Unit, onProfileClick: () -> Unit) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        when (val s = state) {
            is HomeUiState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            is HomeUiState.Error -> ErrorContent(s.message.asString(), onRetry = viewModel::load)
            is HomeUiState.Success -> HomeContent(s, onLessonClick, onProfileClick)
        }
    }
}

@Composable
private fun HomeContent(state: HomeUiState.Success, onLessonClick: (String) -> Unit, onProfileClick: () -> Unit) {
    val colors = RecTheme.colors
    val context = LocalContext.current
    val lockedHint = stringResource(R.string.home_locked_hint)

    // The path is the first thing anyone sees after logging in — a soft
    // settle-in reads as considered, a hard pop reads as a layout glitch.
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(360)) + slideInVertically(tween(360)) { it / 12 },
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StreakPill(days = state.streakDays, modifier = Modifier.clickable(onClick = onProfileClick))
                    XpPill(xp = state.xp, modifier = Modifier.clickable(onClick = onProfileClick))
                }
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.sweepGradient(listOf(colors.ochre, colors.oxblood, colors.indigo, colors.ochre)),
                            CircleShape,
                        )
                        .clickable(onClick = onProfileClick),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        state.displayName.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.cream,
                    )
                }
            }

            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp)) {
                Text(stringResource(R.string.nav_home), style = MaterialTheme.typography.displayMedium, color = colors.ink)
                Text(
                    stringResource(R.string.home_progress_format, state.completedLessons, state.totalLessons),
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.inkSoft,
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(28.dp),
            ) {
                items(state.units) { unit ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                        ) {
                            Column {
                                Text(unit.titleCyrillic, style = MaterialTheme.typography.titleLarge, color = colors.ink)
                                Text(
                                    unit.titleLatin,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontStyle = FontStyle.Italic,
                                    color = colors.oxblood,
                                )
                            }
                            Text(
                                unit.titleTranslation,
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.inkSoft,
                                textAlign = TextAlign.End,
                            )
                        }
                        Spacer(Modifier.height(16.dp))

                        unit.lessons.forEachIndexed { index, lesson ->
                            if (index > 0) PathConnector()
                            PathNode(
                                title = lesson.title,
                                titleLatin = lesson.titleLatin,
                                meta = "${lesson.titleTranslation} · ${lesson.xpReward} XP",
                                status = lesson.status,
                                onClick = { onLessonClick(lesson.id) },
                                onLockedTap = { Toast.makeText(context, lockedHint, Toast.LENGTH_SHORT).show() },
                            )
                        }
                    }
                }
            }
        }
    }
}
