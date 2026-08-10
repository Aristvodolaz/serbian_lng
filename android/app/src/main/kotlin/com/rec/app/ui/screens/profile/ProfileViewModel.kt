package com.rec.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.data.repository.AuthRepository
import com.rec.app.data.repository.BadgesRepository
import com.rec.app.data.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DayUi(val weekday: Int, val active: Boolean)
data class EarnedBadgeUi(val titleCyrillic: String, val titleLatin: String)

sealed interface ProfileUiState {
    data object Loading : ProfileUiState
    data class Error(val message: String) : ProfileUiState
    data class Success(
        val displayName: String,
        val streakDays: Int,
        val wordsLearned: Int,
        val accuracy: Int,
        val lessonsCompleted: Int,
        val weeksActive: Int,
        val week: List<DayUi>,
        val badges: List<EarnedBadgeUi>,
    ) : ProfileUiState
}

class ProfileViewModel(
    private val userRepository: UserRepository,
    private val badgesRepository: BadgesRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = ProfileUiState.Loading
            val me = userRepository.getMe().getOrNull()
            val stats = userRepository.getStats().getOrNull()
            val week = userRepository.getWeek().getOrNull()
            val badges = badgesRepository.getMyBadges().getOrNull()

            if (me == null || stats == null || week == null) {
                _state.value = ProfileUiState.Error("Не удалось загрузить профиль")
                return@launch
            }

            _state.value = ProfileUiState.Success(
                displayName = me.displayName,
                streakDays = stats.streakDays,
                wordsLearned = stats.wordsLearned,
                accuracy = stats.accuracy,
                lessonsCompleted = stats.lessonsCompleted,
                weeksActive = stats.weeksActive,
                week = week.days.map { DayUi(it.weekday, it.active) },
                badges = badges.orEmpty().map { EarnedBadgeUi(it.titleCyrillic, it.titleLatin) },
            )
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }
}
