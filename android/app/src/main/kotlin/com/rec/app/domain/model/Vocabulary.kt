package com.rec.app.domain.model

/** A word due for review in the flashcard queue. */
data class ReviewCard(
    val wordId: String,
    val cyrillic: String,
    val latin: String,
    val translation: String,
    val exampleCyrillic: String?,
    val exampleTranslation: String?,
)

data class ReviewOutcome(val newBadges: List<EarnedBadge>)

data class Word(
    val id: String,
    val cyrillic: String,
    val latin: String,
    val translationRu: String,
    val translationEn: String,
    val exampleCyrillic: String?,
    val exampleTranslationRu: String?,
    val exampleTranslationEn: String?,
    /** Grammar codes; resolved to labels through [WordAttributes]. */
    val partOfSpeech: String?,
    val gender: String?,
    val number: String?,
    val declension: String?,
    val conjugation: String?,
)

data class WordPage(val items: List<Word>, val total: Int)

data class AttributeOption(val value: String, val ru: String, val en: String)

data class WordAttributes(
    val partOfSpeech: List<AttributeOption>,
    val gender: List<AttributeOption>,
    val number: List<AttributeOption>,
    val declension: List<AttributeOption>,
    val conjugation: List<AttributeOption>,
)
