package com.rec.app.ui.screens.home

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.rec.app.ui.components.LessonPathStatus
import com.rec.app.ui.components.PathNode
import com.rec.app.ui.components.StreakPill
import com.rec.app.ui.components.XpPill
import com.rec.app.ui.theme.RecTheme

@Composable
fun HomeScreen(viewModel: HomeViewModel, onLessonClick: (String) -> Unit) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        when (val s = state) {
            is HomeUiState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            is HomeUiState.Error -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                Text(s.message, color = RecTheme.colors.oxblood)
            }
            is HomeUiState.Success -> HomeContent(s, onLessonClick)
        }
    }
}

@Composable
private fun HomeContent(state: HomeUiState.Success, onLessonClick: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StreakPill(days = state.streakDays)
            XpPill(xp = state.xp)
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(RecTheme.colors.indigo, CircleShape),
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(28.dp),
        ) {
            items(state.units) { unit ->
                Column {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(unit.titleCyrillic, style = MaterialTheme.typography.titleLarge, color = RecTheme.colors.ink)
                        Text(
                            "  ${unit.titleLatin}",
                            style = MaterialTheme.typography.bodySmall,
                            fontStyle = FontStyle.Italic,
                            color = RecTheme.colors.oxblood,
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    unit.lessons.forEachIndexed { index, lesson ->
                        val align = when (index % 3) {
                            0 -> Alignment.Start
                            1 -> Alignment.CenterHorizontally
                            else -> Alignment.End
                        }
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(top = if (index == 0) 12.dp else 20.dp),
                            horizontalAlignment = align,
                        ) {
                            PathNode(
                                label = lesson.title,
                                status = lesson.status,
                                modifier = Modifier
                                    .clickable(enabled = lesson.status != LessonPathStatus.LOCKED) {
                                        onLessonClick(lesson.id)
                                    },
                            )
                        }
                    }
                }
            }
        }
    }
}
