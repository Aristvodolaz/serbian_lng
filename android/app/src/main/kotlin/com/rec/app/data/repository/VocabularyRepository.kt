package com.rec.app.data.repository

import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.ReviewWordResponse
import com.rec.app.data.remote.dto.SubmitReviewRequest
import com.rec.app.data.remote.dto.SubmitReviewResponse

class VocabularyRepository(private val api: RecApi) {
    suspend fun getReviewQueue(limit: Int = 20): Result<List<ReviewWordResponse>> =
        runCatching { api.getReviewQueue(limit) }

    suspend fun submitReview(wordId: String, result: String): Result<SubmitReviewResponse> =
        runCatching { api.submitReview(wordId, SubmitReviewRequest(result)) }
}
