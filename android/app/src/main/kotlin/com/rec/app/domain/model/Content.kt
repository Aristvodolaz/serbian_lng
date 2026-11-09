package com.rec.app.domain.model

/** Where a lesson stands for the current user. */
enum class LessonStatus { DONE, CURRENT, LOCKED }

/** The learning path: sections in order, each holding units and an optional checkpoint lesson. */
data class Path(val sections: List<Section>)

data class Section(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslationRu: String,
    val titleTranslationEn: String,
    val order: Int,
    val units: List<LearningUnit>,
    val checkpoint: LessonSummary?,
)

data class LearningUnit(
    val id: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val titleTranslationRu: String,
    val titleTranslationEn: String,
    val order: Int,
    val lessons: List<LessonSummary>,
)

data class LessonSummary(
    val id: String,
    val title: String,
    val titleLatin: String,
    val titleTranslationRu: String,
    val titleTranslationEn: String,
    val order: Int,
    val xpReward: Int,
    val status: LessonStatus,
)

data class Lesson(val id: String, val exercises: List<Exercise>)

/** A single exercise. [prompt] is the question or sentence shown above the answers. */
data class Exercise(
    val id: String,
    val type: String,
    val order: Int,
    val prompt: ExerciseText?,
    val answers: List<ExerciseAnswer>,
)

data class ExerciseText(val srCyr: String?, val srLat: String?, val ru: String?, val en: String?)

data class ExerciseAnswer(
    val id: String,
    val srCyr: String?,
    val srLat: String?,
    val ru: String?,
    val en: String?,
)

data class LessonResult(val correct: Boolean, val correctAnswerId: String)

data class CompletedLesson(
    val xpEarned: Int,
    val totalXp: Int,
    val streakDays: Int,
    val newBadges: List<EarnedBadge>,
)
