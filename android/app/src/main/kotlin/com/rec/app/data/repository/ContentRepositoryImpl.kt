package com.rec.app.data.repository

import com.rec.app.data.mapper.toDomain
import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.AnswerExerciseRequest
import com.rec.app.data.remote.dto.CompleteLessonRequest
import com.rec.app.domain.model.CompletedLesson
import com.rec.app.domain.model.Lesson
import com.rec.app.domain.model.LessonResult
import com.rec.app.domain.model.Path
import com.rec.app.domain.model.SectionLockedException
import com.rec.app.domain.repository.ContentRepository
import retrofit2.HttpException

class ContentRepositoryImpl(private val api: RecApi) : ContentRepository {
    override suspend fun getPath(): Result<Path> = runCatching { api.getPath().toDomain() }

    override suspend fun getLesson(lessonId: String): Result<Lesson> =
        runCatching { api.getLesson(lessonId).toDomain() }
            .recoverCatching { if (it.isSectionLocked()) throw SectionLockedException() else throw it }

    override suspend fun answerExercise(lessonId: String, exerciseId: String, answerId: String): Result<LessonResult> =
        runCatching { api.answerExercise(lessonId, exerciseId, AnswerExerciseRequest(answerId)).toDomain() }

    override suspend fun completeLesson(lessonId: String, correctCount: Int, totalCount: Int): Result<CompletedLesson> =
        runCatching { api.completeLesson(lessonId, CompleteLessonRequest(correctCount, totalCount)).toDomain() }
}

/** The backend answers a lesson in a locked section with 403 and the message SECTION_LOCKED. */
private fun Throwable.isSectionLocked(): Boolean =
    this is HttpException && code() == 403 && response()?.errorBody()?.string()?.contains("SECTION_LOCKED") == true
