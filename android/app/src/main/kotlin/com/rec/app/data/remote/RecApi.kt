package com.rec.app.data.remote

import com.rec.app.data.remote.dto.*
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface RecApi {
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthResponse

    @GET("users/me")
    suspend fun getMe(): UserDto

    @PATCH("users/me")
    suspend fun updateMe(@Body body: UpdateUserRequest): UserDto

    @GET("users/me/stats")
    suspend fun getMyStats(): UserStatsResponse

    @GET("users/me/week")
    suspend fun getMyWeek(): WeekActivityResponse

    @GET("units")
    suspend fun getPath(): PathResponse

    @GET("lessons/{lessonId}")
    suspend fun getLesson(@Path("lessonId") lessonId: String): LessonDetailResponse

    @POST("lessons/{lessonId}/exercises/{exerciseId}/answer")
    suspend fun answerExercise(
        @Path("lessonId") lessonId: String,
        @Path("exerciseId") exerciseId: String,
        @Body body: AnswerExerciseRequest,
    ): AnswerResultResponse

    @POST("lessons/{lessonId}/complete")
    suspend fun completeLesson(
        @Path("lessonId") lessonId: String,
        @Body body: CompleteLessonRequest,
    ): CompleteLessonResponse

    @GET("vocabulary/review")
    suspend fun getReviewQueue(@Query("limit") limit: Int = 20): List<ReviewWordResponse>

    @POST("vocabulary/{wordId}/review")
    suspend fun submitReview(
        @Path("wordId") wordId: String,
        @Body body: SubmitReviewRequest,
    ): SubmitReviewResponse

    @GET("badges")
    suspend fun getBadgeCatalog(): List<BadgeDto>

    @GET("badges/me")
    suspend fun getMyBadges(): List<EarnedBadgeDto>
}
