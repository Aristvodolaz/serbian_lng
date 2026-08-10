package com.rec.app.data.remote

import com.rec.app.data.local.TokenStore
import com.rec.app.data.remote.dto.AuthResponse
import com.rec.app.data.remote.dto.RefreshRequest
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route

/**
 * On a 401, refreshes the token pair once and retries the original request.
 * Uses a bare OkHttpClient (no interceptor/authenticator of its own) for the
 * refresh call itself, so a failed refresh can't recurse back into this class.
 */
class TokenAuthenticator(
    private val baseUrl: String,
    private val tokenStore: TokenStore,
    private val json: Json,
) : Authenticator {
    private val plainClient = OkHttpClient()

    override fun authenticate(route: Route?, response: Response): Request? {
        val path = response.request.url.encodedPath
        if (path.endsWith("auth/refresh") || path.endsWith("auth/login") || path.endsWith("auth/register")) return null
        if (responseCount(response) >= 2) return null // already retried once — give up

        val refreshToken = tokenStore.refreshTokenBlocking() ?: return null

        val body = json.encodeToString(RefreshRequest(refreshToken))
            .toRequestBody("application/json".toMediaType())
        val refreshRequest = Request.Builder()
            .url(baseUrl.trimEnd('/') + "/auth/refresh")
            .post(body)
            .build()

        return try {
            plainClient.newCall(refreshRequest).execute().use { refreshResponse ->
                if (!refreshResponse.isSuccessful) {
                    tokenStore.clearBlocking()
                    return null
                }
                val text = refreshResponse.body?.string() ?: return null
                val auth = json.decodeFromString(AuthResponse.serializer(), text)
                tokenStore.saveBlocking(auth.accessToken, auth.refreshToken)
                response.request.newBuilder().header("Authorization", "Bearer ${auth.accessToken}").build()
            }
        } catch (e: Exception) {
            tokenStore.clearBlocking()
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}
