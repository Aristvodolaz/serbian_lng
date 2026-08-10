package com.rec.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class UpdateUserRequest(
    val displayName: String? = null,
    val scriptPreference: String? = null,
)

@Serializable
data class UserStatsResponse(
    val wordsLearned: Int,
    val accuracy: Int,
    val lessonsCompleted: Int,
    val weeksActive: Int,
    val xp: Int,
    val streakDays: Int,
)

@Serializable
data class WeekActivityResponse(val days: List<DayActivityDto>)

@Serializable
data class DayActivityDto(val date: String, val weekday: Int, val active: Boolean)
