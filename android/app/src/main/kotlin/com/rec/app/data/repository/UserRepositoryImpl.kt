package com.rec.app.data.repository

import com.rec.app.data.local.TokenStore
import com.rec.app.data.mapper.toDomain
import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.UpdateUserRequest
import com.rec.app.domain.model.DayActivity
import com.rec.app.domain.model.User
import com.rec.app.domain.model.UserStats
import com.rec.app.domain.repository.UserRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class UserRepositoryImpl(
    private val api: RecApi,
    private val tokenStore: TokenStore,
) : UserRepository {
    private val _user = MutableStateFlow<User?>(null)
    override val user: StateFlow<User?> = _user.asStateFlow()

    override val interfaceLanguage: Flow<String?> = tokenStore.language

    override suspend fun getMe(forceRefresh: Boolean): Result<User> {
        if (!forceRefresh) _user.value?.let { return Result.success(it) }
        return apiCall { api.getMe().toDomain() }.onSuccess { remember(it) }
    }

    override suspend fun getStats(): Result<UserStats> = apiCall { api.getMyStats().toDomain() }

    override suspend fun getWeek(): Result<List<DayActivity>> = apiCall { api.getMyWeek().toDomain() }

    /**
     * Applies the language locally first, so the interface and every observer
     * of [user] switch at once, then saves it. A refused save puts the previous
     * language back.
     */
    override suspend fun updateLanguage(language: String): Result<User> {
        val previous = _user.value?.languagePreference
        _user.update { it?.copy(languagePreference = language) }
        tokenStore.saveLanguage(language)
        return apiCall { api.updateMe(UpdateUserRequest(languagePreference = language)).toDomain() }
            .onSuccess { remember(it) }
            .onFailure {
                if (previous != null) {
                    _user.update { it?.copy(languagePreference = previous) }
                    tokenStore.saveLanguage(previous)
                }
            }
    }

    private suspend fun remember(user: User) {
        _user.value = user
        tokenStore.saveLanguage(user.languagePreference)
    }

    /** Drops the cached user. Called on login, registration and logout. */
    fun invalidate() {
        _user.value = null
    }
}
