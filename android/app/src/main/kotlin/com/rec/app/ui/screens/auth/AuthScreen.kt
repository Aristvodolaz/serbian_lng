package com.rec.app.ui.screens.auth

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.ui.components.PageDots
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.RecGhostButton
import com.rec.app.ui.components.RecTextField
import com.rec.app.ui.components.ScriptCard
import com.rec.app.ui.components.ScriptSummaryChip
import com.rec.app.ui.components.WeaveDots
import com.rec.app.ui.theme.RecPalette
import com.rec.app.ui.theme.RecTheme

// The whole onboarding/auth flow is a fixed-dark "moment" independent of the
// system theme — mirrors the web mockup's hero band, which stays on the
// indigo palette in both light and dark mode rather than following --ground.
@Composable
fun AuthScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()

    // Without this, the OS back button quits the app from any onboarding step
    // instead of stepping back one stage — there's no Navigation-Compose
    // backstack here, this is the only thing that would otherwise intercept it.
    BackHandler(enabled = state.stage != AuthStage.WELCOME) {
        when (state.stage) {
            AuthStage.CREDENTIALS -> viewModel.backToScript()
            AuthStage.SCRIPT, AuthStage.LOGIN -> viewModel.backToWelcome()
            AuthStage.WELCOME -> Unit
        }
    }

    RecTheme(darkTheme = true) {
        Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
            when (state.stage) {
                AuthStage.WELCOME -> WelcomeStep(viewModel)
                AuthStage.LOGIN -> LoginStep(state, viewModel)
                AuthStage.SCRIPT -> ScriptStep(state, viewModel)
                AuthStage.CREDENTIALS -> CredentialsStep(state, viewModel)
            }
        }
    }
}

@Composable
private fun WelcomeStep(viewModel: AuthViewModel) {
    val colors = RecTheme.colors
    // Background bleeds full-screen behind the system bars (edge-to-edge is
    // on — see MainActivity.enableEdgeToEdge); only the *content* column is
    // pushed clear of them, via real measured inset padding rather than a
    // guessed fixed dp value that only happens to clear this one device.
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(colors.indigoSoft, colors.indigo, Color(0xFF101728)),
                ),
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(top = 32.dp, bottom = 24.dp, start = 28.dp, end = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
        Text(
            "УЧИТЕ СРПСКИ · РЕЧ ПО РЕЧ",
            style = MaterialTheme.typography.labelMedium,
            color = colors.ochre,
        )
        Spacer(Modifier.height(18.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            Text("РЕЧ", style = MaterialTheme.typography.displayLarge, color = colors.cream)
            Spacer(Modifier.height(0.dp).padding(horizontal = 4.dp))
            Text(
                "REČ",
                style = MaterialTheme.typography.titleLarge,
                fontStyle = FontStyle.Italic,
                color = colors.ochre,
                modifier = Modifier.padding(start = 8.dp, bottom = 6.dp),
            )
        }
        Spacer(Modifier.height(14.dp))
        Text(
            "Учите српски, реч по реч.",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.cream,
            textAlign = TextAlign.Center,
        )
        Text(
            "Learn Serbian, word by word.",
            style = MaterialTheme.typography.bodySmall,
            fontStyle = FontStyle.Italic,
            color = Color(0xFFB7C4DD),
        )
        Spacer(Modifier.height(20.dp))
        WeaveDots(count = 7, color = colors.ochre.copy(alpha = 0.55f))

        Spacer(Modifier.weight(1f))

        Text(
            "Оба писма стоје једно уз друго — ћирилица и латиница се уче заједно, а не одвојено.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.cream.copy(alpha = 0.85f),
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(22.dp))
        RecPrimaryButton(
            text = "Почни",
            onClick = viewModel::goToRegister,
            containerColor = colors.cream,
            contentColor = RecPalette.DarkGround,
        )
        Spacer(Modifier.height(10.dp))
        RecGhostButton(
            text = "Већ имам налог",
            onClick = viewModel::goToLogin,
            borderColor = colors.cream.copy(alpha = 0.4f),
            contentColor = colors.cream,
        )
        }
    }
}

@Composable
private fun LoginStep(state: AuthFormState, viewModel: AuthViewModel) {
    val colors = RecTheme.colors
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
    ) {
        IconButton(onClick = viewModel::backToWelcome) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = colors.ink)
        }
        Spacer(Modifier.height(16.dp))
        Text("Пријавите се", style = MaterialTheme.typography.headlineSmall, color = colors.ink)
        Text(
            "Наставите тамо где сте стали.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.inkSoft,
        )
        Spacer(Modifier.height(24.dp))

        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            fieldColors(colors).let { fc ->
                RecTextField(
                    label = "Е-пошта",
                    value = state.email,
                    onValueChange = viewModel::updateEmail,
                    placeholder = "milica@example.com",
                    keyboardType = KeyboardType.Email,
                    fieldColor = fc.field,
                    labelColor = fc.label,
                    textColor = fc.text,
                    placeholderColor = fc.placeholder,
                )
                RecTextField(
                    label = "Лозинка",
                    value = state.password,
                    onValueChange = viewModel::updatePassword,
                    isPassword = true,
                    keyboardType = KeyboardType.Password,
                    fieldColor = fc.field,
                    labelColor = fc.label,
                    textColor = fc.text,
                    placeholderColor = fc.placeholder,
                )
            }

            state.error?.let {
                Text(it, color = colors.oxblood, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.height(4.dp))
            if (state.isLoading) {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = colors.indigo)
                }
            } else {
                RecPrimaryButton(
                    text = "Пријави се",
                    onClick = viewModel::submitLogin,
                    enabled = state.email.isNotBlank() && state.password.isNotBlank(),
                )
            }

            TextButton(onClick = viewModel::goToRegister, modifier = Modifier.fillMaxWidth()) {
                Text("Немате налог? Направите га", color = colors.inkSoft)
            }
        }
    }
}

@Composable
private fun ScriptStep(state: AuthFormState, viewModel: AuthViewModel) {
    val colors = RecTheme.colors
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(24.dp),
    ) {
        IconButton(onClick = viewModel::backToWelcome) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = colors.ink)
        }
        Spacer(Modifier.height(4.dp))
        PageDots(
            total = 3,
            activeIndex = 1,
            dotColor = colors.thread,
            activeColor = colors.indigo,
        )

        Spacer(Modifier.height(20.dp))
        Text("Изаберите писмо", style = MaterialTheme.typography.headlineSmall, color = colors.ink)
        Text(
            "Choose your script",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.inkSoft,
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
        Spacer(Modifier.height(14.dp))
        Text(
            "Избор одређује сваку следећу лекцију. Може се променити у профилу.",
            style = MaterialTheme.typography.bodySmall,
            color = colors.inkSoft,
        )

        Spacer(Modifier.weight(1f))
        RecPrimaryButton(text = "Настави", onClick = viewModel::proceedToCredentials)
    }
}

@Composable
private fun CredentialsStep(state: AuthFormState, viewModel: AuthViewModel) {
    val colors = RecTheme.colors
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
    ) {
        IconButton(onClick = viewModel::backToScript) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = colors.ink)
        }
        Spacer(Modifier.height(4.dp))
        PageDots(
            total = 3,
            activeIndex = 2,
            dotColor = colors.thread,
            activeColor = colors.indigo,
        )

        Spacer(Modifier.height(20.dp))
        Text("Направите налог", style = MaterialTheme.typography.headlineSmall, color = colors.ink)
        Text(
            "Напредак и серија дана се чувају на серверу.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.inkSoft,
        )

        Spacer(Modifier.height(24.dp))
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            val fc = fieldColors(colors)
            RecTextField(
                label = "Име",
                value = state.displayName,
                onValueChange = viewModel::updateDisplayName,
                placeholder = "Милица",
                fieldColor = fc.field,
                labelColor = fc.label,
                textColor = fc.text,
                placeholderColor = fc.placeholder,
            )
            RecTextField(
                label = "Е-пошта",
                value = state.email,
                onValueChange = viewModel::updateEmail,
                placeholder = "milica@example.com",
                keyboardType = KeyboardType.Email,
                fieldColor = fc.field,
                labelColor = fc.label,
                textColor = fc.text,
                placeholderColor = fc.placeholder,
            )
            RecTextField(
                label = "Лозинка",
                value = state.password,
                onValueChange = viewModel::updatePassword,
                isPassword = true,
                keyboardType = KeyboardType.Password,
                helperText = "Најмање 8 знакова.",
                fieldColor = fc.field,
                labelColor = fc.label,
                textColor = fc.text,
                placeholderColor = fc.placeholder,
            )

            val (scriptLabel, scriptSample) = scriptSummary(state.scriptPreference)
            ScriptSummaryChip(label = scriptLabel, sample = scriptSample, onClick = viewModel::backToScript)

            state.error?.let {
                Text(it, color = colors.oxblood, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.height(4.dp))
            if (state.isLoading) {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = colors.indigo)
                }
            } else {
                RecPrimaryButton(
                    text = "Направи налог",
                    onClick = viewModel::submitRegister,
                    enabled = state.displayName.isNotBlank() && state.email.isNotBlank() && state.password.length >= 8,
                )
            }
        }
    }
}

private data class FieldColors(val field: Color, val label: Color, val text: Color, val placeholder: Color)

private fun fieldColors(colors: com.rec.app.ui.theme.RecColors) = FieldColors(
    field = colors.surface2,
    label = colors.inkSoft,
    text = colors.ink,
    placeholder = colors.inkSoft.copy(alpha = 0.5f),
)

private fun scriptSummary(preference: String): Pair<String, String> = when (preference) {
    "cyrillic" -> "Ћирилица" to "Здраво, како си?"
    "latin" -> "Latinica" to "Zdravo, kako si?"
    else -> "Оба писма" to "Здраво / Zdravo"
}
