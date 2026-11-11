package com.rec.app.ui.screens.vocabulary

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.common.rememberSerbianSpeaker
import com.rec.app.ui.components.BadgeMedal
import com.rec.app.ui.components.CounterPill
import com.rec.app.ui.components.EmptyState
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.LoadingContent
import com.rec.app.ui.components.RecCard
import com.rec.app.ui.components.RecIconButton
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.RecProgressBar
import com.rec.app.ui.components.RecSecondaryButton
import com.rec.app.ui.components.RecTopBar
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

@Composable
fun FlashcardsRoute(viewModel: FlashcardsViewModel, onBack: () -> Unit) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    FlashcardsScreen(state = state, onBack = onBack, onReload = viewModel::load, onReview = viewModel::submitReview)
}

@Composable
fun FlashcardsScreen(
    state: FlashcardsUiState,
    onBack: () -> Unit,
    onReload: () -> Unit,
    onReview: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val speak = rememberSerbianSpeaker()
    Column(
        modifier = modifier.fillMaxSize().background(RecTheme.colors.ground).padding(horizontal = Spacing.screen),
    ) {
        RecTopBar(title = stringResource(R.string.dict_flashcards), onBack = onBack) {
            if (state is FlashcardsUiState.Reviewing) {
                CounterPill("${state.index} / ${state.total}")
            }
        }
        AnimatedContent(
            targetState = state,
            contentKey = { it::class },
            transitionSpec = { fadeIn(Motion.base()) togetherWith fadeOut(Motion.fast()) },
            modifier = Modifier.fillMaxSize(),
            label = "flashcards-state",
        ) { current ->
            when (current) {
                is FlashcardsUiState.Loading -> LoadingContent()
                is FlashcardsUiState.Error -> ErrorContent(current.message.asString(), onRetry = onReload)
                is FlashcardsUiState.Empty -> EmptyState(
                    icon = Icons.Filled.CheckCircle,
                    title = stringResource(R.string.vocab_empty_title),
                    subtitle = stringResource(R.string.vocab_empty_subtitle),
                    tint = RecTheme.colors.success,
                )
                is FlashcardsUiState.Reviewing -> ReviewingContent(current, onReview, speak)
                is FlashcardsUiState.Done -> DoneContent(current, onReload)
            }
        }
    }
}

@Composable
private fun ReviewingContent(state: FlashcardsUiState.Reviewing, onReview: (String) -> Unit, onSpeak: (String) -> Unit) {
    val colors = RecTheme.colors
    Column(modifier = Modifier.fillMaxSize().padding(bottom = Spacing.lg)) {
        RecProgressBar(progress = (state.index - 1).toFloat() / state.total, modifier = Modifier.padding(vertical = Spacing.sm))
        Spacer(Modifier.height(Spacing.md))

        RecCard(
            modifier = Modifier.fillMaxWidth().weight(1f),
            shape = RoundedCornerShape(Radius.xl),
            elevation = Elevation.raised,
        ) {
            // Keyed on the word, so only a real card change slides; the busy state doesn't.
            AnimatedContent(
                targetState = state.card,
                contentKey = { it.wordId },
                transitionSpec = {
                    (slideInHorizontally(Motion.slow()) { it / 3 } + fadeIn(Motion.base())) togetherWith
                        (slideOutHorizontally(Motion.base()) { -it / 3 } + fadeOut(Motion.fast()))
                },
                label = "flashcard",
            ) { card ->
                Column(
                    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(Spacing.xxl),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(Spacing.md, Alignment.CenterVertically),
                ) {
                    Text(
                        card.cyrillic,
                        style = MaterialTheme.typography.displayMedium,
                        color = colors.ink,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.semantics { heading() },
                    )
                    if (card.latin != card.cyrillic) {
                        Text(
                            card.latin,
                            style = MaterialTheme.typography.titleMedium,
                            fontStyle = FontStyle.Italic,
                            color = colors.primary,
                            textAlign = TextAlign.Center,
                        )
                    }
                    RecIconButton(
                        icon = Icons.AutoMirrored.Filled.VolumeUp,
                        contentDescription = stringResource(R.string.cd_pronounce),
                        onClick = { onSpeak(card.latin) },
                        containerColor = colors.primary,
                        tint = colors.onPrimary,
                    )
                    HorizontalDivider(Modifier.fillMaxWidth(0.3f).padding(vertical = Spacing.sm), color = colors.outline)
                    Text(card.translation, style = MaterialTheme.typography.titleLarge, color = colors.ink, textAlign = TextAlign.Center)
                    card.exampleCyrillic?.takeIf { it.isNotBlank() }?.let { example ->
                        Text(
                            stringResource(R.string.example_quote_format, example),
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.inkSoft,
                            textAlign = TextAlign.Center,
                        )
                        card.exampleTranslation?.takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = colors.inkSoft, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(Spacing.lg))
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
            RecSecondaryButton(
                text = stringResource(R.string.vocab_learning),
                onClick = { onReview("learning") },
                modifier = Modifier.weight(1f),
            )
            RecPrimaryButton(
                text = stringResource(R.string.vocab_know),
                onClick = { onReview("know") },
                loading = state.isSubmitting,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun DoneContent(state: FlashcardsUiState.Done, onRestart: () -> Unit) {
    val colors = RecTheme.colors
    Column(modifier = Modifier.fillMaxSize().padding(bottom = Spacing.lg)) {
        Column(
            modifier = Modifier.weight(1f).fillMaxWidth().verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(Spacing.sm, Alignment.CenterVertically),
        ) {
            BadgeMedal(size = 104.dp)
            Spacer(Modifier.height(Spacing.md))
            Text(
                stringResource(R.string.vocab_done_title),
                style = MaterialTheme.typography.displaySmall,
                color = colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                stringResource(R.string.vocab_reviewed_format, state.reviewedCount),
                style = MaterialTheme.typography.bodyLarge,
                color = colors.inkSoft,
                textAlign = TextAlign.Center,
            )
            state.newBadgeTitles.forEach {
                Text(it, style = MaterialTheme.typography.titleMedium, color = colors.accent, textAlign = TextAlign.Center)
            }
        }
        RecPrimaryButton(text = stringResource(R.string.vocab_restart), onClick = onRestart)
    }
}
