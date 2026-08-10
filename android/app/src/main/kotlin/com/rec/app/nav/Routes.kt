package com.rec.app.nav

object Routes {
    const val HOME = "home"
    const val VOCABULARY = "vocabulary"
    const val PROFILE = "profile"
    const val LESSON = "lesson/{lessonId}"

    fun lesson(lessonId: String) = "lesson/$lessonId"
}
