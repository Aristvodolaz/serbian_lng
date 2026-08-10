package com.rec.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore(name = "rec_auth")

/**
 * Holds the JWT pair on disk. OkHttp's Interceptor/Authenticator run
 * synchronously on a background thread and can't suspend, so they use the
 * `*Blocking` variants (a plain `runBlocking` around the DataStore read —
 * safe here since it's already off the main thread). Everywhere else
 * (repositories, ViewModels) use the suspend/Flow accessors instead.
 */
class TokenStore(private val context: Context) {
    private val accessKey = stringPreferencesKey("access_token")
    private val refreshKey = stringPreferencesKey("refresh_token")

    val accessToken: Flow<String?> = context.dataStore.data.map { it[accessKey] }
    val refreshToken: Flow<String?> = context.dataStore.data.map { it[refreshKey] }

    suspend fun save(accessToken: String, refreshToken: String) {
        context.dataStore.edit {
            it[accessKey] = accessToken
            it[refreshKey] = refreshToken
        }
    }

    suspend fun clear() {
        context.dataStore.edit {
            it.remove(accessKey)
            it.remove(refreshKey)
        }
    }

    fun accessTokenBlocking(): String? = runBlocking { accessToken.first() }
    fun refreshTokenBlocking(): String? = runBlocking { refreshToken.first() }
    fun saveBlocking(accessToken: String, refreshToken: String) = runBlocking { save(accessToken, refreshToken) }
    fun clearBlocking() = runBlocking { clear() }
}
