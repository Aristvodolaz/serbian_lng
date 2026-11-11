package com.rec.app.data.repository

import com.rec.app.data.mapper.toDomain
import com.rec.app.data.mapper.toOutcome
import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.SubmitReviewRequest
import com.rec.app.domain.model.ReviewCard
import com.rec.app.domain.model.ReviewOutcome
import com.rec.app.domain.model.WordAttributes
import com.rec.app.domain.model.WordPage
import com.rec.app.domain.repository.VocabularyRepository

class VocabularyRepositoryImpl(private val api: RecApi) : VocabularyRepository {
    override suspend fun getReviewQueue(limit: Int): Result<List<ReviewCard>> =
        apiCall { api.getReviewQueue(limit).map { it.toDomain() } }

    override suspend fun submitReview(wordId: String, result: String): Result<ReviewOutcome> =
        apiCall { api.submitReview(wordId, SubmitReviewRequest(result)).toOutcome() }

    override suspend fun getWords(search: String?, offset: Int): Result<WordPage> =
        apiCall { api.getWords(search?.takeIf { it.isNotBlank() }, PAGE_SIZE, offset).toDomain() }

    override suspend fun getWordAttributes(): Result<WordAttributes> =
        apiCall { api.getWordAttributes().toDomain() }

    companion object {
        const val PAGE_SIZE = 50
    }
}
