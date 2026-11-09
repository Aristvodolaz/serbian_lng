package com.rec.app.data.remote.dto

import kotlinx.serialization.Serializable

/** Mirrors the backend's `WordPublicDto`. Grammar attributes are stored as codes, resolved via [WordAttributesDto]. */
@Serializable
data class WordDto(
    val id: String,
    val cyrillic: String,
    val latin: String,
    val translationRu: String,
    val translationEn: String,
    val exampleCyrillic: String? = null,
    val exampleTranslationRu: String? = null,
    val exampleTranslationEn: String? = null,
    val audioUrl: String? = null,
    val partOfSpeech: String? = null,
    val gender: String? = null,
    val number: String? = null,
    val declension: String? = null,
    val conjugation: String? = null,
    val imageUrl: String? = null,
)

@Serializable
data class WordsResponse(val items: List<WordDto>, val total: Int)

@Serializable
data class WordAttributeOptionDto(val value: String, val ru: String, val en: String)

@Serializable
data class WordAttributesDto(
    val partOfSpeech: List<WordAttributeOptionDto> = emptyList(),
    val gender: List<WordAttributeOptionDto> = emptyList(),
    val number: List<WordAttributeOptionDto> = emptyList(),
    val declension: List<WordAttributeOptionDto> = emptyList(),
    val conjugation: List<WordAttributeOptionDto> = emptyList(),
)
