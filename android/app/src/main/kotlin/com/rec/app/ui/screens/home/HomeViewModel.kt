package com.rec.app.ui.screens.home

import androidx.compose.runtime.Immutable
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.R
import com.rec.app.domain.model.HomeOverview
import com.rec.app.domain.model.LessonStatus
import com.rec.app.domain.model.LessonSummary
import com.rec.app.domain.model.Section
import com.rec.app.domain.repository.UserRepository
import com.rec.app.domain.usecase.GetHomeOverviewUseCase
import com.rec.app.ui.common.UiText
import com.rec.app.ui.common.uiText
import com.rec.app.ui.components.LessonPathStatus
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@Immutable
data class LessonUi(
    val id: String,
    val title: String,
    val titleLatin: String,
    val titleTranslation: String,
    val xpReward: Int,
    val status: LessonPathStatus,
)

@Immutable
data class UnitUi(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslation: String,
    val lessons: List<LessonUi>,
)

@Immutable
data class HomeContentUi(
    val units: List<UnitUi>,
    val xp: Int,
    val streakDays: Int,
    val displayName: String,
    val completedLessons: Int,
    val totalLessons: Int,
    /** The lesson to continue with; null once everything is done. */
    val nextLesson: LessonUi?,
)

/**
 * [content] stays on screen while a refresh runs or fails, so returning to the
 * tab never flashes a spinner over a path that is already loaded.
 */
@Immutable
data class HomeUiState(
    val content: HomeContentUi? = null,
    val isLoading: Boolean = true,
    val error: UiText? = null,
)

class HomeViewModel(
    private val getHomeOverview: GetHomeOverviewUseCase,
    private val userRepository: UserRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    private var loadJob: Job? = null
    private var lastOverview: HomeOverview? = null

    init {
        // A language switch in the profile re-renders the loaded path at once,
        // without waiting for the next reload.
        viewModelScope.launch {
            userRepository.user
                .filterNotNull()
                .map { it.languagePreference }
                .distinctUntilChanged()
                .collect { language ->
                    val overview = lastOverview ?: return@collect
                    if (overview.user.languagePreference != language) {
                        show(overview.copy(user = overview.user.copy(languagePreference = language)))
                    }
                }
        }
    }

    private fun show(overview: HomeOverview) {
        lastOverview = overview
        _state.value = HomeUiState(content = overview.toUi(), isLoading = false)
    }

    /** Called every time the screen is entered, e.g. coming back from a finished lesson. */
    fun refresh() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            getHomeOverview()
                .onSuccess { overview -> show(overview) }
                .onFailure {
                    _state.update { it.copy(isLoading = false, error = uiText(R.string.home_error_load)) }
                }
        }
    }
}

private fun HomeOverview.toUi(): HomeContentUi {
    val english = user.languagePreference == "en"
    val units = path.sections.sortedBy { it.order }.flatMap { it.toUnits(english) }
    val lessons = units.flatMap { it.lessons }
    return HomeContentUi(
        units = units,
        xp = user.xp,
        streakDays = user.streakDays,
        displayName = user.displayName,
        completedLessons = lessons.count { it.status == LessonPathStatus.DONE },
        totalLessons = lessons.size,
        nextLesson = lessons.firstOrNull { it.status == LessonPathStatus.CURRENT },
    )
}

/**
 * Flattens a section into the unit list the home screen renders. The section's
 * checkpoint lesson sits after its last unit's lessons, as on iOS
 * (`LearningPath.lessons`); a section without units gets a unit of its own to hold it.
 */
private fun Section.toUnits(english: Boolean): List<UnitUi> {
    val result = units.sortedBy { it.order }.map { unit ->
        UnitUi(
            id = unit.id,
            titleCyrillic = unit.titleCyrillic,
            titleLatin = unit.titleLatin,
            titleTranslation = if (english) unit.titleTranslationEn else unit.titleTranslationRu,
            lessons = unit.lessons.sortedBy { it.order }.map { it.toUi(english) },
        )
    }.toMutableList()
    checkpoint?.let { cp ->
        val lesson = cp.toUi(english)
        if (result.isNotEmpty()) {
            val last = result.last()
            result[result.lastIndex] = last.copy(lessons = last.lessons + lesson)
        } else {
            result += UnitUi(id, titleCyrillic, titleLatin, if (english) titleTranslationEn else titleTranslationRu, listOf(lesson))
        }
    }
    return result
}

private fun LessonSummary.toUi(english: Boolean) = LessonUi(
    id = id,
    title = title,
    titleLatin = titleLatin,
    titleTranslation = if (english) titleTranslationEn else titleTranslationRu,
    xpReward = xpReward,
    status = when (status) {
        LessonStatus.DONE -> LessonPathStatus.DONE
        LessonStatus.CURRENT -> LessonPathStatus.CURRENT
        LessonStatus.LOCKED -> LessonPathStatus.LOCKED
    },
)
