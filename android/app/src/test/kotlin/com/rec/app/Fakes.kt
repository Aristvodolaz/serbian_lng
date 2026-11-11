package com.rec.app

import com.rec.app.domain.model.CompletedLesson
import com.rec.app.domain.model.DayActivity
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.model.LearningUnit
import com.rec.app.domain.model.Lesson
import com.rec.app.domain.model.LessonResult
import com.rec.app.domain.model.LessonStatus
import com.rec.app.domain.model.LessonSummary
import com.rec.app.domain.model.Path
import com.rec.app.domain.model.Section
import com.rec.app.domain.model.User
import com.rec.app.domain.model.UserStats
import com.rec.app.domain.repository.BadgesRepository
import com.rec.app.domain.repository.ContentRepository
import com.rec.app.domain.repository.UserRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

val testUser = User(displayName = "Milica", scriptPreference = "both", languagePreference = "en", xp = 120, streakDays = 4)

val testStats = UserStats(wordsLearned = 30, accuracy = 80, lessonsCompleted = 5, weeksActive = 2, xp = 120, streakDays = 4)

fun lessonSummary(id: String, status: LessonStatus, order: Int = 0) = LessonSummary(
    id = id,
    title = "Лекција $id",
    titleLatin = "Lekcija $id",
    titleTranslationRu = "Урок $id",
    titleTranslationEn = "Lesson $id",
    order = order,
    xpReward = 10,
    status = status,
)

fun pathOf(vararg lessons: LessonSummary, checkpoint: LessonSummary? = null) = Path(
    listOf(
        Section(
            id = "s1",
            titleCyrillic = "Раздео",
            titleLatin = "Razdeo",
            titleTranslationRu = "Раздел",
            titleTranslationEn = "Section",
            order = 0,
            units = listOf(
                LearningUnit(
                    id = "u1",
                    titleCyrillic = "Јединица",
                    titleLatin = "Jedinica",
                    titleTranslationRu = "Юнит",
                    titleTranslationEn = "Unit",
                    order = 0,
                    lessons = lessons.toList(),
                ),
            ),
            checkpoint = checkpoint,
        ),
    ),
)

class FakeContentRepository(var path: Result<Path>) : ContentRepository {
    var lesson: Result<Lesson> = Result.failure(IllegalStateException("no lesson"))
    var answer: Result<LessonResult> = Result.failure(IllegalStateException("no answer"))
    var completion: Result<CompletedLesson> = Result.failure(IllegalStateException("no completion"))

    override suspend fun getPath() = path
    override suspend fun getLesson(lessonId: String) = lesson
    override suspend fun answerExercise(lessonId: String, exerciseId: String, answerId: String) = answer
    override suspend fun completeLesson(lessonId: String, correctCount: Int, totalCount: Int) = completion
}

class FakeUserRepository(
    var me: Result<User> = Result.success(testUser),
    var stats: Result<UserStats> = Result.success(testStats),
    var week: Result<List<DayActivity>> = Result.success(listOf(DayActivity(1, true))),
) : UserRepository {
    var updateLanguage: Result<User> = Result.success(testUser)
    override val user = MutableStateFlow<User?>(null)
    override val interfaceLanguage: Flow<String?> = MutableStateFlow(null)

    override suspend fun getMe(forceRefresh: Boolean) = me.onSuccess { user.value = it }
    override suspend fun getStats() = stats
    override suspend fun getWeek() = week
    override suspend fun updateLanguage(language: String) = updateLanguage
}

class FakeBadgesRepository(var badges: Result<List<EarnedBadge>>) : BadgesRepository {
    override suspend fun getMyBadges() = badges
}
