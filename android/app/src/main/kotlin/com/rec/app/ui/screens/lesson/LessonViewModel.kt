package com.rec.app.ui.screens.lesson

import androidx.compose.runtime.Immutable
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.R
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.model.Exercise
import com.rec.app.domain.model.SectionLockedException
import com.rec.app.domain.repository.ContentRepository
import com.rec.app.domain.repository.UserRepository
import com.rec.app.ui.common.UiText
import com.rec.app.ui.common.uiText
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

@Immutable
data class ChoiceUi(val id: String, val text: String)

@Immutable
data class ExerciseUi(val id: String, val promptCyrillic: String, val promptLatin: String, val choices: List<ChoiceUi>)

@Immutable
data class EarnedBadgeUi(val titleCyrillic: String, val titleLatin: String)

sealed interface LessonUiState {
    data object Loading : LessonUiState
    data class Error(val message: UiText) : LessonUiState
    /** The section's checkpoint isn't passed yet (403 SECTION_LOCKED); shown as an alert, as on iOS. */
    data object Locked : LessonUiState

    @Immutable
    data class InProgress(
        val exercise: ExerciseUi,
        val exerciseNumber: Int,
        val totalExercises: Int,
        val selectedChoiceId: String? = null,
        val correctChoiceId: String? = null,
        val isCorrect: Boolean? = null,
        val isSubmitting: Boolean = false,
    ) : LessonUiState {
        val isAnswered: Boolean get() = correctChoiceId != null

        /** Nothing would be lost by leaving, so no exit confirmation is needed. */
        val isUntouched: Boolean get() = exerciseNumber == 1 && selectedChoiceId == null && !isAnswered
    }

    @Immutable
    data class Finished(
        val xpEarned: Int,
        val totalXp: Int,
        val streakDays: Int,
        val correctCount: Int,
        val totalCount: Int,
        val newBadges: List<EarnedBadgeUi>,
    ) : LessonUiState
}

/** One-shot messages for the screen: things to show once, not state to render. */
sealed interface LessonEffect {
    data class ShowMessage(val message: UiText) : LessonEffect
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

    private val _effects = Channel<LessonEffect>(Channel.BUFFERED)
    val effects: Flow<LessonEffect> = _effects.receiveAsFlow()

    private var lessonId: String? = null
    private var exercises: List<Exercise> = emptyList()
    private var index = 0
    private var correctCount = 0
    private var languageIsEn = false
    private var scriptIsLatin = false

    /** Safe to call again for the same lesson: a rotation doesn't restart a lesson in progress. */
    fun load(lessonId: String) {
        if (this.lessonId == lessonId && _state.value !is LessonUiState.Error) return
        this.lessonId = lessonId
        viewModelScope.launch {
            _state.value = LessonUiState.Loading
            userRepository.getMe(forceRefresh = false).getOrNull()?.let { user ->
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
                    _state.value = if (it is SectionLockedException) {
                        LessonUiState.Locked
                    } else {
                        LessonUiState.Error(uiText(R.string.lesson_error_load))
                    }
                }
        }
    }

    fun retry() {
        val id = lessonId ?: return
        lessonId = null
        load(id)
    }

    fun selectChoice(choiceId: String) {
        val current = _state.value as? LessonUiState.InProgress ?: return
        if (current.isAnswered || current.isSubmitting) return
        _state.value = current.copy(selectedChoiceId = choiceId)
    }

    fun submitAnswer() {
        val current = _state.value as? LessonUiState.InProgress ?: return
        val answerId = current.selectedChoiceId ?: return
        val id = lessonId ?: return
        if (current.isSubmitting || current.isAnswered) return
        val exercise = exercises[index]

        viewModelScope.launch {
            _state.value = current.copy(isSubmitting = true)
            contentRepository.answerExercise(id, exercise.id, answerId)
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
                    _effects.send(LessonEffect.ShowMessage(uiText(R.string.auth_error_network)))
                }
        }
    }

    fun nextExercise() {
        val current = _state.value as? LessonUiState.InProgress ?: return
        if (current.isSubmitting) return
        index++
        if (index >= exercises.size) {
            finish(current)
        } else {
            showCurrentExercise()
        }
    }

    private fun showCurrentExercise() {
        val exercise = exercises[index]
        val prompt = exercise.prompt
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

    private fun finish(last: LessonUiState.InProgress) {
        val id = lessonId ?: return
        viewModelScope.launch {
            // Stay on the last exercise with a busy button while the result is saved.
            _state.value = last.copy(isSubmitting = true)
            contentRepository.completeLesson(id, correctCount, exercises.size)
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
                    // Step back so "Continue" can retry saving instead of losing the whole lesson.
                    index = exercises.lastIndex
                    _state.value = last.copy(isSubmitting = false)
                    _effects.send(LessonEffect.ShowMessage(uiText(R.string.lesson_error_save)))
                }
        }
    }
}

private fun EarnedBadge.toUi() = EarnedBadgeUi(titleCyrillic = titleCyrillic, titleLatin = titleLatin)
