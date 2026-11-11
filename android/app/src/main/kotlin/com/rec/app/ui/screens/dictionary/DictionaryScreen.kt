package com.rec.app.ui.screens.dictionary

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material.icons.filled.Style
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.domain.model.AttributeOption
import com.rec.app.domain.model.Word
import com.rec.app.domain.model.WordAttributes
import com.rec.app.ui.common.rememberSerbianSpeaker
import com.rec.app.ui.components.EmptyState
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.components.LocalBottomBarInset
import com.rec.app.ui.components.RecCard
import com.rec.app.ui.components.RecIconButton
import com.rec.app.ui.components.RecSearchField
import com.rec.app.ui.components.RecTopBar
import com.rec.app.ui.components.SectionLabel
import com.rec.app.ui.components.SkeletonBlock
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

/** How close to the end of the list the next page is requested. */
private const val LOAD_MORE_THRESHOLD = 10

@Composable
fun DictionaryRoute(viewModel: DictionaryViewModel, onOpenFlashcards: () -> Unit) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(viewModel) { viewModel.onEnter() }
    DictionaryScreen(
        state = state,
        onSearchChange = viewModel::onSearchChange,
        onSelect = viewModel::select,
        onLoadMore = viewModel::loadMore,
        onRetry = viewModel::retry,
        onOpenFlashcards = onOpenFlashcards,
    )
}

/** Dictionary tab: a searchable word list; tapping a row slides its card in over the list. */
@Composable
fun DictionaryScreen(
    state: DictionaryUiState,
    onSearchChange: (String) -> Unit,
    onSelect: (Word?) -> Unit,
    onLoadMore: () -> Unit,
    onRetry: () -> Unit,
    onOpenFlashcards: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Hoisted above the list/detail switch so the scroll position survives opening a word.
    val listState = rememberLazyListState()
    BackHandler(enabled = state.selected != null) { onSelect(null) }

    AnimatedContent(
        targetState = state.selected,
        contentKey = { it?.id },
        transitionSpec = {
            val opening = targetState != null
            (slideInHorizontally(Motion.slow()) { if (opening) it / 4 else -it / 4 } + fadeIn(Motion.base())) togetherWith
                (slideOutHorizontally(Motion.base()) { if (opening) -it / 4 else it / 4 } + fadeOut(Motion.fast()))
        },
        modifier = modifier.fillMaxSize().background(RecTheme.colors.ground),
        label = "dictionary",
    ) { selected ->
        if (selected == null) {
            WordListPane(state, listState, onSearchChange, onSelect, onLoadMore, onRetry, onOpenFlashcards)
        } else {
            WordDetailPane(
                word = selected,
                script = state.script,
                english = state.english,
                attributes = state.attributes,
                onBack = { onSelect(null) },
            )
        }
    }
}

@Composable
private fun WordListPane(
    state: DictionaryUiState,
    listState: LazyListState,
    onSearchChange: (String) -> Unit,
    onSelect: (Word?) -> Unit,
    onLoadMore: () -> Unit,
    onRetry: () -> Unit,
    onOpenFlashcards: () -> Unit,
) {
    val colors = RecTheme.colors
    Column(modifier = Modifier.fillMaxSize().padding(horizontal = Spacing.screen)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = Spacing.lg, bottom = Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                stringResource(R.string.dict_title),
                style = MaterialTheme.typography.displaySmall,
                color = colors.ink,
                modifier = Modifier.weight(1f).semantics { heading() },
            )
            RecIconButton(
                icon = Icons.Filled.Style,
                contentDescription = stringResource(R.string.dict_flashcards),
                onClick = onOpenFlashcards,
                containerColor = colors.primary,
                tint = colors.onPrimary,
            )
        }
        RecSearchField(
            value = state.search,
            onValueChange = onSearchChange,
            placeholder = stringResource(R.string.dict_search_hint),
        )
        // A thin bar instead of a spinner when a search refreshes a list that is already showing.
        Box(Modifier.fillMaxWidth().height(Spacing.md), contentAlignment = Alignment.Center) {
            androidx.compose.animation.AnimatedVisibility(
                visible = state.loading && state.words.isNotEmpty(),
                enter = fadeIn(Motion.fast()),
                exit = fadeOut(Motion.fast()),
            ) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(0.4f).height(3.dp).clip(PillShape),
                    color = colors.primary,
                    trackColor = colors.primary.copy(alpha = 0.14f),
                )
            }
        }

        when {
            state.error -> ErrorContent(stringResource(R.string.dict_error_load), onRetry = onRetry)
            state.loading && state.words.isEmpty() -> WordListSkeleton()
            state.words.isEmpty() -> EmptyState(
                icon = Icons.Filled.SearchOff,
                title = stringResource(R.string.dict_empty),
                tint = colors.inkSoft,
            )
            else -> WordList(state, listState, onSelect, onLoadMore)
        }
    }
}

@Composable
private fun WordList(
    state: DictionaryUiState,
    listState: LazyListState,
    onSelect: (Word?) -> Unit,
    onLoadMore: () -> Unit,
) {
    // derivedStateOf: scrolling changes the layout info every frame, this flips only at the threshold.
    val nearEnd by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisible >= listState.layoutInfo.totalItemsCount - LOAD_MORE_THRESHOLD
        }
    }
    LaunchedEffect(nearEnd, state.words.size) {
        if (nearEnd) onLoadMore()
    }

    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm + Spacing.xxs),
        contentPadding = PaddingValues(top = Spacing.xs, bottom = Spacing.xxl + LocalBottomBarInset.current),
    ) {
        items(state.words, key = { it.id }, contentType = { "word" }) { word ->
            WordRow(word, state.script, state.english, onClick = { onSelect(word) }, modifier = Modifier.animateItem())
        }
        if (state.loadingMore) {
            item(key = "loading-more", contentType = "loading") {
                Box(Modifier.fillMaxWidth().padding(Spacing.lg), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = RecTheme.colors.primary)
                }
            }
        }
    }
}

@Composable
private fun WordRow(word: Word, script: String, english: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    RecCard(modifier = modifier.fillMaxWidth(), onClick = onClick, shape = RoundedCornerShape(Radius.md)) {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.lg),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    if (script == "latin") word.latin else word.cyrillic,
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (script == "both" && word.latin != word.cyrillic) {
                    Text(
                        word.latin,
                        style = MaterialTheme.typography.bodySmall,
                        fontStyle = FontStyle.Italic,
                        color = colors.primary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Text(
                if (english) word.translationEn else word.translationRu,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.inkSoft,
                textAlign = TextAlign.End,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(start = Spacing.md).widthIn(max = 160.dp),
            )
        }
    }
}

@Composable
private fun WordListSkeleton() {
    Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm + Spacing.xxs), modifier = Modifier.padding(top = Spacing.xs)) {
        repeat(8) {
            SkeletonBlock(Modifier.fillMaxWidth().height(64.dp))
        }
    }
}

/** A single word: both scripts, translation, spoken pronunciation, example and grammar. */
@Composable
private fun WordDetailPane(
    word: Word,
    script: String,
    english: Boolean,
    attributes: WordAttributes?,
    onBack: () -> Unit,
) {
    val colors = RecTheme.colors
    val speak = rememberSerbianSpeaker()
    val translation = if (english) word.translationEn else word.translationRu
    val exampleTranslation = if (english) word.exampleTranslationEn else word.exampleTranslationRu

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen),
    ) {
        RecTopBar(onBack = onBack)

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Radius.xl))
                .background(colors.heroBrush),
        ) {
            Row(modifier = Modifier.padding(Spacing.xxl), verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                    Text(
                        if (script == "latin") word.latin else word.cyrillic,
                        style = MaterialTheme.typography.displayMedium,
                        color = colors.onHero,
                        modifier = Modifier.semantics { heading() },
                    )
                    if (script == "both" && word.latin != word.cyrillic) {
                        Text(
                            word.latin,
                            style = MaterialTheme.typography.titleMedium,
                            fontStyle = FontStyle.Italic,
                            color = colors.onHero.copy(alpha = 0.85f),
                        )
                    }
                    Text(translation, style = MaterialTheme.typography.bodyLarge, color = colors.onHero.copy(alpha = 0.92f))
                }
                // Latin form: device voices read it far more reliably than Cyrillic.
                RecIconButton(
                    icon = Icons.AutoMirrored.Filled.VolumeUp,
                    contentDescription = stringResource(R.string.dict_speak),
                    onClick = { speak(word.latin) },
                    containerColor = colors.onHero.copy(alpha = 0.22f),
                    tint = colors.onHero,
                    elevated = false,
                )
            }
        }

        val example = word.exampleCyrillic
        if (!example.isNullOrBlank()) {
            Spacer(Modifier.height(Spacing.xxl))
            SectionLabel(stringResource(R.string.dict_example))
            RecCard(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(Spacing.lg), verticalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                    Text(example, style = MaterialTheme.typography.bodyLarge, color = colors.ink)
                    if (!exampleTranslation.isNullOrBlank()) {
                        Text(exampleTranslation, style = MaterialTheme.typography.bodyMedium, color = colors.inkSoft)
                    }
                }
            }
        }

        val grammar = listOf(
            R.string.dict_field_part_of_speech to word.partOfSpeech.label(attributes?.partOfSpeech, english),
            R.string.dict_field_gender to word.gender.label(attributes?.gender, english),
            R.string.dict_field_number to word.number.label(attributes?.number, english),
            R.string.dict_field_declension to word.declension.label(attributes?.declension, english),
            R.string.dict_field_conjugation to word.conjugation.label(attributes?.conjugation, english),
        ).mapNotNull { (labelRes, value) -> value?.let { labelRes to it } }

        if (grammar.isNotEmpty()) {
            Spacer(Modifier.height(Spacing.xxl))
            SectionLabel(stringResource(R.string.dict_grammar))
            RecCard(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(horizontal = Spacing.lg)) {
                    grammar.forEachIndexed { index, (labelRes, value) ->
                        if (index > 0) HorizontalDivider(color = colors.outline.copy(alpha = 0.6f))
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.md),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(stringResource(labelRes), style = MaterialTheme.typography.bodyMedium, color = colors.inkSoft)
                            Text(
                                value,
                                style = MaterialTheme.typography.titleSmall,
                                color = colors.ink,
                                textAlign = TextAlign.End,
                                modifier = Modifier.padding(start = Spacing.md),
                            )
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(Spacing.xxl + LocalBottomBarInset.current))
    }
}

/** Resolves a stored grammar code to its label; null when the word has no code, the raw code if unknown. */
private fun String?.label(options: List<AttributeOption>?, english: Boolean): String? {
    val code = this ?: return null
    val match = options?.firstOrNull { it.value == code } ?: return code
    return if (english) match.en else match.ru
}
