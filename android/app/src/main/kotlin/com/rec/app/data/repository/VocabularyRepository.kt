package com.rec.app.data.repository

import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.ReviewWordResponse
import com.rec.app.data.remote.dto.SubmitReviewRequest
import com.rec.app.data.remote.dto.SubmitReviewResponse
import com.rec.app.data.remote.dto.WordAttributesDto
import com.rec.app.data.remote.dto.WordsResponse

class VocabularyRepository(private val api: RecApi) {
    suspend fun getReviewQueue(limit: Int = 20): Result<List<ReviewWordResponse>> =
        runCatching { api.getReviewQueue(limit) }

    suspend fun submitReview(wordId: String, result: String): Result<SubmitReviewResponse> =
        runCatching { api.submitReview(wordId, SubmitReviewRequest(result)) }

    /** Published dictionary words; [search] is a substring match, blank means no filter. */
    suspend fun getWords(search: String?, offset: Int): Result<WordsResponse> =
        runCatching { api.getWords(search?.takeIf { it.isNotBlank() }, PAGE_SIZE, offset) }

    suspend fun getWordAttributes(): Result<WordAttributesDto> = runCatching { api.getWordAttributes() }

    companion object {
        const val PAGE_SIZE = 50
    }
}
