package com.rec.app.ui.screens.lesson

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.R
import com.rec.app.domain.model.Exercise
import com.rec.app.domain.model.ExerciseText
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.model.SectionLockedException
import com.rec.app.domain.repository.ContentRepository
import com.rec.app.domain.repository.UserRepository
import com.rec.app.ui.common.UiText
import com.rec.app.ui.common.uiText
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChoiceUi(val id: String, val text: String)
data class ExerciseUi(val id: String, val promptCyrillic: String, val promptLatin: String, val choices: List<ChoiceUi>)
data class EarnedBadgeUi(val titleCyrillic: String, val titleLatin: String)

sealed interface LessonUiState {
    data object Loading : LessonUiState
    data class Error(val message: UiText) : LessonUiState
    /** The section's checkpoint isn't passed yet (403 SECTION_LOCKED); shown as an alert, as on iOS. */
    data object Locked : LessonUiState
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

/**
 * Exercise types this screen can present. Anything else is skipped rather than
 * forced through the multiple-choice layout — and stays out of the score
 * reported to `/complete`. Mirrors iOS `ExerciseType.isSupported`.
 */
private val SUPPORTED_EXERCISE_TYPES = setOf("translation_choice", "fill_word")

class LessonViewModel(
    private val contentRepository: ContentRepository,
    private val userRepository: UserRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<LessonUiState>(LessonUiState.Loading)
    val state: StateFlow<LessonUiState> = _state.asStateFlow()

    private lateinit var lessonId: String
    private var exercises: List<Exercise> = emptyList()
    private var index = 0
    private var correctCount = 0
    private var languageIsEn = false
    private var scriptIsLatin = false

    fun load(lessonId: String) {
        this.lessonId = lessonId
        viewModelScope.launch {
            _state.value = LessonUiState.Loading
            val user = userRepository.getMe().getOrNull()
            if (user != null) {
                languageIsEn = user.languagePreference == "en"
                scriptIsLatin = user.scriptPreference == "latin"
            }
            contentRepository.getLesson(lessonId)
                .onSuccess { lesson ->
                    exercises = lesson.exercises
                        .filter { it.type in SUPPORTED_EXERCISE_TYPES }
                        .sortedBy { it.order }
                    index = 0
                    correctCount = 0
                    if (exercises.isEmpty()) {
                        _state.value = LessonUiState.Error(uiText(R.string.lesson_error_no_exercises))
                    } else {
                        showCurrentExercise()
                    }
                }
                .onFailure {
                    _state.value = if (it is SectionLockedException) LessonUiState.Locked else LessonUiState.Error(uiText(R.string.lesson_error_load))
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
        val answerId = current.selectedChoiceId ?: return
        val exercise = exercises[index]

        viewModelScope.launch {
            _state.value = current.copy(isSubmitting = true)
            contentRepository.answerExercise(lessonId, exercise.id, answerId)
                .onSuccess { result ->
                    if (result.correct) correctCount++
                    _state.value = current.copy(
                        isSubmitting = false,
                        correctChoiceId = result.correctAnswerId,
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
        val prompt: ExerciseText? = exercise.prompt
        _state.value = LessonUiState.InProgress(
            exercise = ExerciseUi(
                id = exercise.id,
                promptCyrillic = prompt?.srCyr ?: prompt?.srLat.orEmpty(),
                promptLatin = prompt?.srLat ?: prompt?.srCyr.orEmpty(),
                choices = exercise.answers.map { answer ->
                    ChoiceUi(answer.id, choiceText(exercise.type, answer.ru, answer.en, answer.srCyr, answer.srLat))
                },
            ),
            exerciseNumber = index + 1,
            totalExercises = exercises.size,
        )
    }

    /** Translation choices show the interface language; fill_word choices show Serbian in the chosen script. */
    private fun choiceText(type: String, ru: String?, en: String?, srCyr: String?, srLat: String?): String {
        if (type == "translation_choice") return (if (languageIsEn) en else ru).orEmpty()
        return (if (scriptIsLatin) srLat ?: srCyr else srCyr ?: srLat).orEmpty()
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
                    _state.value = LessonUiState.Error(uiText(R.string.lesson_error_save))
                }
        }
    }
}

private fun EarnedBadge.toUi() = EarnedBadgeUi(titleCyrillic = titleCyrillic, titleLatin = titleLatin)
