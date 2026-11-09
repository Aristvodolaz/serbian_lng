package com.rec.app.data.mapper

import com.rec.app.data.remote.dto.AnswerResultResponse
import com.rec.app.data.remote.dto.CompleteLessonResponse
import com.rec.app.data.remote.dto.DayActivityDto
import com.rec.app.data.remote.dto.EarnedBadgeDto
import com.rec.app.data.remote.dto.ExerciseAnswerDto
import com.rec.app.data.remote.dto.ExercisePublicDto
import com.rec.app.data.remote.dto.ExerciseTextDto
import com.rec.app.data.remote.dto.LessonDetailResponse
import com.rec.app.data.remote.dto.LessonSummaryDto
import com.rec.app.data.remote.dto.PathResponse
import com.rec.app.data.remote.dto.ReviewWordResponse
import com.rec.app.data.remote.dto.SectionPathDto
import com.rec.app.data.remote.dto.SubmitReviewResponse
import com.rec.app.data.remote.dto.UnitPathDto
import com.rec.app.data.remote.dto.UserDto
import com.rec.app.data.remote.dto.UserStatsResponse
import com.rec.app.data.remote.dto.WeekActivityResponse
import com.rec.app.data.remote.dto.WordAttributeOptionDto
import com.rec.app.data.remote.dto.WordAttributesDto
import com.rec.app.data.remote.dto.WordDto
import com.rec.app.data.remote.dto.WordsResponse
import com.rec.app.domain.model.AttributeOption
import com.rec.app.domain.model.CompletedLesson
import com.rec.app.domain.model.DayActivity
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.model.Exercise
import com.rec.app.domain.model.ExerciseAnswer
import com.rec.app.domain.model.ExerciseText
import com.rec.app.domain.model.LearningUnit
import com.rec.app.domain.model.Lesson
import com.rec.app.domain.model.LessonResult
import com.rec.app.domain.model.LessonStatus
import com.rec.app.domain.model.LessonSummary
import com.rec.app.domain.model.Path
import com.rec.app.domain.model.ReviewCard
import com.rec.app.domain.model.ReviewOutcome
import com.rec.app.domain.model.Section
import com.rec.app.domain.model.User
import com.rec.app.domain.model.UserStats
import com.rec.app.domain.model.Word
import com.rec.app.domain.model.WordAttributes
import com.rec.app.domain.model.WordPage

// DTO -> domain conversions. The only place that knows both shapes.

fun PathResponse.toDomain() = Path(sections.map { it.toDomain() })

private fun SectionPathDto.toDomain() = Section(
    id = id,
    titleCyrillic = titleCyrillic,
    titleLatin = titleLatin,
    titleTranslationRu = titleTranslationRu,
    titleTranslationEn = titleTranslationEn,
    order = order,
    units = units.map { it.toDomain() },
    checkpoint = checkpoint?.toDomain(),
)

private fun UnitPathDto.toDomain() = LearningUnit(
    id = id,
    titleCyrillic = titleCyrillic,
    titleLatin = titleLatin,
    titleTranslationRu = titleTranslationRu,
    titleTranslationEn = titleTranslationEn,
    order = order,
    lessons = lessons.map { it.toDomain() },
)

private fun LessonSummaryDto.toDomain() = LessonSummary(
    id = id,
    title = title,
    titleLatin = titleLatin,
    titleTranslationRu = titleTranslationRu,
    titleTranslationEn = titleTranslationEn,
    order = order,
    xpReward = xpReward,
    status = when (status) {
        "done" -> LessonStatus.DONE
        "current" -> LessonStatus.CURRENT
        else -> LessonStatus.LOCKED
    },
)

fun LessonDetailResponse.toDomain() = Lesson(id, exercises.map { it.toDomain() })

private fun ExercisePublicDto.toDomain() = Exercise(
    id = id,
    type = type,
    order = order,
    prompt = (payload.question ?: payload.sentence)?.toDomain(),
    answers = payload.answers.map { it.toDomain() },
)

private fun ExerciseTextDto.toDomain() = ExerciseText(srCyr, srLat, ru, en)

private fun ExerciseAnswerDto.toDomain() = ExerciseAnswer(id, srCyr, srLat, ru, en)

fun AnswerResultResponse.toDomain() = LessonResult(correct, correctAnswerId)

fun CompleteLessonResponse.toDomain() = CompletedLesson(
    xpEarned = xpEarned,
    totalXp = totalXp,
    streakDays = streakDays,
    newBadges = newBadges.map { it.toDomain() },
)

fun EarnedBadgeDto.toDomain() = EarnedBadge(titleCyrillic = titleCyrillic, titleLatin = titleLatin)

fun UserDto.toDomain() = User(
    displayName = displayName,
    scriptPreference = scriptPreference,
    languagePreference = languagePreference,
    xp = xp,
    streakDays = streakDays,
)

fun UserStatsResponse.toDomain() = UserStats(
    wordsLearned = wordsLearned,
    accuracy = accuracy,
    lessonsCompleted = lessonsCompleted,
    weeksActive = weeksActive,
    xp = xp,
    streakDays = streakDays,
)

fun WeekActivityResponse.toDomain() = days.map { it.toDomain() }

private fun DayActivityDto.toDomain() = DayActivity(weekday, active)

fun ReviewWordResponse.toDomain() = ReviewCard(
    wordId = wordId,
    cyrillic = cyrillic,
    latin = latin,
    translation = translation,
    exampleCyrillic = exampleCyrillic,
    exampleTranslation = exampleTranslation,
)

fun SubmitReviewResponse.toOutcome() = ReviewOutcome(newBadges.map { it.toDomain() })

fun WordsResponse.toDomain() = WordPage(items.map { it.toDomain() }, total)

private fun WordDto.toDomain() = Word(
    id = id,
    cyrillic = cyrillic,
    latin = latin,
    translationRu = translationRu,
    translationEn = translationEn,
    exampleCyrillic = exampleCyrillic,
    exampleTranslationRu = exampleTranslationRu,
    exampleTranslationEn = exampleTranslationEn,
    partOfSpeech = partOfSpeech,
    gender = gender,
    number = number,
    declension = declension,
    conjugation = conjugation,
)

fun WordAttributesDto.toDomain() = WordAttributes(
    partOfSpeech = partOfSpeech.map { it.toDomain() },
    gender = gender.map { it.toDomain() },
    number = number.map { it.toDomain() },
    declension = declension.map { it.toDomain() },
    conjugation = conjugation.map { it.toDomain() },
)

private fun WordAttributeOptionDto.toDomain() = AttributeOption(value, ru, en)
