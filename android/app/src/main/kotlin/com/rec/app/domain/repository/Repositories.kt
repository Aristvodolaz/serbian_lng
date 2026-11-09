package com.rec.app.domain.repository

import com.rec.app.domain.model.CompletedLesson
import com.rec.app.domain.model.DayActivity
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.model.Lesson
import com.rec.app.domain.model.LessonResult
import com.rec.app.domain.model.Path
import com.rec.app.domain.model.ReviewCard
import com.rec.app.domain.model.ReviewOutcome
import com.rec.app.domain.model.User
import com.rec.app.domain.model.UserStats
import com.rec.app.domain.model.WordAttributes
import com.rec.app.domain.model.WordPage
import kotlinx.coroutines.flow.Flow

// Contracts the presentation layer depends on. Implementations live in the data layer.

interface ContentRepository {
    suspend fun getPath(): Result<Path>

    /** Fails with [com.rec.app.domain.model.SectionLockedException] when the lesson's section is locked. */
    suspend fun getLesson(lessonId: String): Result<Lesson>

    suspend fun answerExercise(lessonId: String, exerciseId: String, answerId: String): Result<LessonResult>

    suspend fun completeLesson(lessonId: String, correctCount: Int, totalCount: Int): Result<CompletedLesson>
}

interface UserRepository {
    suspend fun getMe(): Result<User>
    suspend fun getStats(): Result<UserStats>
    suspend fun getWeek(): Result<List<DayActivity>>
    suspend fun updateLanguage(language: String): Result<User>
}

interface VocabularyRepository {
    suspend fun getReviewQueue(limit: Int = 20): Result<List<ReviewCard>>

    suspend fun submitReview(wordId: String, result: String): Result<ReviewOutcome>

    /** Published dictionary words; [search] is a substring match, blank means no filter. */
    suspend fun getWords(search: String?, offset: Int): Result<WordPage>

    suspend fun getWordAttributes(): Result<WordAttributes>
}

interface BadgesRepository {
    suspend fun getMyBadges(): Result<List<EarnedBadge>>
}

interface AuthRepository {
    /** True while a session token is stored. */
    val isLoggedIn: Flow<Boolean>

    suspend fun register(
        email: String,
        password: String,
        displayName: String,
        scriptPreference: String,
        languagePreference: String,
    ): Result<Unit>

    suspend fun login(email: String, password: String): Result<Unit>

    suspend fun logout()
}
