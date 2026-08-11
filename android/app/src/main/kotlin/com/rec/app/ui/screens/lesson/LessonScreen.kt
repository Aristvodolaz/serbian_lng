package com.rec.app.ui.screens.lesson

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.common.rememberAnswerHaptics
import com.rec.app.ui.common.rememberCelebrationHaptic
import com.rec.app.ui.components.ChoiceCard
import com.rec.app.ui.components.ChoiceState
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.RecProgressBar
import com.rec.app.ui.components.StreakPill
import com.rec.app.ui.components.XpPill
import com.rec.app.ui.theme.RecTheme

@Composable
fun LessonScreen(
    lessonId: String,
    viewModel: LessonViewModel,
    onClose: () -> Unit,
    onFinished: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(lessonId) { viewModel.load(lessonId) }

    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        when (val s = state) {
            is LessonUiState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            is LessonUiState.Error -> ErrorContent(s.message.asString(), onRetry = { viewModel.load(lessonId) })
            is LessonUiState.InProgress -> ExerciseContent(s, viewModel, onClose)
            is LessonUiState.Finished -> FinishedContent(s, onFinished)
        }
    }
}

@Composable
private fun ExerciseContent(state: LessonUiState.InProgress, viewModel: LessonViewModel, onClose: () -> Unit) {
    var showExitConfirm by remember { mutableStateOf(false) }
    val playAnswerHaptic = rememberAnswerHaptics()

    // Fires exactly once per reveal, right as correctChoiceId first appears —
    // a wrong answer should feel different from a right one, not just look it.
    LaunchedEffect(state.correctChoiceId) {
        val correct = state.isCorrect
        if (state.correctChoiceId != null && correct != null) playAnswerHaptic(correct)
    }

    if (showExitConfirm) {
        AlertDialog(
            onDismissRequest = { showExitConfirm = false },
            title = { Text(stringResource(R.string.lesson_exit_title)) },
            text = { Text(stringResource(R.string.lesson_exit_message)) },
            confirmButton = {
                TextButton(onClick = onClose) {
                    Text(stringResource(R.string.lesson_exit_confirm), color = RecTheme.colors.oxblood)
                }
            },
            dismissButton = {
                TextButton(onClick = { showExitConfirm = false }) {
                    Text(stringResource(R.string.lesson_exit_cancel))
                }
            },
        )
    }

    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            IconButton(onClick = {
                // No point confirming if nothing would be lost yet.
                val untouched = state.exerciseNumber == 1 && state.selectedChoiceId == null && state.correctChoiceId == null
                if (untouched) onClose() else showExitConfirm = true
            }) {
                Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.cd_close), tint = RecTheme.colors.inkSoft)
            }
            RecProgressBar(
                progress = state.exerciseNumber.toFloat() / state.totalExercises,
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(20.dp))

        // Only the question+choices slide between exercises — header and the
        // check/continue button below stay put, so the chrome reads as
        // stable while the content underneath it visibly advances.
        AnimatedContent(
            targetState = state.exercise.id,
            transitionSpec = {
                (slideInHorizontally(tween(280)) { it / 3 } + fadeIn(tween(280))) togetherWith
                    (slideOutHorizontally(tween(200)) { -it / 3 } + fadeOut(tween(160)))
            },
            modifier = Modifier.weight(1f),
            label = "exercise",
        ) {
            Column {
                Text(stringResource(R.string.lesson_prompt_label), style = MaterialTheme.typography.labelMedium, color = RecTheme.colors.inkSoft)
                Text(state.exercise.promptCyrillic, style = MaterialTheme.typography.displayMedium, color = RecTheme.colors.ink)
                Text(
                    state.exercise.promptLatin,
                    style = MaterialTheme.typography.bodyMedium,
                    fontStyle = FontStyle.Italic,
                    color = RecTheme.colors.oxblood,
                )

                Spacer(Modifier.height(24.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    state.exercise.choices.forEach { choice ->
                        val choiceState = when {
                            state.correctChoiceId == null -> if (choice.id == state.selectedChoiceId) ChoiceState.SELECTED else ChoiceState.NEUTRAL
                            choice.id == state.correctChoiceId -> ChoiceState.CORRECT
                            choice.id == state.selectedChoiceId -> ChoiceState.WRONG
                            else -> ChoiceState.NEUTRAL
                        }
                        ChoiceCard(
                            text = choice.text,
                            state = choiceState,
                            onClick = { viewModel.selectChoice(choice.id) },
                        )
                    }
                }
            }
        }

        if (state.isSubmitting) {
            Box(Modifier.fillMaxWidth(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
        } else if (state.correctChoiceId == null) {
            RecPrimaryButton(
                text = stringResource(R.string.lesson_check),
                enabled = state.selectedChoiceId != null,
                onClick = viewModel::submitAnswer,
            )
        } else {
            RecPrimaryButton(text = stringResource(R.string.lesson_continue), onClick = viewModel::nextExercise)
        }
    }
}

@Composable
private fun FinishedContent(state: LessonUiState.Finished, onFinished: () -> Unit) {
    val celebrate = rememberCelebrationHaptic()
    LaunchedEffect(Unit) { celebrate() }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        AnimatedVisibility(visible = true, enter = scaleIn(tween(420)) + fadeIn(tween(420))) {
            Icon(
                Icons.Filled.EmojiEvents,
                contentDescription = null,
                tint = RecTheme.colors.ochre,
                modifier = Modifier.size(56.dp),
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(stringResource(R.string.lesson_finished_title), style = MaterialTheme.typography.headlineSmall, color = RecTheme.colors.ink)
        Text(
            stringResource(R.string.lesson_score_format, state.correctCount, state.totalCount),
            style = MaterialTheme.typography.bodyMedium,
            color = RecTheme.colors.inkSoft,
        )

        Spacer(Modifier.height(20.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            XpPill(xp = state.totalXp)
            StreakPill(days = state.streakDays)
        }

        if (state.newBadges.isNotEmpty()) {
            AnimatedVisibility(visible = true, enter = expandVertically(tween(320)) + fadeIn(tween(400, delayMillis = 150))) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Spacer(Modifier.height(20.dp))
                    Text(stringResource(R.string.lesson_new_badge), style = MaterialTheme.typography.labelMedium, color = RecTheme.colors.inkSoft)
                    state.newBadges.forEach {
                        Text(it.titleCyrillic, style = MaterialTheme.typography.titleMedium, color = RecTheme.colors.oxblood)
                    }
                }
            }
        }

        Spacer(Modifier.height(32.dp))
        RecPrimaryButton(text = stringResource(R.string.lesson_done), onClick = onFinished)
    }
}
