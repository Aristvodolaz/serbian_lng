package com.rec.app.nav

object Routes {
    const val HOME = "home"
    const val VOCABULARY = "vocabulary"
    const val PROFILE = "profile"
    const val FLASHCARDS = "flashcards"

    const val LESSON_ID_ARG = "lessonId"
    const val LESSON = "lesson/{$LESSON_ID_ARG}"

    fun lesson(lessonId: String) = "lesson/$lessonId"
}
