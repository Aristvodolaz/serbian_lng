package com.rec.app.di

import android.content.Context
import com.rec.app.data.local.TokenStore
import com.rec.app.data.remote.RecApiClient
import com.rec.app.data.repository.AuthRepository
import com.rec.app.data.repository.BadgesRepository
import com.rec.app.data.repository.ContentRepository
import com.rec.app.data.repository.UserRepository
import com.rec.app.data.repository.VocabularyRepository

/**
 * Hand-rolled service locator — deliberately not Hilt/Koin. At this app's
 * size (a handful of repositories, no multi-module graph) a DI framework
 * would add annotation-processor setup risk for no real benefit.
 */
class AppContainer(context: Context) {
    val tokenStore = TokenStore(context.applicationContext)
    private val api = RecApiClient.create(tokenStore)

    val authRepository = AuthRepository(api, tokenStore)
    val userRepository = UserRepository(api)
    val contentRepository = ContentRepository(api)
    val vocabularyRepository = VocabularyRepository(api)
    val badgesRepository = BadgesRepository(api)
}
