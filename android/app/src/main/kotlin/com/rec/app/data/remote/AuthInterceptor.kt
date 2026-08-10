package com.rec.app.data.remote

import com.rec.app.data.local.TokenStore
import okhttp3.Interceptor
import okhttp3.Response

private val PUBLIC_PATHS = listOf("auth/register", "auth/login", "auth/refresh")

class AuthInterceptor(private val tokenStore: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val isPublic = PUBLIC_PATHS.any { request.url.encodedPath.endsWith(it) }
        if (isPublic) return chain.proceed(request)

        val token = tokenStore.accessTokenBlocking() ?: return chain.proceed(request)
        val authed = request.newBuilder().header("Authorization", "Bearer $token").build()
        return chain.proceed(authed)
    }
}
