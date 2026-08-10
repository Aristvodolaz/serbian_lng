package com.rec.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class BadgeDto(
    val id: String,
    val code: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val description: String,
)

@Serializable
data class EarnedBadgeDto(
    val id: String,
    val code: String,
    val titleCyrillic: String,
    val titleLatin: String,
    val description: String,
    val earnedAt: String,
)
