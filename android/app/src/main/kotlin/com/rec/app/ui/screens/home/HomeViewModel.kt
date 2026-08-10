package com.rec.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.data.remote.dto.UnitPathDto
import com.rec.app.data.repository.ContentRepository
import com.rec.app.data.repository.UserRepository
import com.rec.app.ui.components.LessonPathStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LessonUi(
    val id: String,
    val title: String,
    val titleLatin: String,
    val status: LessonPathStatus,
)

data class UnitUi(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val lessons: List<LessonUi>,
)

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Error(val message: String) : HomeUiState
    data class Success(val units: List<UnitUi>, val xp: Int, val streakDays: Int) : HomeUiState
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
                _state.value = HomeUiState.Error("Не удалось загрузить путь уроков")
                return@launch
            }

            _state.value = HomeUiState.Success(
                units = path.units.map { it.toUi() },
                xp = user.xp,
                streakDays = user.streakDays,
            )
        }
    }
}

private fun UnitPathDto.toUi() = UnitUi(
    id = id,
    titleCyrillic = titleCyrillic,
    titleLatin = titleLatin,
    lessons = lessons.map {
        LessonUi(
            id = it.id,
            title = it.title,
            titleLatin = it.titleLatin,
            status = when (it.status) {
                "done" -> LessonPathStatus.DONE
                "current" -> LessonPathStatus.CURRENT
                else -> LessonPathStatus.LOCKED
            },
        )
    },
)
