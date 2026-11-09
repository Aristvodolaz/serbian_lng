package com.rec.app.di

import android.content.Context
import com.rec.app.data.local.TokenStore
import com.rec.app.data.remote.RecApiClient
import com.rec.app.data.repository.AuthRepositoryImpl
import com.rec.app.data.repository.BadgesRepositoryImpl
import com.rec.app.data.repository.ContentRepositoryImpl
import com.rec.app.data.repository.UserRepositoryImpl
import com.rec.app.data.repository.VocabularyRepositoryImpl
import com.rec.app.domain.repository.AuthRepository
import com.rec.app.domain.repository.BadgesRepository
import com.rec.app.domain.repository.ContentRepository
import com.rec.app.domain.repository.UserRepository
import com.rec.app.domain.repository.VocabularyRepository

/**
 * Hand-rolled service locator — deliberately not Hilt/Koin. At this app's
 * size (a handful of repositories, no multi-module graph) a DI framework
 * would add annotation-processor setup risk for no real benefit.
 *
 * Properties are typed as domain interfaces, so ViewModels never see the
 * Retrofit-backed implementations.
 */
class AppContainer(context: Context) {
    val tokenStore = TokenStore(context.applicationContext)
    private val api = RecApiClient.create(tokenStore)

    val authRepository: AuthRepository = AuthRepositoryImpl(api, tokenStore)
    val userRepository: UserRepository = UserRepositoryImpl(api)
    val contentRepository: ContentRepository = ContentRepositoryImpl(api)
    val vocabularyRepository: VocabularyRepository = VocabularyRepositoryImpl(api)
    val badgesRepository: BadgesRepository = BadgesRepositoryImpl(api)
}
