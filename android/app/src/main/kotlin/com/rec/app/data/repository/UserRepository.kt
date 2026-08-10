package com.rec.app.data.repository

import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.UserDto
import com.rec.app.data.remote.dto.UserStatsResponse
import com.rec.app.data.remote.dto.WeekActivityResponse

class UserRepository(private val api: RecApi) {
    suspend fun getMe(): Result<UserDto> = runCatching { api.getMe() }
    suspend fun getStats(): Result<UserStatsResponse> = runCatching { api.getMyStats() }
    suspend fun getWeek(): Result<WeekActivityResponse> = runCatching { api.getMyWeek() }
}
