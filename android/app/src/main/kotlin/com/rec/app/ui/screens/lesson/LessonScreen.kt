package com.rec.app.ui.screens.lesson

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.common.rememberAnswerHaptics
import com.rec.app.ui.common.rememberCelebrationHaptic
import com.rec.app.ui.common.resolve
import com.rec.app.ui.components.BadgeMedal
import com.rec.app.ui.components.ChoiceCard
import com.rec.app.ui.components.ChoiceState
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.LoadingContent
import com.rec.app.ui.components.RecAlertDialog
import com.rec.app.ui.components.RecCard
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.RecProgressBar
import com.rec.app.ui.components.RecTopBar
import com.rec.app.ui.components.StatPill
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing
import com.rec.app.ui.common.AnswerSound
import com.rec.app.ui.components.CounterPill

private const val GAP = "____"

@Composable
fun LessonRoute(lessonId: String, viewModel: LessonViewModel, onClose: () -> Unit) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(lessonId) { viewModel.load(lessonId) }
    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                is LessonEffect.ShowMessage -> Toast.makeText(context, effect.message.resolve(context), Toast.LENGTH_SHORT).show()
            }
        }
    }

    LessonScreen(
        state = state,
        onClose = onClose,
        onRetry = viewModel::retry,
        onSelectChoice = viewModel::selectChoice,
        onSubmit = viewModel::submitAnswer,
        onNext = viewModel::nextExercise,
    )
}

@Composable
fun LessonScreen(
    state: LessonUiState,
    onClose: () -> Unit,
    onRetry: () -> Unit,
    onSelectChoice: (String) -> Unit,
    onSubmit: () -> Unit,
    onNext: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Keyed on the kind of state, so answering a question doesn't replay the screen transition.
    AnimatedContent(
        targetState = state,
        contentKey = { it::class },
        transitionSpec = { fadeIn(Motion.base()) togetherWith fadeOut(Motion.fast()) },
        modifier = modifier.fillMaxSize().background(RecTheme.colors.ground),
        label = "lesson-state",
    ) { current ->
        when (current) {
            is LessonUiState.Loading -> LoadingContent()
            is LessonUiState.Error -> Column(Modifier.fillMaxSize().padding(horizontal = Spacing.screen)) {
                RecTopBar(onBack = onClose, backIcon = Icons.Filled.Close, backDescription = stringResource(R.string.cd_close))
                ErrorContent(current.message.asString(), onRetry = onRetry)
            }
            is LessonUiState.Locked -> RecAlertDialog(
                title = stringResource(R.string.lesson_locked_title),
                message = stringResource(R.string.lesson_locked_message),
                confirmText = stringResource(R.string.lesson_locked_ok),
                onConfirm = onClose,
                onDismiss = onClose,
            )
            is LessonUiState.InProgress -> ExerciseContent(current, onClose, onSelectChoice, onSubmit, onNext)
            is LessonUiState.Finished -> FinishedContent(current, onClose)
        }
    }
}

@Composable
private fun ExerciseContent(
    state: LessonUiState.InProgress,
    onClose: () -> Unit,
    onSelectChoice: (String) -> Unit,
    onSubmit: () -> Unit,
    onNext: () -> Unit,
) {
    val colors = RecTheme.colors
    var showExitConfirm by rememberSaveable { mutableStateOf(false) }
    val requestClose = { if (state.isUntouched) onClose() else showExitConfirm = true }
    BackHandler(enabled = !state.isUntouched) { showExitConfirm = true }

    // A wrong answer should feel different from a right one, not just look it.
    val playAnswerHaptic = rememberAnswerHaptics()
    LaunchedEffect(state.exercise.id, state.isCorrect) {
        state.isCorrect?.let { correct ->
            playAnswerHaptic(correct)
            AnswerSound.play(correct)
        }
    }

    if (showExitConfirm) {
        RecAlertDialog(
            title = stringResource(R.string.lesson_exit_title),
            message = stringResource(R.string.lesson_exit_message),
            confirmText = stringResource(R.string.lesson_exit_confirm),
            dismissText = stringResource(R.string.lesson_exit_cancel),
            destructive = true,
            onConfirm = {
                showExitConfirm = false
                onClose()
            },
            onDismiss = { showExitConfirm = false },
        )
    }

    Column(modifier = Modifier.fillMaxSize().navigationBarsPadding().padding(horizontal = Spacing.screen)) {
        // Close and a thin progress track, as on the iOS lesson screen.
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            IconButton(onClick = requestClose) {
                Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.cd_close), tint = colors.inkSoft)
            }
            RecProgressBar(
                progress = (state.exerciseNumber - if (state.isAnswered) 0 else 1).toFloat() / state.totalExercises,
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(Spacing.xxl))

        // Only the question and answers slide; the header and the footer stay put.
        AnimatedContent(
            targetState = state.exercise,
            contentKey = { it.id },
            transitionSpec = {
                (slideInHorizontally(Motion.slow()) { it / 3 } + fadeIn(Motion.base())) togetherWith
                    (slideOutHorizontally(Motion.base()) { -it / 3 } + fadeOut(Motion.fast()))
            },
            modifier = Modifier.weight(1f),
            label = "exercise",
        ) { exercise ->
            ExerciseBody(exercise, state, onSelectChoice)
        }

        AnswerFooter(state, onSubmit, onNext)
    }
}

@Composable
private fun ExerciseBody(exercise: ExerciseUi, state: LessonUiState.InProgress, onSelectChoice: (String) -> Unit) {
    val colors = RecTheme.colors
    // The outgoing exercise is still drawn during the slide; it must not pick up the new one's answer state.
    val isCurrent = exercise.id == state.exercise.id

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        Text(
            stringResource(R.string.lesson_prompt_label).uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = colors.inkSoft,
        )
        Text(
            gapHighlighted(exercise.promptCyrillic, colors.accent),
            style = MaterialTheme.typography.displaySmall,
            color = colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        if (exercise.promptLatin.isNotBlank() && exercise.promptLatin != exercise.promptCyrillic) {
            Text(
                gapHighlighted(exercise.promptLatin, colors.accent),
                style = MaterialTheme.typography.bodyLarge,
                fontStyle = FontStyle.Italic,
                color = colors.danger,
            )
        }

        Spacer(Modifier.height(Spacing.lg))
        Column(
            modifier = Modifier.selectableChoices(),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            exercise.choices.forEach { choice ->
                val choiceState = when {
                    !isCurrent -> ChoiceState.NEUTRAL
                    state.correctChoiceId == null -> if (choice.id == state.selectedChoiceId) ChoiceState.SELECTED else ChoiceState.NEUTRAL
                    choice.id == state.correctChoiceId -> ChoiceState.CORRECT
                    choice.id == state.selectedChoiceId -> ChoiceState.WRONG
                    else -> ChoiceState.NEUTRAL
                }
                ChoiceCard(
                    text = choice.text,
                    state = choiceState,
                    onClick = { onSelectChoice(choice.id) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

/** The answer area: the check button until an answer is checked, then a panel with the verdict and Continue. */
@Composable
private fun AnswerFooter(state: LessonUiState.InProgress, onSubmit: () -> Unit, onNext: () -> Unit) {
    val colors = RecTheme.colors
    val correct = state.isCorrect
    if (correct == null) {
        RecPrimaryButton(
            text = stringResource(R.string.lesson_check),
            onClick = onSubmit,
            enabled = state.selectedChoiceId != null,
            loading = state.isSubmitting,
            modifier = Modifier.padding(vertical = Spacing.lg),
        )
    } else {
        val accent = if (correct) colors.success else colors.danger
        val answer = state.exercise.choices.firstOrNull { it.id == state.correctChoiceId }?.text
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = Spacing.lg)
                .background(accent.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                .padding(Spacing.lg)
                .semantics { liveRegion = LiveRegionMode.Polite },
            verticalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                Icon(
                    if (correct) Icons.Filled.CheckCircle else Icons.Filled.Cancel,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(22.dp),
                )
                Text(
                    stringResource(if (correct) R.string.lesson_feedback_correct else R.string.lesson_feedback_wrong),
                    style = MaterialTheme.typography.titleMedium,
                    color = accent,
                )
            }
            if (!correct && answer != null) {
                Text(
                    stringResource(R.string.lesson_correct_answer_format, answer),
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.ink,
                )
            }
            RecPrimaryButton(
                text = stringResource(R.string.lesson_continue),
                onClick = onNext,
                enabled = !state.isSubmitting,
                modifier = Modifier.padding(top = Spacing.xs),
            )
        }
    }
}

@Composable
private fun FinishedContent(state: LessonUiState.Finished, onDone: () -> Unit) {
    val colors = RecTheme.colors
    val celebrate = rememberCelebrationHaptic()
    var revealed by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        revealed = true
        celebrate()
    }

    Column(modifier = Modifier.fillMaxSize().navigationBarsPadding().padding(horizontal = Spacing.xxl)) {
        Column(
            modifier = Modifier.weight(1f).fillMaxWidth().verticalScroll(rememberScrollState()).padding(vertical = Spacing.xxl),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            AnimatedVisibility(
                visible = revealed,
                enter = scaleIn(spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessLow), initialScale = 0.4f) + fadeIn(Motion.base()),
            ) {
                BadgeMedal(size = 120.dp)
            }
            Spacer(Modifier.height(Spacing.xxl))
            Text(
                stringResource(R.string.lesson_finished_title),
                style = MaterialTheme.typography.displaySmall,
                color = colors.ink,
                textAlign = TextAlign.Center,
                modifier = Modifier.semantics { heading() },
            )
            Spacer(Modifier.height(Spacing.sm))
            Text(
                stringResource(R.string.lesson_score_format, state.correctCount, state.totalCount),
                style = MaterialTheme.typography.bodyLarge,
                color = colors.inkSoft,
            )

            Spacer(Modifier.height(Spacing.xl))
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm), verticalAlignment = Alignment.CenterVertically) {
                CounterPill(
                    text = stringResource(R.string.lesson_xp_earned_format, state.xpEarned),
                    containerColor = colors.primary,
                    contentColor = colors.onPrimary,
                )
                StatPill(
                    icon = Icons.Filled.EmojiEvents,
                    value = state.totalXp.toString(),
                    tint = colors.primary,
                    contentDescription = stringResource(R.string.cd_xp_format, state.totalXp),
                )
            }

            if (state.newBadges.isNotEmpty()) {
                Spacer(Modifier.height(Spacing.xxl))
                RecCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(Spacing.lg),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(Spacing.xs),
                    ) {
                        Text(stringResource(R.string.lesson_new_badge), style = MaterialTheme.typography.labelMedium, color = colors.inkSoft)
                        state.newBadges.forEach { badge ->
                            Text(badge.titleCyrillic, style = MaterialTheme.typography.titleMedium, color = colors.ink, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }
        RecPrimaryButton(
            text = stringResource(R.string.lesson_done),
            onClick = onDone,
            modifier = Modifier.padding(bottom = Spacing.lg),
        )
    }
}

/** Renders the `____` gap in accent and bold, since the blank is what the learner is asked to fill. */
private fun gapHighlighted(text: String, accent: Color): AnnotatedString = buildAnnotatedString {
    text.split(GAP).forEachIndexed { index, part ->
        if (index > 0) withStyle(SpanStyle(color = accent, fontWeight = FontWeight.Bold)) { append(GAP) }
        append(part)
    }
}

private fun Modifier.selectableChoices(): Modifier = this.fillMaxWidth()
