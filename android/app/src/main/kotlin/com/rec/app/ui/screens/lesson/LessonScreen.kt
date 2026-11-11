package com.rec.app.ui.screens.lesson

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Icon
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.AnswerSound
import com.rec.app.ui.common.asString
import com.rec.app.ui.common.rememberAnswerHaptics
import com.rec.app.ui.common.rememberCelebrationHaptic
import com.rec.app.ui.common.resolve
import com.rec.app.ui.components.BadgeMedal
import com.rec.app.ui.components.ChoiceCard
import com.rec.app.ui.components.ChoiceState
import com.rec.app.ui.components.CounterPill
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.LoadingContent
import com.rec.app.ui.components.RecAlertDialog
import com.rec.app.ui.components.RecCard
import com.rec.app.ui.components.RecIconButton
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.RecProgressBar
import com.rec.app.ui.components.RecTopBar
import com.rec.app.ui.components.StatPill
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

/** Answers at or under this length sit two to a row, like the reference's answer grid. */
private const val SHORT_CHOICE_LENGTH = 16

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

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = Spacing.screen)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            RecIconButton(icon = Icons.Filled.Close, contentDescription = stringResource(R.string.cd_close), onClick = requestClose)
            RecProgressBar(
                progress = (state.exerciseNumber - if (state.isAnswered) 0 else 1).toFloat() / state.totalExercises,
                modifier = Modifier.weight(1f),
            )
            CounterPill("${state.exerciseNumber} / ${state.totalExercises}")
        }

        // Only the question and answers slide; the header and the button stay put,
        // so the chrome reads as stable while the content under it advances.
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

        AnswerFeedback(isCorrect = state.isCorrect)
        RecPrimaryButton(
            text = stringResource(if (state.isAnswered) R.string.lesson_continue else R.string.lesson_check),
            onClick = if (state.isAnswered) onNext else onSubmit,
            enabled = state.isAnswered || state.selectedChoiceId != null,
            loading = state.isSubmitting,
            modifier = Modifier.padding(top = Spacing.md, bottom = Spacing.lg),
        )
    }
}

@Composable
private fun ExerciseBody(exercise: ExerciseUi, state: LessonUiState.InProgress, onSelectChoice: (String) -> Unit) {
    val colors = RecTheme.colors
    // The outgoing exercise is still drawn during the slide; it must not pick up the new one's answer state.
    val isCurrent = exercise.id == state.exercise.id

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical = Spacing.md),
        verticalArrangement = Arrangement.spacedBy(Spacing.xl),
    ) {
        RecCard(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(Radius.xl), elevation = Elevation.raised) {
            Column(
                modifier = Modifier.padding(horizontal = Spacing.xl, vertical = Spacing.xxxl),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(Spacing.sm),
            ) {
                Text(
                    stringResource(R.string.lesson_prompt_label),
                    style = MaterialTheme.typography.labelMedium,
                    color = colors.inkSoft,
                    textAlign = TextAlign.Center,
                )
                Text(
                    exercise.promptCyrillic,
                    style = MaterialTheme.typography.displaySmall,
                    color = colors.ink,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.semantics { heading() },
                )
                if (exercise.promptLatin.isNotBlank() && exercise.promptLatin != exercise.promptCyrillic) {
                    Text(
                        exercise.promptLatin,
                        style = MaterialTheme.typography.bodyLarge,
                        fontStyle = FontStyle.Italic,
                        color = colors.primary,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }

        val columns = if (exercise.choices.size % 2 == 0 && exercise.choices.all { it.text.length <= SHORT_CHOICE_LENGTH }) 2 else 1
        Column(
            modifier = Modifier.selectableGroup(),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            exercise.choices.chunked(columns).forEach { rowChoices ->
                Row(
                    modifier = Modifier.height(IntrinsicSize.Min),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                ) {
                    rowChoices.forEach { choice ->
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
                            modifier = Modifier.weight(1f).fillMaxHeight(),
                        )
                    }
                }
            }
        }
    }
}

/** Slides up once the answer is checked and says, in words and with an icon, how it went. */
@Composable
private fun AnswerFeedback(isCorrect: Boolean?) {
    val colors = RecTheme.colors
    // Holds the last verdict so the banner keeps its text while it animates out.
    // A plain holder, not snapshot state: it is only ever written alongside isCorrect.
    val verdictHolder = remember { booleanArrayOf(true) }
    if (isCorrect != null) verdictHolder[0] = isCorrect
    val lastVerdict = verdictHolder[0]
    val tint by animateColorAsState(if (lastVerdict) colors.success else colors.danger, Motion.fast(), label = "feedback-tint")

    AnimatedVisibility(
        visible = isCorrect != null,
        enter = expandVertically(Motion.base()) + slideInVertically(Motion.base()) { it / 2 } + fadeIn(Motion.base()),
        exit = shrinkVertically(Motion.fast()) + fadeOut(Motion.fast()),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(tint.copy(alpha = 0.12f), RoundedCornerShape(Radius.md))
                .padding(horizontal = Spacing.lg, vertical = Spacing.md)
                .semantics { liveRegion = LiveRegionMode.Polite },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            Icon(
                if (lastVerdict) Icons.Filled.CheckCircle else Icons.Filled.Cancel,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(24.dp),
            )
            Text(
                stringResource(if (lastVerdict) R.string.lesson_feedback_correct else R.string.lesson_feedback_wrong),
                style = MaterialTheme.typography.titleMedium,
                color = tint,
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

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = Spacing.xxl)) {
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
                icon = Icons.Filled.Diamond,
                value = state.totalXp.toString(),
                tint = colors.primary,
                contentDescription = stringResource(R.string.cd_xp_format, state.totalXp),
            )
            StatPill(
                icon = Icons.Filled.LocalFireDepartment,
                value = state.streakDays.toString(),
                tint = colors.accent,
                contentDescription = stringResource(R.string.cd_streak_format, state.streakDays),
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
