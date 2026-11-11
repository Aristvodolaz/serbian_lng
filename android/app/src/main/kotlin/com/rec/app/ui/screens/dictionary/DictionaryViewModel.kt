package com.rec.app.ui.screens.dictionary

import androidx.compose.runtime.Immutable
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
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@Immutable
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
) {
    val canLoadMore: Boolean get() = !loading && !loadingMore && words.size < total
}

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

    init {
        // Script and translation language follow the profile as soon as they change.
        viewModelScope.launch {
            userRepository.user.filterNotNull().collect { user ->
                _state.update {
                    it.copy(script = user.scriptPreference, english = user.languagePreference == "en")
                }
            }
        }
    }

    /**
     * Called on every visit to the tab. The word list is fetched only when
     * there is nothing to show, so coming back keeps the list and its scroll position.
     */
    fun onEnter() {
        viewModelScope.launch {
            // Makes sure the user is loaded at least once; the collector above applies it.
            userRepository.getMe(forceRefresh = false)
            if (_state.value.words.isEmpty()) fetch(replace = true)
        }
    }

    fun retry() {
        viewModelScope.launch { fetch(replace = true) }
    }

    fun onSearchChange(text: String) {
        _state.update { it.copy(search = text) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(SEARCH_DEBOUNCE_MS)
            fetch(replace = true)
        }
    }

    fun loadMore() {
        if (!_state.value.canLoadMore) return
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
                        // Pages can overlap if the catalog changes between requests; ids must stay unique as list keys.
                        words = if (replace) page.items else (s.words + page.items).distinctBy { it.id },
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

    private companion object {
        const val SEARCH_DEBOUNCE_MS = 300L
    }
}
