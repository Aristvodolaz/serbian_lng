package com.rec.app.ui.screens.lesson

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.data.remote.dto.EarnedBadgeDto
import com.rec.app.data.remote.dto.ExercisePublicDto
import com.rec.app.data.repository.ContentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChoiceUi(val id: String, val text: String)
data class ExerciseUi(val id: String, val promptCyrillic: String, val promptLatin: String, val choices: List<ChoiceUi>)
data class EarnedBadgeUi(val titleCyrillic: String, val titleLatin: String)

sealed interface LessonUiState {
    data object Loading : LessonUiState
    data class Error(val message: String) : LessonUiState
    data class InProgress(
        val exercise: ExerciseUi,
        val exerciseNumber: Int,
        val totalExercises: Int,
        val selectedChoiceId: String? = null,
        val correctChoiceId: String? = null,
        val isCorrect: Boolean? = null,
        val isSubmitting: Boolean = false,
    ) : LessonUiState
    data class Finished(
        val xpEarned: Int,
        val totalXp: Int,
        val streakDays: Int,
        val correctCount: Int,
        val totalCount: Int,
        val newBadges: List<EarnedBadgeUi>,
    ) : LessonUiState
}

class LessonViewModel(private val contentRepository: ContentRepository) : ViewModel() {
    private val _state = MutableStateFlow<LessonUiState>(LessonUiState.Loading)
    val state: StateFlow<LessonUiState> = _state.asStateFlow()

    private lateinit var lessonId: String
    private var exercises: List<ExercisePublicDto> = emptyList()
    private var index = 0
    private var correctCount = 0

    fun load(lessonId: String) {
        this.lessonId = lessonId
        viewModelScope.launch {
            _state.value = LessonUiState.Loading
            contentRepository.getLesson(lessonId)
                .onSuccess { lesson ->
                    exercises = lesson.exercises
                    index = 0
                    correctCount = 0
                    if (exercises.isEmpty()) {
                        _state.value = LessonUiState.Error("В этом уроке пока нет упражнений")
                    } else {
                        showCurrentExercise()
                    }
                }
                .onFailure {
                    _state.value = LessonUiState.Error("Не удалось загрузить урок")
                }
        }
    }

    fun selectChoice(choiceId: String) {
        val current = _state.value as? LessonUiState.InProgress ?: return
        if (current.correctChoiceId != null) return // already answered
        _state.value = current.copy(selectedChoiceId = choiceId)
    }

    fun submitAnswer() {
        val current = _state.value as? LessonUiState.InProgress ?: return
        val choiceId = current.selectedChoiceId ?: return
        val exercise = exercises[index]

        viewModelScope.launch {
            _state.value = current.copy(isSubmitting = true)
            contentRepository.answerExercise(lessonId, exercise.id, choiceId)
                .onSuccess { result ->
                    if (result.correct) correctCount++
                    _state.value = current.copy(
                        isSubmitting = false,
                        correctChoiceId = result.correctChoiceId,
                        isCorrect = result.correct,
                    )
                }
                .onFailure {
                    _state.value = current.copy(isSubmitting = false)
                }
        }
    }

    fun nextExercise() {
        index++
        if (index >= exercises.size) {
            finish()
        } else {
            showCurrentExercise()
        }
    }

    private fun showCurrentExercise() {
        val exercise = exercises[index]
        _state.value = LessonUiState.InProgress(
            exercise = ExerciseUi(
                id = exercise.id,
                promptCyrillic = exercise.promptCyrillic,
                promptLatin = exercise.promptLatin,
                choices = exercise.choices.map { ChoiceUi(it.id, it.text) },
            ),
            exerciseNumber = index + 1,
            totalExercises = exercises.size,
        )
    }

    private fun finish() {
        viewModelScope.launch {
            contentRepository.completeLesson(lessonId, correctCount, exercises.size)
                .onSuccess { result ->
                    _state.value = LessonUiState.Finished(
                        xpEarned = result.xpEarned,
                        totalXp = result.totalXp,
                        streakDays = result.streakDays,
                        correctCount = correctCount,
                        totalCount = exercises.size,
                        newBadges = result.newBadges.map { it.toUi() },
                    )
                }
                .onFailure {
                    _state.value = LessonUiState.Error("Не удалось сохранить результат урока")
                }
        }
    }
}

private fun EarnedBadgeDto.toUi() = EarnedBadgeUi(titleCyrillic = titleCyrillic, titleLatin = titleLatin)
