package com.rec.app.ui.screens.auth

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rec.app.R
import com.rec.app.ui.common.UiText
import com.rec.app.ui.common.asString
import com.rec.app.ui.components.LegalDocumentDialog
import com.rec.app.ui.components.OptionCard
import com.rec.app.ui.components.PageDots
import com.rec.app.ui.components.RecPrimaryButton
import com.rec.app.ui.components.RecSecondaryButton
import com.rec.app.ui.components.RecTextField
import com.rec.app.ui.components.RecTopBar
import com.rec.app.ui.components.SectionLabel
import com.rec.app.ui.components.SegmentedSwitch
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

private const val MIN_PASSWORD_LENGTH = 8
private const val ONBOARDING_STEPS = 3

// Language names are shown in their own language, so they are not translated resources.
private val LanguageOptions = listOf("Русский", "English")

@Composable
fun AuthScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    // There is no navigation back stack in this flow, so the system back button
    // would leave the app from any step; this steps back one stage instead.
    BackHandler(enabled = state.stage != AuthStage.WELCOME) {
        when (state.stage) {
            AuthStage.CREDENTIALS -> viewModel.backToScript()
            AuthStage.SCRIPT, AuthStage.LOGIN -> viewModel.backToWelcome()
            AuthStage.WELCOME -> Unit
        }
    }

    AnimatedContent(
        targetState = state.stage,
        transitionSpec = {
            // Deeper into onboarding slides left, backing out slides right:
            // the direction says "forward" or "back", which a crossfade can't.
            val forward = targetState.depth() >= initialState.depth()
            (slideInHorizontally(Motion.slow()) { w -> if (forward) w / 3 else -w / 3 } + fadeIn(Motion.base())) togetherWith
                (slideOutHorizontally(Motion.base()) { w -> if (forward) -w / 3 else w / 3 } + fadeOut(Motion.fast()))
        },
        modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground),
        label = "auth-stage",
    ) { stage ->
        when (stage) {
            AuthStage.WELCOME -> WelcomeStep(onGetStarted = viewModel::goToRegister, onLogin = viewModel::goToLogin)
            AuthStage.LOGIN -> LoginStep(state, viewModel)
            AuthStage.SCRIPT -> ScriptStep(state, viewModel)
            AuthStage.CREDENTIALS -> CredentialsStep(state, viewModel)
        }
    }
}

private fun AuthStage.depth(): Int = when (this) {
    AuthStage.WELCOME -> 0
    AuthStage.LOGIN, AuthStage.SCRIPT -> 1
    AuthStage.CREDENTIALS -> 2
}

/** Blue hero with the wordmark on top, a rounded sheet with the two actions below. */
@Composable
private fun WelcomeStep(onGetStarted: () -> Unit, onLogin: () -> Unit) {
    val colors = RecTheme.colors
    var revealed by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(Unit) { revealed = true }

    // The gradient runs edge to edge behind the system bars; only the content is inset.
    Column(modifier = Modifier.fillMaxSize().background(colors.welcomeBrush)) {
        Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
            Box(Modifier.size(280.dp).align(Alignment.TopEnd).offset(x = 110.dp, y = (-60).dp).background(colors.onHero.copy(alpha = 0.08f), CircleShape))
            Box(Modifier.size(200.dp).align(Alignment.BottomStart).offset(x = (-80).dp, y = 40.dp).background(colors.onHero.copy(alpha = 0.06f), CircleShape))

            // The brand block is the app's name and strapline, fixed in every locale.
            Column(
                modifier = Modifier.statusBarsPadding().padding(horizontal = Spacing.xxxl),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    stringResource(R.string.auth_eyebrow),
                    style = MaterialTheme.typography.labelMedium,
                    color = colors.onHero.copy(alpha = 0.8f),
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(Spacing.lg))
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        stringResource(R.string.auth_wordmark_cyr),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 72.sp, lineHeight = 76.sp),
                        color = colors.onHero,
                        modifier = Modifier.semantics { heading() },
                    )
                    Text(
                        stringResource(R.string.auth_wordmark_lat),
                        style = MaterialTheme.typography.headlineSmall,
                        fontStyle = FontStyle.Italic,
                        color = colors.accent,
                        modifier = Modifier.padding(start = Spacing.sm, bottom = Spacing.md),
                    )
                }
                Spacer(Modifier.height(Spacing.md))
                Text(
                    stringResource(R.string.auth_tagline),
                    style = MaterialTheme.typography.titleLarge,
                    color = colors.onHero,
                    textAlign = TextAlign.Center,
                )
                Text(
                    stringResource(R.string.auth_tagline_en),
                    style = MaterialTheme.typography.bodyMedium,
                    fontStyle = FontStyle.Italic,
                    color = colors.onHero.copy(alpha = 0.75f),
                    textAlign = TextAlign.Center,
                )
            }
        }

        AnimatedVisibility(
            visible = revealed,
            enter = slideInVertically(Motion.slow()) { it / 3 } + fadeIn(Motion.slow()),
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(topStart = Radius.xl + Spacing.xs, topEnd = Radius.xl + Spacing.xs),
                color = colors.ground,
            ) {
                Column(
                    modifier = Modifier.navigationBarsPadding().padding(Spacing.xxl),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        stringResource(R.string.auth_dual_script_explainer),
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.inkSoft,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(Spacing.xxl))
                    RecPrimaryButton(text = stringResource(R.string.auth_get_started), onClick = onGetStarted)
                    Spacer(Modifier.height(Spacing.md))
                    RecSecondaryButton(text = stringResource(R.string.auth_have_account), onClick = onLogin)
                }
            }
        }
    }
}

/**
 * Shared frame of the form steps: back button with the step dots, a title block,
 * then the step's own content. Scrolls and lifts above the keyboard.
 */
@Composable
private fun AuthStepLayout(
    title: String,
    subtitle: String,
    onBack: () -> Unit,
    step: Int? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = RecTheme.colors
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Spacing.screen)
            .padding(bottom = Spacing.xxl),
    ) {
        RecTopBar(onBack = onBack) {
            if (step != null) PageDots(total = ONBOARDING_STEPS, activeIndex = step)
        }
        Spacer(Modifier.height(Spacing.md))
        Text(title, style = MaterialTheme.typography.displaySmall, color = colors.ink, modifier = Modifier.semantics { heading() })
        if (subtitle.isNotBlank()) {
            Spacer(Modifier.height(Spacing.xs))
            Text(subtitle, style = MaterialTheme.typography.bodyLarge, color = colors.inkSoft)
        }
        Spacer(Modifier.height(Spacing.xxl))
        content()
    }
}

/** The form's error line; it grows into place and is announced to screen readers. */
@Composable
private fun FormError(error: UiText?) {
    AnimatedVisibility(
        visible = error != null,
        enter = expandVertically(Motion.base()) + fadeIn(Motion.base()),
        exit = shrinkVertically(Motion.fast()) + fadeOut(Motion.fast()),
    ) {
        Text(
            error?.asString().orEmpty(),
            style = MaterialTheme.typography.bodyMedium,
            color = RecTheme.colors.danger,
            modifier = Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite },
        )
    }
}

@Composable
private fun LoginStep(state: AuthFormState, viewModel: AuthViewModel) {
    val focusManager = LocalFocusManager.current
    AuthStepLayout(
        title = stringResource(R.string.auth_login_title),
        subtitle = stringResource(R.string.auth_login_subtitle),
        onBack = viewModel::backToWelcome,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Spacing.lg)) {
            RecTextField(
                label = stringResource(R.string.field_email),
                value = state.email,
                onValueChange = viewModel::updateEmail,
                placeholder = stringResource(R.string.field_email_placeholder),
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) },
            )
            RecTextField(
                label = stringResource(R.string.field_password),
                value = state.password,
                onValueChange = viewModel::updatePassword,
                isPassword = true,
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                onImeAction = {
                    focusManager.clearFocus()
                    viewModel.submitLogin()
                },
            )
            FormError(state.error)
            RecPrimaryButton(
                text = stringResource(R.string.auth_login_submit),
                onClick = {
                    focusManager.clearFocus()
                    viewModel.submitLogin()
                },
                enabled = state.email.isNotBlank() && state.password.isNotBlank(),
                loading = state.isLoading,
            )
            TextButton(onClick = viewModel::goToRegister, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.auth_no_account), style = MaterialTheme.typography.labelLarge, color = RecTheme.colors.primary)
            }
        }
    }
}

@Composable
private fun ScriptStep(state: AuthFormState, viewModel: AuthViewModel) {
    AuthStepLayout(
        title = stringResource(R.string.auth_script_title),
        subtitle = stringResource(R.string.auth_script_subtitle),
        onBack = viewModel::backToWelcome,
        step = 1,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
            OptionCard(
                title = stringResource(R.string.script_cyrillic),
                subtitle = stringResource(R.string.script_sample_cyrillic),
                selected = state.scriptPreference == "cyrillic",
                onClick = { viewModel.updateScriptPreference("cyrillic") },
            )
            OptionCard(
                title = stringResource(R.string.script_latin),
                subtitle = stringResource(R.string.script_sample_latin),
                selected = state.scriptPreference == "latin",
                onClick = { viewModel.updateScriptPreference("latin") },
            )
            OptionCard(
                title = stringResource(R.string.script_both),
                subtitle = stringResource(R.string.script_sample_both),
                selected = state.scriptPreference == "both",
                onClick = { viewModel.updateScriptPreference("both") },
            )
        }
        Spacer(Modifier.height(Spacing.lg))
        Text(
            stringResource(R.string.auth_script_helper),
            style = MaterialTheme.typography.bodyMedium,
            color = RecTheme.colors.inkSoft,
        )
        Spacer(Modifier.height(Spacing.xxxl))
        RecPrimaryButton(text = stringResource(R.string.auth_continue), onClick = viewModel::proceedToCredentials)
    }
}

@Composable
private fun CredentialsStep(state: AuthFormState, viewModel: AuthViewModel) {
    val colors = RecTheme.colors
    val focusManager = LocalFocusManager.current
    var showPrivacy by rememberSaveable { mutableStateOf(false) }

    AuthStepLayout(
        title = stringResource(R.string.auth_register_title),
        subtitle = stringResource(R.string.auth_register_subtitle),
        onBack = viewModel::backToScript,
        step = 2,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Spacing.lg)) {
            RecTextField(
                label = stringResource(R.string.field_name),
                value = state.displayName,
                onValueChange = viewModel::updateDisplayName,
                placeholder = stringResource(R.string.field_name_placeholder),
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) },
            )
            RecTextField(
                label = stringResource(R.string.field_email),
                value = state.email,
                onValueChange = viewModel::updateEmail,
                placeholder = stringResource(R.string.field_email_placeholder),
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) },
            )
            RecTextField(
                label = stringResource(R.string.field_password),
                value = state.password,
                onValueChange = viewModel::updatePassword,
                isPassword = true,
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                onImeAction = { focusManager.clearFocus() },
                helperText = stringResource(R.string.field_password_helper),
            )

            val (scriptLabel, scriptSample) = scriptSummary(state.scriptPreference)
            OptionCard(
                title = scriptLabel,
                subtitle = scriptSample,
                selected = false,
                showChevron = true,
                onClick = viewModel::backToScript,
            )

            Column {
                SectionLabel(stringResource(R.string.auth_language_label))
                SegmentedSwitch(
                    options = LanguageOptions,
                    selectedIndex = if (state.languagePreference == "en") 1 else 0,
                    onSelect = { viewModel.updateLanguagePreference(if (it == 1) "en" else "ru") },
                )
            }

            FormError(state.error)
            RecPrimaryButton(
                text = stringResource(R.string.auth_register_submit),
                onClick = {
                    focusManager.clearFocus()
                    viewModel.submitRegister()
                },
                enabled = state.displayName.isNotBlank() && state.email.isNotBlank() && state.password.length >= MIN_PASSWORD_LENGTH,
                loading = state.isLoading,
            )

            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(
                    stringResource(R.string.auth_privacy_prefix),
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.inkSoft,
                    textAlign = TextAlign.Center,
                )
                TextButton(onClick = { showPrivacy = true }) {
                    Text(stringResource(R.string.auth_privacy_link), style = MaterialTheme.typography.labelLarge, color = colors.primary)
                }
            }
        }
    }

    if (showPrivacy) {
        LegalDocumentDialog(
            assetPath = "legal/privacy-policy-pdn.md",
            title = stringResource(R.string.legal_privacy_title),
            onDismiss = { showPrivacy = false },
        )
    }
}

@Composable
private fun scriptSummary(preference: String): Pair<String, String> = when (preference) {
    "cyrillic" -> stringResource(R.string.script_cyrillic) to stringResource(R.string.script_sample_cyrillic)
    "latin" -> stringResource(R.string.script_latin) to stringResource(R.string.script_sample_latin)
    else -> stringResource(R.string.script_both) to stringResource(R.string.script_sample_both)
}
