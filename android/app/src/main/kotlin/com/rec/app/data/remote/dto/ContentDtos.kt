package com.rec.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class PathResponse(val units: List<UnitPathDto>)

@Serializable
data class UnitPathDto(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslation: String,
    val order: Int,
    val lessons: List<LessonSummaryDto>,
)

@Serializable
data class LessonSummaryDto(
    val id: String,
    val title: String,
    val titleLatin: String,
    val titleTranslation: String,
    val order: Int,
    val xpReward: Int,
    /** "done" | "current" | "locked" — see [com.rec.app.ui.components.LessonPathStatus]. */
    val status: String,
)

@Serializable
data class LessonDetailResponse(
    val id: String,
    val title: String,
    val titleLatin: String,
    val xpReward: Int,
    val exercises: List<ExercisePublicDto>,
)

@Serializable
data class ExercisePublicDto(
    val id: String,
    val type: String,
    val promptCyrillic: String,
    val promptLatin: String,
    val order: Int,
    val choices: List<ExerciseChoicePublicDto>,
)

@Serializable
data class ExerciseChoicePublicDto(val id: String, val text: String)

@Serializable
data class AnswerExerciseRequest(val choiceId: String)

@Serializable
data class AnswerResultResponse(val correct: Boolean, val correctChoiceId: String)

@Serializable
data class CompleteLessonRequest(val correctCount: Int, val totalCount: Int)

@Serializable
data class CompleteLessonResponse(
    val xpEarned: Int,
    val totalXp: Int,
    val streakDays: Int,
    val newBadges: List<EarnedBadgeDto>,
)
