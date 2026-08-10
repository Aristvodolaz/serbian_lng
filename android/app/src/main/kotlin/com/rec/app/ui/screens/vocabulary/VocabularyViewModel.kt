package com.rec.app.ui.screens.vocabulary

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.data.remote.dto.ReviewWordResponse
import com.rec.app.data.repository.VocabularyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CardUi(
    val wordId: String,
    val cyrillic: String,
    val latin: String,
    val translation: String,
    val exampleCyrillic: String?,
    val exampleTranslation: String?,
)

sealed interface FlashcardsUiState {
    data object Loading : FlashcardsUiState
    data object Empty : FlashcardsUiState
    data class Error(val message: String) : FlashcardsUiState
    data class Reviewing(val card: CardUi, val index: Int, val total: Int, val isSubmitting: Boolean = false) : FlashcardsUiState
    data class Done(val reviewedCount: Int, val newBadgeTitles: List<String>) : FlashcardsUiState
}

class VocabularyViewModel(
    private val vocabularyRepository: VocabularyRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<FlashcardsUiState>(FlashcardsUiState.Loading)
    val state: StateFlow<FlashcardsUiState> = _state.asStateFlow()

    private var queue: List<ReviewWordResponse> = emptyList()
    private var index = 0
    private val earnedBadgeTitles = mutableListOf<String>()

    fun load() {
        viewModelScope.launch {
            _state.value = FlashcardsUiState.Loading
            index = 0
            earnedBadgeTitles.clear()
            vocabularyRepository.getReviewQueue(limit = 15)
                .onSuccess { words ->
                    queue = words
                    if (words.isEmpty()) _state.value = FlashcardsUiState.Empty else showCurrent()
                }
                .onFailure { _state.value = FlashcardsUiState.Error("Не удалось загрузить карточки") }
        }
    }

    fun submitReview(result: String) {
        val current = _state.value as? FlashcardsUiState.Reviewing ?: return
        viewModelScope.launch {
            _state.value = current.copy(isSubmitting = true)
            vocabularyRepository.submitReview(current.card.wordId, result)
                .onSuccess { response ->
                    earnedBadgeTitles += response.newBadges.map { it.titleCyrillic }
                    index++
                    if (index >= queue.size) {
                        _state.value = FlashcardsUiState.Done(queue.size, earnedBadgeTitles.toList())
                    } else {
                        showCurrent()
                    }
                }
                .onFailure { _state.value = current.copy(isSubmitting = false) }
        }
    }

    private fun showCurrent() {
        val word = queue[index]
        _state.value = FlashcardsUiState.Reviewing(
            card = CardUi(
                wordId = word.wordId,
                cyrillic = word.cyrillic,
                latin = word.latin,
                translation = word.translation,
                exampleCyrillic = word.exampleCyrillic,
                exampleTranslation = word.exampleTranslation,
            ),
            index = index + 1,
            total = queue.size,
        )
    }
}
