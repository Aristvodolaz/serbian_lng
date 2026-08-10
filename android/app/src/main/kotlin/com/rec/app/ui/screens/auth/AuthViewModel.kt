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

enum class AuthMode { LOGIN, REGISTER }
enum class RegisterStep { CREDENTIALS, SCRIPT }

data class AuthFormState(
    val mode: AuthMode = AuthMode.LOGIN,
    val step: RegisterStep = RegisterStep.CREDENTIALS,
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

    fun setMode(mode: AuthMode) = _state.update { it.copy(mode = mode, step = RegisterStep.CREDENTIALS, error = null) }
    fun updateEmail(value: String) = _state.update { it.copy(email = value, error = null) }
    fun updatePassword(value: String) = _state.update { it.copy(password = value, error = null) }
    fun updateDisplayName(value: String) = _state.update { it.copy(displayName = value, error = null) }
    fun updateScriptPreference(value: String) = _state.update { it.copy(scriptPreference = value) }
    fun backToCredentials() = _state.update { it.copy(step = RegisterStep.CREDENTIALS) }

    fun proceedToScriptStep() {
        val s = _state.value
        if (s.email.isBlank() || s.password.length < 8 || s.displayName.isBlank()) {
            _state.update { it.copy(error = "Заполните email, имя и пароль (минимум 8 символов)") }
            return
        }
        _state.update { it.copy(step = RegisterStep.SCRIPT, error = null) }
    }

    fun submitLogin() {
        val s = _state.value
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            authRepository.login(s.email, s.password)
                .onFailure { _state.update { form -> form.copy(isLoading = false, error = mapError(it)) } }
                .onSuccess { _state.update { form -> form.copy(isLoading = false) } }
        }
    }

    fun submitRegister() {
        val s = _state.value
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            authRepository.register(s.email, s.password, s.displayName, s.scriptPreference)
                .onFailure { _state.update { form -> form.copy(isLoading = false, error = mapError(it)) } }
                .onSuccess { _state.update { form -> form.copy(isLoading = false) } }
        }
    }

    private fun mapError(t: Throwable): String = when {
        t is HttpException && t.code() == 401 -> "Неверный email или пароль"
        t is HttpException && t.code() == 409 -> "Такой email уже зарегистрирован"
        t is HttpException -> "Ошибка сервера (${t.code()})"
        else -> "Не удалось подключиться. Проверьте соединение."
    }
}
