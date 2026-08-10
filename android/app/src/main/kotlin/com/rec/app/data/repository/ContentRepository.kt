package com.rec.app.data.repository

import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.AnswerExerciseRequest
import com.rec.app.data.remote.dto.AnswerResultResponse
import com.rec.app.data.remote.dto.CompleteLessonRequest
import com.rec.app.data.remote.dto.CompleteLessonResponse
import com.rec.app.data.remote.dto.LessonDetailResponse
import com.rec.app.data.remote.dto.PathResponse

class ContentRepository(private val api: RecApi) {
    suspend fun getPath(): Result<PathResponse> = runCatching { api.getPath() }

    suspend fun getLesson(lessonId: String): Result<LessonDetailResponse> =
        runCatching { api.getLesson(lessonId) }

    suspend fun answerExercise(lessonId: String, exerciseId: String, choiceId: String): Result<AnswerResultResponse> =
        runCatching { api.answerExercise(lessonId, exerciseId, AnswerExerciseRequest(choiceId)) }

    suspend fun completeLesson(lessonId: String, correctCount: Int, totalCount: Int): Result<CompleteLessonResponse> =
        runCatching { api.completeLesson(lessonId, CompleteLessonRequest(correctCount, totalCount)) }
}
