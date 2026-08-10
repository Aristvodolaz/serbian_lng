package com.rec.app.ui.common

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource

/**
 * Lets a ViewModel describe user-facing text (usually an error message)
 * without holding a Context — resolution to an actual localized String only
 * happens in the Composable that renders it, via [asString].
 */
sealed interface UiText {
    data class Resource(@StringRes val resId: Int, val args: List<Any> = emptyList()) : UiText
    data class Dynamic(val value: String) : UiText
}

fun uiText(@StringRes resId: Int, vararg args: Any): UiText = UiText.Resource(resId, args.toList())

fun uiText(value: String): UiText = UiText.Dynamic(value)

@Composable
fun UiText.asString(): String = when (this) {
    is UiText.Resource -> stringResource(resId, *args.toTypedArray())
    is UiText.Dynamic -> value
}
