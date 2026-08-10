package com.rec.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ReviewWordResponse(
    val wordId: String,
    val cyrillic: String,
    val latin: String,
    val translation: String,
    val exampleCyrillic: String? = null,
    val exampleTranslation: String? = null,
    val audioUrl: String? = null,
    /** "learning" | "known" */
    val status: String,
)

@Serializable
data class SubmitReviewRequest(val result: String)

@Serializable
data class SubmitReviewResponse(
    val status: String,
    val nextReviewAt: String,
    val newBadges: List<EarnedBadgeDto>,
)
