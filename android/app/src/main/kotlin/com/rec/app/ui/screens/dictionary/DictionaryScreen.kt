package com.rec.app.ui.screens.dictionary

import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Style
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.data.remote.dto.WordAttributeOptionDto
import com.rec.app.data.remote.dto.WordAttributesDto
import com.rec.app.data.remote.dto.WordDto
import com.rec.app.ui.common.rememberSerbianSpeaker
import com.rec.app.ui.components.ErrorContent
import com.rec.app.ui.theme.RecTheme

/** Dictionary tab: searchable word list, tap a row to open its card. The toolbar opens flashcards. */
@Composable
fun DictionaryScreen(viewModel: DictionaryViewModel, onOpenFlashcards: () -> Unit) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    val selected = state.selected
    if (selected != null) {
        BackHandler { viewModel.select(null) }
        WordCard(word = selected, script = state.script, english = state.english, attributes = state.attributes)
        return
    }

    Column(
        modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground).padding(horizontal = 16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Text(
                stringResource(R.string.dict_title),
                style = MaterialTheme.typography.titleLarge,
                color = RecTheme.colors.ink,
                modifier = Modifier.weight(1f),
            )
            IconButton(onClick = onOpenFlashcards) {
                Icon(Icons.Filled.Style, contentDescription = stringResource(R.string.dict_flashcards), tint = RecTheme.colors.indigo)
            }
        }
        OutlinedTextField(
            value = state.search,
            onValueChange = viewModel::onSearchChange,
            singleLine = true,
            placeholder = { Text(stringResource(R.string.dict_search_hint)) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))

        when {
            state.error -> ErrorContent(stringResource(R.string.dict_error_load), onRetry = viewModel::load)
            state.loading && state.words.isEmpty() -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
            state.words.isEmpty() -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                Text(stringResource(R.string.dict_empty), color = RecTheme.colors.inkSoft, textAlign = TextAlign.Center)
            }
            else -> WordList(state.words, state.script, state.english, onSelect = viewModel::select, onNearEnd = viewModel::loadMore, loadingMore = state.loadingMore)
        }
    }
}

@Composable
private fun WordList(
    words: List<WordDto>,
    script: String,
    english: Boolean,
    onSelect: (WordDto) -> Unit,
    onNearEnd: () -> Unit,
    loadingMore: Boolean,
) {
    val listState = rememberLazyListState()
    LaunchedEffect(listState, words.size) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index }
            .collect { last -> if (last != null && last >= words.size - 10) onNearEnd() }
    }
    LazyColumn(state = listState, modifier = Modifier.fillMaxSize()) {
        items(words, key = { it.id }) { word ->
            Row(
                modifier = Modifier.fillMaxWidth().clickable { onSelect(word) }.padding(vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        if (script == "latin") word.latin else word.cyrillic,
                        style = MaterialTheme.typography.titleMedium,
                        color = RecTheme.colors.ink,
                    )
                    if (script == "both" && word.latin != word.cyrillic) {
                        Text(word.latin, style = MaterialTheme.typography.bodySmall, fontStyle = FontStyle.Italic, color = RecTheme.colors.oxblood)
                    }
                }
                Text(
                    if (english) word.translationEn else word.translationRu,
                    style = MaterialTheme.typography.bodyMedium,
                    color = RecTheme.colors.inkSoft,
                    textAlign = TextAlign.End,
                )
            }
            Box(Modifier.fillMaxWidth().height(1.dp).background(RecTheme.colors.thread.copy(alpha = 0.3f)))
        }
        if (loadingMore) {
            item {
                Box(Modifier.fillMaxWidth().padding(16.dp), Alignment.Center) {
                    CircularProgressIndicator(color = RecTheme.colors.indigo)
                }
            }
        }
    }
}

/** A single word: both scripts, translation, spoken pronunciation, example and grammar. */
@Composable
private fun WordCard(word: WordDto, script: String, english: Boolean, attributes: WordAttributesDto?) {
    val speak = rememberSerbianSpeaker()
    val translation = if (english) word.translationEn else word.translationRu
    val exampleTranslation = if (english) word.exampleTranslationEn else word.exampleTranslationRu

    Column(
        modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground).verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            if (script == "latin") word.latin else word.cyrillic,
            style = MaterialTheme.typography.displaySmall,
            color = RecTheme.colors.ink,
        )
        if (script == "both" && word.latin != word.cyrillic) {
            Text(word.latin, style = MaterialTheme.typography.titleMedium, fontStyle = FontStyle.Italic, color = RecTheme.colors.oxblood)
        }
        Text(translation, style = MaterialTheme.typography.bodyLarge, color = RecTheme.colors.inkSoft)
        IconButton(onClick = { speak(word.latin) }) {
            Icon(
                Icons.AutoMirrored.Filled.VolumeUp,
                contentDescription = stringResource(R.string.dict_speak),
                tint = RecTheme.colors.indigo,
                modifier = Modifier.size(28.dp),
            )
        }

        val example = word.exampleCyrillic
        if (!example.isNullOrBlank()) {
            Surface(shape = RoundedCornerShape(14.dp), color = RecTheme.colors.surface2, modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(example, style = MaterialTheme.typography.bodyLarge, color = RecTheme.colors.ink)
                    exampleTranslation?.let {
                        Text(it, style = MaterialTheme.typography.bodySmall, color = RecTheme.colors.inkSoft)
                    }
                }
            }
        }

        val rows = listOf(
            R.string.dict_field_part_of_speech to word.partOfSpeech.label(attributes?.partOfSpeech, english),
            R.string.dict_field_gender to word.gender.label(attributes?.gender, english),
            R.string.dict_field_number to word.number.label(attributes?.number, english),
            R.string.dict_field_declension to word.declension.label(attributes?.declension, english),
            R.string.dict_field_conjugation to word.conjugation.label(attributes?.conjugation, english),
        ).filter { it.second != null }

        if (rows.isNotEmpty()) {
            Surface(shape = RoundedCornerShape(14.dp), color = RecTheme.colors.surface2, modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    rows.forEach { (labelRes, value) ->
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(stringResource(labelRes), style = MaterialTheme.typography.labelMedium, color = RecTheme.colors.inkSoft)
                            Text(value.orEmpty(), style = MaterialTheme.typography.titleSmall, color = RecTheme.colors.ink, textAlign = TextAlign.End)
                        }
                    }
                }
            }
        }
    }
}

/** Resolves a stored grammar code to its label; null when the word has no code, the raw code if unknown. */
private fun String?.label(options: List<WordAttributeOptionDto>?, english: Boolean): String? {
    val code = this ?: return null
    val match = options?.firstOrNull { it.value == code } ?: return code
    return if (english) match.en else match.ru
}
