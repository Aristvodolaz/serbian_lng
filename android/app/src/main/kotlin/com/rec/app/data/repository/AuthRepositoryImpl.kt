package com.rec.app.data.repository

import com.rec.app.data.local.TokenStore
import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.AuthResponse
import com.rec.app.data.remote.dto.LoginRequest
import com.rec.app.data.remote.dto.RegisterRequest
import com.rec.app.domain.model.AuthException
import com.rec.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import retrofit2.HttpException

class AuthRepositoryImpl(
    private val api: RecApi,
    private val tokenStore: TokenStore,
    private val onSessionChanged: () -> Unit = {},
) : AuthRepository {
    override val isLoggedIn: Flow<Boolean> = tokenStore.accessToken.map { it != null }.distinctUntilChanged()

    override suspend fun register(
        email: String,
        password: String,
        displayName: String,
        scriptPreference: String,
        languagePreference: String,
    ): Result<Unit> = apiCall {
        save(api.register(RegisterRequest(email, password, displayName, scriptPreference, languagePreference)))
    }.mapFailure()

    override suspend fun login(email: String, password: String): Result<Unit> = apiCall {
        save(api.login(LoginRequest(email, password)))
    }.mapFailure()

    override suspend fun logout() {
        onSessionChanged()
        tokenStore.clear()
    }

    private suspend fun save(response: AuthResponse) {
        onSessionChanged()
        tokenStore.save(response.accessToken, response.refreshToken)
    }

    private fun <T> Result<T>.mapFailure(): Result<T> = recoverCatching { throw it.toAuthException() }

    private fun Throwable.toAuthException(): AuthException = when {
        this is HttpException && code() == 401 -> AuthException.InvalidCredentials
        this is HttpException && code() == 409 -> AuthException.EmailTaken
        this is HttpException -> AuthException.Server(code())
        else -> AuthException.Network
    }
}
