package com.rec.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringArrayResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.components.BadgeDiamond
import com.rec.app.ui.components.StatCard
import com.rec.app.ui.components.StreakPill
import com.rec.app.ui.theme.RecTheme

@Composable
fun ProfileScreen(viewModel: ProfileViewModel, onLoggedOut: () -> Unit) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        when (val s = state) {
            is ProfileUiState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                androidx.compose.material3.CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            is ProfileUiState.Error -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                Text(s.message.asString(), color = RecTheme.colors.oxblood)
            }
            is ProfileUiState.Success -> ProfileContent(s, onLogout = { viewModel.logout(); onLoggedOut() })
        }
    }
}

@Composable
private fun ProfileContent(state: ProfileUiState.Success, onLogout: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(
                        Brush.sweepGradient(listOf(RecTheme.colors.ochre, RecTheme.colors.oxblood, RecTheme.colors.indigo, RecTheme.colors.ochre)),
                        CircleShape,
                    ),
            )
            Column {
                Text(state.displayName, style = MaterialTheme.typography.titleMedium, color = RecTheme.colors.ink)
                StreakPill(days = state.streakDays)
            }
        }

        Spacer(Modifier.height(20.dp))
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.height(120.dp),
        ) {
            item { StatCard(value = state.wordsLearned.toString(), label = stringResource(R.string.stat_words)) }
            item { StatCard(value = "${state.accuracy}%", label = stringResource(R.string.stat_accuracy)) }
            item { StatCard(value = state.lessonsCompleted.toString(), label = stringResource(R.string.stat_lessons)) }
            item { StatCard(value = state.weeksActive.toString(), label = stringResource(R.string.stat_weeks)) }
        }

        Spacer(Modifier.height(20.dp))
        val weekdayLetters = stringArrayResource(R.array.weekday_letters)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            state.week.forEach { day ->
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (day.active) RecTheme.colors.good else RecTheme.colors.thread.copy(alpha = 0.35f),
                    modifier = Modifier.size(24.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            weekdayLetters.getOrElse(day.weekday - 1) { "" },
                            style = MaterialTheme.typography.labelSmall,
                            color = if (day.active) androidx.compose.ui.graphics.Color.White else RecTheme.colors.inkSoft,
                        )
                    }
                }
            }
        }

        if (state.badges.isNotEmpty()) {
            Spacer(Modifier.height(24.dp))
            Text(stringResource(R.string.profile_badges), style = MaterialTheme.typography.labelMedium, color = RecTheme.colors.inkSoft)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                state.badges.forEach { badge ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(64.dp)) {
                        BadgeDiamond(modifier = Modifier.width(36.dp))
                        Spacer(Modifier.height(4.dp))
                        Text(
                            badge.titleCyrillic,
                            style = MaterialTheme.typography.labelSmall,
                            color = RecTheme.colors.inkSoft,
                            textAlign = TextAlign.Center,
                            maxLines = 2,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.weight(1f))
        TextButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.profile_logout), color = RecTheme.colors.inkSoft)
        }
    }
}
