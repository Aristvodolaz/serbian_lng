package com.rec.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore(name = "rec_auth")

/**
 * Holds the session on disk: the JWT pair and the signed-in user's interface
 * language (kept here so the app starts in the right language before any
 * request returns). OkHttp's Interceptor/Authenticator run synchronously on a
 * background thread and can't suspend, so they use the `*Blocking` variants;
 * everything else uses the suspend/Flow accessors.
 */
class TokenStore(private val context: Context) {
    private val accessKey = stringPreferencesKey("access_token")
    private val refreshKey = stringPreferencesKey("refresh_token")
    private val languageKey = stringPreferencesKey("interface_language")

    val accessToken: Flow<String?> = context.dataStore.data.map { it[accessKey] }
    val refreshToken: Flow<String?> = context.dataStore.data.map { it[refreshKey] }
    val language: Flow<String?> = context.dataStore.data.map { it[languageKey] }.distinctUntilChanged()

    suspend fun save(accessToken: String, refreshToken: String) {
        context.dataStore.edit {
            it[accessKey] = accessToken
            it[refreshKey] = refreshToken
        }
    }

    suspend fun saveLanguage(language: String) {
        context.dataStore.edit { it[languageKey] = language }
    }

    /** Ends the session: tokens and the language go together, so the sign-in screens follow the system again. */
    suspend fun clear() {
        context.dataStore.edit {
            it.remove(accessKey)
            it.remove(refreshKey)
            it.remove(languageKey)
        }
    }

    fun accessTokenBlocking(): String? = runBlocking { accessToken.first() }
    fun refreshTokenBlocking(): String? = runBlocking { refreshToken.first() }
    fun saveBlocking(accessToken: String, refreshToken: String) = runBlocking { save(accessToken, refreshToken) }
    fun clearBlocking() = runBlocking { clear() }
}
