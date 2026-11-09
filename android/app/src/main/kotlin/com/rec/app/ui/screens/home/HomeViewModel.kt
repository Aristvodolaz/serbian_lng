package com.rec.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.R
import com.rec.app.data.remote.dto.LessonSummaryDto
import com.rec.app.data.remote.dto.SectionPathDto
import com.rec.app.data.repository.ContentRepository
import com.rec.app.data.repository.UserRepository
import com.rec.app.ui.common.UiText
import com.rec.app.ui.common.uiText
import com.rec.app.ui.components.LessonPathStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LessonUi(
    val id: String,
    val title: String,
    val titleLatin: String,
    val titleTranslation: String,
    val xpReward: Int,
    val status: LessonPathStatus,
)

data class UnitUi(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslation: String,
    val lessons: List<LessonUi>,
)

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Error(val message: UiText) : HomeUiState
    data class Success(
        val units: List<UnitUi>,
        val xp: Int,
        val streakDays: Int,
        val displayName: String,
        val completedLessons: Int,
        val totalLessons: Int,
    ) : HomeUiState
}

class HomeViewModel(
    private val contentRepository: ContentRepository,
    private val userRepository: UserRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    // No init{} auto-load: HomeScreen's LaunchedEffect(Unit) triggers the
    // first load, and re-triggers it every time the screen is re-entered
    // (e.g. returning from a completed lesson) — an init-block load here
    // would double-fetch on first appearance since the ViewModel instance
    // survives navigating away and back while the composable is recreated.
    fun load() {
        viewModelScope.launch {
            _state.value = HomeUiState.Loading
            val pathResult = contentRepository.getPath()
            val userResult = userRepository.getMe()

            val path = pathResult.getOrNull()
            val user = userResult.getOrNull()
            if (path == null || user == null) {
                _state.value = HomeUiState.Error(uiText(R.string.home_error_load))
                return@launch
            }

            val en = user.languagePreference == "en"
            val units = path.sections.sortedBy { it.order }.flatMap { it.toUnits(en) }
            val allLessons = units.flatMap { it.lessons }

            _state.value = HomeUiState.Success(
                units = units,
                xp = user.xp,
                streakDays = user.streakDays,
                displayName = user.displayName,
                completedLessons = allLessons.count { it.status == LessonPathStatus.DONE },
                totalLessons = allLessons.size,
            )
        }
    }
}

/**
 * Flattens a section into the unit list the home screen renders. The section's
 * checkpoint lesson sits after its last unit's lessons, as on iOS
 * (`LearningPath.lessons`); a section without units gets a unit of its own to hold it.
 */
private fun SectionPathDto.toUnits(en: Boolean): List<UnitUi> {
    val result = units.sortedBy { it.order }.map { unit ->
        UnitUi(
            id = unit.id,
            titleCyrillic = unit.titleCyrillic,
            titleLatin = unit.titleLatin,
            titleTranslation = if (en) unit.titleTranslationEn else unit.titleTranslationRu,
            lessons = unit.lessons.sortedBy { it.order }.map { it.toUi(en) },
        )
    }.toMutableList()
    checkpoint?.let { cp ->
        val lesson = cp.toUi(en)
        if (result.isNotEmpty()) {
            val last = result.last()
            result[result.lastIndex] = last.copy(lessons = last.lessons + lesson)
        } else {
            result += UnitUi(id, titleCyrillic, titleLatin, if (en) titleTranslationEn else titleTranslationRu, listOf(lesson))
        }
    }
    return result
}

private fun LessonSummaryDto.toUi(en: Boolean) = LessonUi(
    id = id,
    title = title,
    titleLatin = titleLatin,
    titleTranslation = if (en) titleTranslationEn else titleTranslationRu,
    xpReward = xpReward,
    status = when (status) {
        "done" -> LessonPathStatus.DONE
        "current" -> LessonPathStatus.CURRENT
        else -> LessonPathStatus.LOCKED
    },
)
