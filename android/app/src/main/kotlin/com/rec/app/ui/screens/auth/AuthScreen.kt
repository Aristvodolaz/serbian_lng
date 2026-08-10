package com.rec.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.ScriptCard
import com.rec.app.ui.theme.RecTheme

@Composable
fun AuthScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
        if (state.mode == AuthMode.REGISTER && state.step == RegisterStep.SCRIPT) {
            ScriptPickerStep(state, viewModel)
        } else {
            CredentialsStep(state, viewModel)
        }
    }
}

@Composable
private fun CredentialsStep(state: AuthFormState, viewModel: AuthViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.radialGradient(
                        colors = listOf(RecTheme.colors.indigoSoft, RecTheme.colors.indigo, RecTheme.colors.ink),
                    ),
                )
                .padding(top = 64.dp, bottom = 40.dp, start = 24.dp, end = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "РЕЧ",
                style = MaterialTheme.typography.displayLarge,
                color = RecTheme.colors.cream,
            )
            Text(
                "REČ",
                style = MaterialTheme.typography.titleLarge,
                fontStyle = FontStyle.Italic,
                color = RecTheme.colors.ochre,
            )
            Spacer(Modifier.height(14.dp))
            Text(
                "Учите српски, реч по реч.",
                style = MaterialTheme.typography.bodyLarge,
                color = RecTheme.colors.cream,
                textAlign = TextAlign.Center,
            )
            Text(
                "Learn Serbian, word by word.",
                style = MaterialTheme.typography.bodySmall,
                fontStyle = FontStyle.Italic,
                color = RecTheme.colors.cream.copy(alpha = 0.75f),
            )
        }

        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (state.mode == AuthMode.REGISTER) {
                OutlinedTextField(
                    value = state.displayName,
                    onValueChange = viewModel::updateDisplayName,
                    label = { Text("Имя") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            OutlinedTextField(
                value = state.email,
                onValueChange = viewModel::updateEmail,
                label = { Text("Email") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.password,
                onValueChange = viewModel::updatePassword,
                label = { Text("Пароль") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
            )

            state.error?.let {
                Text(it, color = RecTheme.colors.oxblood, style = MaterialTheme.typography.bodySmall)
            }

            if (state.isLoading) {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = RecTheme.colors.indigo)
                }
            } else {
                RecPrimaryButton(
                    text = if (state.mode == AuthMode.LOGIN) "Войти" else "Настави",
                    onClick = {
                        if (state.mode == AuthMode.LOGIN) viewModel.submitLogin() else viewModel.proceedToScriptStep()
                    },
                )
            }

            TextButton(
                onClick = { viewModel.setMode(if (state.mode == AuthMode.LOGIN) AuthMode.REGISTER else AuthMode.LOGIN) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    if (state.mode == AuthMode.LOGIN) "Нет аккаунта? Регистрация" else "Уже есть аккаунт? Войти",
                    color = RecTheme.colors.inkSoft,
                )
            }
        }
    }
}

@Composable
private fun ScriptPickerStep(state: AuthFormState, viewModel: AuthViewModel) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        IconButton(onClick = viewModel::backToCredentials) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = RecTheme.colors.ink)
        }

        Spacer(Modifier.height(8.dp))
        Text("Изаберите писмо", style = MaterialTheme.typography.headlineSmall, color = RecTheme.colors.ink)
        Text(
            "Choose your script",
            style = MaterialTheme.typography.bodyMedium,
            color = RecTheme.colors.inkSoft,
        )

        Spacer(Modifier.height(20.dp))
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            ScriptCard(
                label = "Ћирилица",
                sample = "Здраво, како си?",
                selected = state.scriptPreference == "cyrillic",
                onClick = { viewModel.updateScriptPreference("cyrillic") },
            )
            ScriptCard(
                label = "Latinica",
                sample = "Zdravo, kako si?",
                selected = state.scriptPreference == "latin",
                onClick = { viewModel.updateScriptPreference("latin") },
            )
            ScriptCard(
                label = "Оба писма",
                sample = "Здраво / Zdravo",
                selected = state.scriptPreference == "both",
                onClick = { viewModel.updateScriptPreference("both") },
            )
        }

        Spacer(Modifier.weight(1f))

        state.error?.let {
            Text(it, color = RecTheme.colors.oxblood, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 8.dp))
        }

        if (state.isLoading) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = RecTheme.colors.indigo)
            }
        } else {
            RecPrimaryButton(text = "Настави", onClick = viewModel::submitRegister)
        }
    }
}
