package com.rec.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rec.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import retrofit2.HttpException

enum class AuthStage { WELCOME, LOGIN, SCRIPT, CREDENTIALS }

data class AuthFormState(
    val stage: AuthStage = AuthStage.WELCOME,
    val email: String = "",
    val password: String = "",
    val displayName: String = "",
    val scriptPreference: String = "both",
    val isLoading: Boolean = false,
    val error: String? = null,
)

class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(AuthFormState())
    val state: StateFlow<AuthFormState> = _state.asStateFlow()

    fun goToLogin() = _state.update { it.copy(stage = AuthStage.LOGIN, error = null) }
    fun goToRegister() = _state.update { it.copy(stage = AuthStage.SCRIPT, error = null) }
    fun backToWelcome() = _state.update { it.copy(stage = AuthStage.WELCOME, error = null) }
    fun backToScript() = _state.update { it.copy(stage = AuthStage.SCRIPT, error = null) }

    fun updateEmail(value: String) = _state.update { it.copy(email = value, error = null) }
    fun updatePassword(value: String) = _state.update { it.copy(password = value, error = null) }
    fun updateDisplayName(value: String) = _state.update { it.copy(displayName = value, error = null) }
    fun updateScriptPreference(value: String) = _state.update { it.copy(scriptPreference = value) }

    fun proceedToCredentials() = _state.update { it.copy(stage = AuthStage.CREDENTIALS, error = null) }

    fun submitLogin() {
        val s = _state.value
        if (s.email.isBlank() || s.password.isBlank()) {
            _state.update { it.copy(error = "Унесите имејл и лозинку.") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            authRepository.login(s.email, s.password)
                .onFailure { _state.update { form -> form.copy(isLoading = false, error = mapError(it)) } }
                .onSuccess { _state.update { form -> form.copy(isLoading = false) } }
        }
    }

    fun submitRegister() {
        val s = _state.value
        if (s.displayName.isBlank() || s.email.isBlank() || s.password.length < 8) {
            _state.update { it.copy(error = "Попуните име, имејл и лозинку (најмање 8 знакова).") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            authRepository.register(s.email, s.password, s.displayName, s.scriptPreference)
                .onFailure { _state.update { form -> form.copy(isLoading = false, error = mapError(it)) } }
                .onSuccess { _state.update { form -> form.copy(isLoading = false) } }
        }
    }

    private fun mapError(t: Throwable): String = when {
        t is HttpException && t.code() == 401 -> "Погрешан имејл или лозинка."
        t is HttpException && t.code() == 409 -> "Овај имејл је већ регистрован."
        t is HttpException -> "Грешка на серверу (${t.code()})."
        else -> "Веза није успела. Проверите интернет."
    }
}
