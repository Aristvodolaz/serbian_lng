package com.rec.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.theme.Elevation
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.PillShape
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing

@Composable
private fun fieldColors() = TextFieldDefaults.colors(
    focusedContainerColor = RecTheme.colors.surface,
    unfocusedContainerColor = RecTheme.colors.surface,
    disabledContainerColor = RecTheme.colors.surface,
    errorContainerColor = RecTheme.colors.surface,
    focusedIndicatorColor = Color.Transparent,
    unfocusedIndicatorColor = Color.Transparent,
    disabledIndicatorColor = Color.Transparent,
    errorIndicatorColor = Color.Transparent,
    focusedTextColor = RecTheme.colors.ink,
    unfocusedTextColor = RecTheme.colors.ink,
    cursorColor = RecTheme.colors.primary,
    focusedLeadingIconColor = RecTheme.colors.primary,
    unfocusedLeadingIconColor = RecTheme.colors.inkSoft,
    focusedTrailingIconColor = RecTheme.colors.inkSoft,
    unfocusedTrailingIconColor = RecTheme.colors.inkSoft,
)

/**
 * Form field with its label above the box. The border takes the primary color
 * on focus and the danger color on error; password fields get a show/hide toggle.
 */
@Composable
fun RecTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    isPassword: Boolean = false,
    isError: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    onImeAction: (() -> Unit)? = null,
    helperText: String? = null,
) {
    val colors = RecTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val borderColor by animateColorAsState(
        when {
            isError -> colors.danger
            focused -> colors.primary
            else -> colors.outline
        },
        Motion.fast(),
        label = "field-border",
    )
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    val shape = RoundedCornerShape(Radius.md)

    Column(modifier.fillMaxWidth()) {
        Text(label, style = MaterialTheme.typography.titleSmall, color = colors.inkSoft)
        TextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            isError = isError,
            interactionSource = interaction,
            textStyle = MaterialTheme.typography.bodyLarge,
            placeholder = placeholder?.let { { Text(it, color = colors.inkSoft.copy(alpha = 0.6f)) } },
            visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
            trailingIcon = if (isPassword) {
                {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            if (passwordVisible) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = stringResource(
                                if (passwordVisible) R.string.cd_hide_password else R.string.cd_show_password,
                            ),
                        )
                    }
                }
            } else {
                null
            },
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
            keyboardActions = KeyboardActions(
                onNext = { onImeAction?.invoke() },
                onDone = { onImeAction?.invoke() },
            ),
            shape = shape,
            colors = fieldColors(),
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Spacing.sm)
                .border(1.5.dp, borderColor, shape),
        )
        AnimatedVisibility(visible = helperText != null, enter = fadeIn(Motion.fast()), exit = fadeOut(Motion.fast())) {
            Text(
                helperText.orEmpty(),
                style = MaterialTheme.typography.bodySmall,
                color = if (isError) colors.danger else colors.inkSoft,
                modifier = Modifier.padding(top = Spacing.xs, start = Spacing.xs),
            )
        }
    }
}

/** Capsule search box with a clear button once there is text. */
@Composable
fun RecSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
) {
    val colors = RecTheme.colors
    TextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = MaterialTheme.typography.bodyLarge,
        placeholder = { Text(placeholder, color = colors.inkSoft) },
        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
        trailingIcon = if (value.isNotEmpty()) {
            {
                IconButton(onClick = { onValueChange("") }) {
                    Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.cd_clear_search))
                }
            }
        } else {
            null
        },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        shape = PillShape,
        colors = fieldColors(),
        modifier = modifier.fillMaxWidth().shadow(Elevation.card, PillShape),
    )
}
