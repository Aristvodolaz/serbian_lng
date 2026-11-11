package com.rec.app.ui.screens.profile

import androidx.compose.runtime.Immutable
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.R
import com.rec.app.domain.model.ProfileOverview
import com.rec.app.domain.repository.AuthRepository
import com.rec.app.domain.repository.UserRepository
import com.rec.app.domain.usecase.GetProfileOverviewUseCase
import com.rec.app.ui.common.UiText
import com.rec.app.ui.common.uiText
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@Immutable
data class DayUi(val weekday: Int, val active: Boolean)

@Immutable
data class BadgeUi(val titleCyrillic: String, val titleLatin: String)

@Immutable
data class ProfileContentUi(
    val displayName: String,
    val streakDays: Int,
    val xp: Int,
    val wordsLearned: Int,
    val accuracy: Int,
    val lessonsCompleted: Int,
    val weeksActive: Int,
    val week: List<DayUi>,
    val badges: List<BadgeUi>,
    val english: Boolean,
)

@Immutable
data class ProfileUiState(
    val content: ProfileContentUi? = null,
    val isLoading: Boolean = true,
    val error: UiText? = null,
)

class ProfileViewModel(
    private val getProfileOverview: GetProfileOverviewUseCase,
    private val userRepository: UserRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    private var loadJob: Job? = null

    fun refresh() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            getProfileOverview()
                .onSuccess { overview ->
                    _state.value = ProfileUiState(content = overview.toUi(), isLoading = false)
                }
                .onFailure {
                    _state.update { it.copy(isLoading = false, error = uiText(R.string.profile_error_load)) }
                }
        }
    }

    /**
     * Saves the interface language to the profile; the screens that show
     * translations read it on their next load. The switch moves at once and
     * moves back if the server refuses.
     */
    fun setLanguage(english: Boolean) {
        val content = _state.value.content ?: return
        if (content.english == english) return
        _state.update { it.copy(content = content.copy(english = english)) }
        viewModelScope.launch {
            userRepository.updateLanguage(if (english) "en" else "ru").onFailure {
                _state.update { state -> state.copy(content = state.content?.copy(english = content.english)) }
            }
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }
}

private fun ProfileOverview.toUi() = ProfileContentUi(
    displayName = user.displayName,
    streakDays = stats.streakDays,
    xp = stats.xp,
    wordsLearned = stats.wordsLearned,
    accuracy = stats.accuracy,
    lessonsCompleted = stats.lessonsCompleted,
    weeksActive = stats.weeksActive,
    week = week.map { DayUi(it.weekday, it.active) },
    badges = badges.map { BadgeUi(it.titleCyrillic, it.titleLatin) },
    english = user.languagePreference == "en",
)
