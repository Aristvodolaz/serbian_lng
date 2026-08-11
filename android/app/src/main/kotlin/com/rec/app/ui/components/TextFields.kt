package com.rec.app.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp

/**
 * Filled, dark, label-above-the-box field — the register/login form style
 * from the reference screens, distinct from Material's default outlined
 * floating-label text field used elsewhere isn't used at all anymore here.
 */
@Composable
fun RecTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    fieldColor: Color,
    labelColor: Color,
    textColor: Color,
    placeholderColor: Color,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    onImeAction: (() -> Unit)? = null,
    helperText: String? = null,
) {
    Column(modifier) {
        Text(
            label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = labelColor,
        )
        TextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            placeholder = placeholder?.let { { Text(it, color = placeholderColor) } },
            visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
            keyboardActions = KeyboardActions(
                onNext = { onImeAction?.invoke() },
                onDone = { onImeAction?.invoke() },
            ),
            shape = RoundedCornerShape(14.dp),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = fieldColor,
                unfocusedContainerColor = fieldColor,
                disabledContainerColor = fieldColor,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                focusedTextColor = textColor,
                unfocusedTextColor = textColor,
                cursorColor = textColor,
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
        )
        helperText?.let {
            Text(
                it,
                style = MaterialTheme.typography.bodySmall,
                color = labelColor,
                modifier = Modifier.padding(top = 4.dp, start = 2.dp),
            )
        }
    }
}
