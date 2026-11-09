package com.rec.app.domain.model

data class User(
    val displayName: String,
    val scriptPreference: String,
    /** "ru" | "en" */
    val languagePreference: String,
    val xp: Int,
    val streakDays: Int,
)

data class UserStats(
    val wordsLearned: Int,
    val accuracy: Int,
    val lessonsCompleted: Int,
    val weeksActive: Int,
    val xp: Int,
    val streakDays: Int,
)

data class DayActivity(val weekday: Int, val active: Boolean)

data class EarnedBadge(val titleCyrillic: String, val titleLatin: String)
