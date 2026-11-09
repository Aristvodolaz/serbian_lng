package com.rec.app.data.repository

import com.rec.app.data.mapper.toDomain
import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.UpdateUserRequest
import com.rec.app.domain.model.DayActivity
import com.rec.app.domain.model.User
import com.rec.app.domain.model.UserStats
import com.rec.app.domain.repository.UserRepository

class UserRepositoryImpl(private val api: RecApi) : UserRepository {
    override suspend fun getMe(): Result<User> = runCatching { api.getMe().toDomain() }

    override suspend fun getStats(): Result<UserStats> = runCatching { api.getMyStats().toDomain() }

    override suspend fun getWeek(): Result<List<DayActivity>> = runCatching { api.getMyWeek().toDomain() }

    override suspend fun updateLanguage(language: String): Result<User> =
        runCatching { api.updateMe(UpdateUserRequest(languagePreference = language)).toDomain() }
}
