package com.rec.app.ui.screens.vocabulary

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.common.asString
import com.rec.app.ui.common.rememberSerbianSpeaker
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.RecGhostButton
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.theme.RecTheme

@Composable
fun VocabularyScreen(viewModel: VocabularyViewModel) {
    val state by viewModel.state.collectAsState()
    val speak = rememberSerbianSpeaker()
    LaunchedEffect(Unit) { viewModel.load() }

    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        when (val s = state) {
            is FlashcardsUiState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            is FlashcardsUiState.Error -> ErrorContent(s.message.asString(), onRetry = viewModel::load)
            is FlashcardsUiState.Empty -> EmptyContent()
            is FlashcardsUiState.Reviewing -> ReviewingContent(s, viewModel, onSpeak = speak)
            is FlashcardsUiState.Done -> DoneContent(s, onRestart = viewModel::load)
        }
    }
}

@Composable
private fun EmptyContent() {
    Column(Modifier.fillMaxSize().padding(24.dp), Arrangement.Center, Alignment.CenterHorizontally) {
        Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = RecTheme.colors.good, modifier = Modifier.size(48.dp))
        Spacer(Modifier.height(12.dp))
        Text(stringResource(R.string.vocab_empty_title), style = MaterialTheme.typography.titleLarge, color = RecTheme.colors.ink, textAlign = TextAlign.Center)
        Text(stringResource(R.string.vocab_empty_subtitle), style = MaterialTheme.typography.bodyMedium, color = RecTheme.colors.inkSoft, textAlign = TextAlign.Center)
    }
}

@Composable
private fun ReviewingContent(state: FlashcardsUiState.Reviewing, viewModel: VocabularyViewModel, onSpeak: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        Text(
            stringResource(R.string.vocab_progress_format, state.index, state.total),
            style = MaterialTheme.typography.labelMedium,
            color = RecTheme.colors.inkSoft,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(16.dp))

        Surface(
            modifier = Modifier.fillMaxWidth().weight(1f),
            shape = RoundedCornerShape(18.dp),
            color = RecTheme.colors.surface2,
            border = BorderStroke(1.5.dp, RecTheme.colors.thread.copy(alpha = 0.5f)),
        ) {
            // Keyed on wordId, not the whole state, so only an actual card
            // change slides — isSubmitting flipping true/false stays static.
            AnimatedContent(
                targetState = state.card,
                transitionSpec = {
                    (slideInHorizontally(tween(260)) { it / 3 } + fadeIn(tween(260))) togetherWith
                        (slideOutHorizontally(tween(200)) { -it / 3 } + fadeOut(tween(160)))
                },
                label = "flashcard",
            ) { card ->
                Column(
                    modifier = Modifier.fillMaxSize().padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(card.cyrillic, style = MaterialTheme.typography.displayLarge, color = RecTheme.colors.ink)
                    Text(card.latin, style = MaterialTheme.typography.titleMedium, fontStyle = FontStyle.Italic, color = RecTheme.colors.oxblood)

                    Spacer(Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(RecTheme.colors.indigo, CircleShape)
                            .clickable { onSpeak(card.latin) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = stringResource(R.string.cd_pronounce), tint = RecTheme.colors.cream, modifier = Modifier.size(18.dp))
                    }

                    Spacer(Modifier.height(14.dp))
                    Text(card.translation, style = MaterialTheme.typography.bodyLarge, color = RecTheme.colors.inkSoft)

                    if (card.exampleCyrillic != null) {
                        Spacer(Modifier.height(14.dp))
                        Text(
                            stringResource(R.string.example_quote_format, card.exampleCyrillic ?: ""),
                            style = MaterialTheme.typography.bodySmall,
                            color = RecTheme.colors.inkSoft,
                            textAlign = TextAlign.Center,
                        )
                        card.exampleTranslation?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = RecTheme.colors.inkSoft, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        if (state.isSubmitting) {
            Box(Modifier.fillMaxWidth(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                RecGhostButton(text = stringResource(R.string.vocab_learning), onClick = { viewModel.submitReview("learning") }, modifier = Modifier.weight(1f))
                RecPrimaryButton(text = stringResource(R.string.vocab_know), onClick = { viewModel.submitReview("know") }, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun DoneContent(state: FlashcardsUiState.Done, onRestart: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(24.dp), Arrangement.Center, Alignment.CenterHorizontally) {
        Text(stringResource(R.string.vocab_done_title), style = MaterialTheme.typography.headlineSmall, color = RecTheme.colors.ink)
        Text(stringResource(R.string.vocab_reviewed_format, state.reviewedCount), style = MaterialTheme.typography.bodyMedium, color = RecTheme.colors.inkSoft)
        if (state.newBadgeTitles.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            state.newBadgeTitles.forEach {
                Text(it, style = MaterialTheme.typography.titleMedium, color = RecTheme.colors.oxblood)
            }
        }
        Spacer(Modifier.height(20.dp))
        RecPrimaryButton(text = stringResource(R.string.vocab_restart), onClick = onRestart)
    }
}
