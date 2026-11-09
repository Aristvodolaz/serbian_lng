package com.rec.app.ui.screens.dictionary

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.domain.model.Word
import com.rec.app.domain.model.WordAttributes
import com.rec.app.domain.repository.UserRepository
import com.rec.app.domain.repository.VocabularyRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DictionaryUiState(
    val words: List<Word> = emptyList(),
    val total: Int = 0,
    val search: String = "",
    val loading: Boolean = true,
    val loadingMore: Boolean = false,
    val error: Boolean = false,
    val attributes: WordAttributes? = null,
    /** Word shown in the card; null means the list. */
    val selected: Word? = null,
    /** Script ("cyrillic" | "latin" | "both") and interface language from the profile. */
    val script: String = "both",
    val english: Boolean = false,
)

/**
 * Backs the dictionary tab, mirroring iOS `WordsViewModel`: a server-side search
 * with a debounce, offset pagination, and the grammar dictionaries resolved once.
 */
class DictionaryViewModel(
    private val vocabularyRepository: VocabularyRepository,
    private val userRepository: UserRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(DictionaryUiState())
    val state: StateFlow<DictionaryUiState> = _state.asStateFlow()

    private var searchJob: Job? = null
    /** Bumped on every replacing fetch, so a stale response can't overwrite a newer search. */
    private var generation = 0

    fun load() {
        viewModelScope.launch {
            userRepository.getMe().onSuccess { user ->
                _state.update {
                    it.copy(script = user.scriptPreference, english = user.languagePreference == "en")
                }
            }
            fetch(replace = true)
        }
    }

    fun onSearchChange(text: String) {
        _state.update { it.copy(search = text) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300)
            fetch(replace = true)
        }
    }

    fun loadMore() {
        val s = _state.value
        if (s.loading || s.loadingMore || s.words.size >= s.total) return
        viewModelScope.launch { fetch(replace = false) }
    }

    fun select(word: Word?) = _state.update { it.copy(selected = word) }

    private suspend fun fetch(replace: Boolean) {
        val gen = if (replace) ++generation else generation
        val query = _state.value.search.trim()
        val offset = if (replace) 0 else _state.value.words.size
        _state.update {
            if (replace) it.copy(loading = true, error = false) else it.copy(loadingMore = true)
        }
        val attributes = if (_state.value.attributes == null) {
            vocabularyRepository.getWordAttributes().getOrNull()
        } else {
            null
        }
        vocabularyRepository.getWords(query, offset)
            .onSuccess { page ->
                if (gen != generation) return
                _state.update { s ->
                    s.copy(
                        words = if (replace) page.items else s.words + page.items,
                        total = page.total,
                        loading = false,
                        loadingMore = false,
                        attributes = s.attributes ?: attributes,
                    )
                }
            }
            .onFailure {
                if (gen != generation) return
                _state.update { s -> s.copy(loading = false, loadingMore = false, error = replace) }
            }
    }
}
