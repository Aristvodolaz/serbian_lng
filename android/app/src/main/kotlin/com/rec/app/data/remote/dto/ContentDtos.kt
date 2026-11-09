package com.rec.app.data.remote.dto

import kotlinx.serialization.Serializable

/** Mirrors the backend's `PathResponseDto`: sections group units, each with an optional checkpoint. */
@Serializable
data class PathResponse(val sections: List<SectionPathDto>)

@Serializable
data class SectionPathDto(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslationRu: String,
    val titleTranslationEn: String,
    /** CEFR level, null for the legacy tail pseudo-section. */
    val level: String? = null,
    val order: Int,
    val units: List<UnitPathDto>,
    val checkpoint: LessonSummaryDto? = null,
)

@Serializable
data class UnitPathDto(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslationRu: String,
    val titleTranslationEn: String,
    val order: Int,
    val lessons: List<LessonSummaryDto>,
)

@Serializable
data class LessonSummaryDto(
    val id: String,
    val title: String,
    val titleLatin: String,
    val titleTranslationRu: String,
    val titleTranslationEn: String,
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

/** Mirrors the backend's `ExercisePublicDto`. The payload's `correctAnswerId` is stripped server-side. */
@Serializable
data class ExercisePublicDto(
    val id: String,
    val type: String,
    val order: Int,
    val payload: ExercisePayloadDto,
)

@Serializable
data class ExercisePayloadDto(
    val question: ExerciseTextDto? = null,
    val sentence: ExerciseTextDto? = null,
    val answers: List<ExerciseAnswerDto> = emptyList(),
)

@Serializable
data class ExerciseTextDto(
    val srCyr: String? = null,
    val srLat: String? = null,
    val ru: String? = null,
    val en: String? = null,
)

@Serializable
data class ExerciseAnswerDto(
    val id: String,
    val srCyr: String? = null,
    val srLat: String? = null,
    val ru: String? = null,
    val en: String? = null,
)

@Serializable
data class AnswerExerciseRequest(val answerId: String)

@Serializable
data class AnswerResultResponse(val correct: Boolean, val correctAnswerId: String)

@Serializable
data class CompleteLessonRequest(val correctCount: Int, val totalCount: Int)

@Serializable
data class CompleteLessonResponse(
    val xpEarned: Int,
    val totalXp: Int,
    val streakDays: Int,
    val newBadges: List<EarnedBadgeDto>,
)
