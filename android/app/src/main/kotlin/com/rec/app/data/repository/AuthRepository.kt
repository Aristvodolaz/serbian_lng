package com.rec.app.data.repository

import com.rec.app.data.local.TokenStore
import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.AuthResponse
import com.rec.app.data.remote.dto.LoginRequest
import com.rec.app.data.remote.dto.RegisterRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class AuthRepository(
    private val api: RecApi,
    private val tokenStore: TokenStore,
) {
    val isLoggedIn: Flow<Boolean> = tokenStore.accessToken.map { it != null }

    suspend fun register(
        email: String,
        password: String,
        displayName: String,
        scriptPreference: String,
    ): Result<AuthResponse> = runCatching {
        val response = api.register(RegisterRequest(email, password, displayName, scriptPreference))
        tokenStore.save(response.accessToken, response.refreshToken)
        response
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> = runCatching {
        val response = api.login(LoginRequest(email, password))
        tokenStore.save(response.accessToken, response.refreshToken)
        response
    }

    suspend fun logout() {
        tokenStore.clear()
    }
}
