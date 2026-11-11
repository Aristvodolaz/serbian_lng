package com.rec.app.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.rec.app.R
import com.rec.app.ui.theme.Radius
import com.rec.app.ui.theme.RecTheme
import com.rec.app.ui.theme.Spacing
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** The app's confirmation dialog. [destructive] colors the confirm action as a warning. */
@Composable
fun RecAlertDialog(
    title: String,
    message: String,
    confirmText: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    dismissText: String? = null,
    destructive: Boolean = false,
) {
    val colors = RecTheme.colors
    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(Radius.xl),
        containerColor = colors.surface,
        titleContentColor = colors.ink,
        textContentColor = colors.inkSoft,
        title = { Text(title, style = MaterialTheme.typography.headlineSmall) },
        text = { Text(message, style = MaterialTheme.typography.bodyLarge) },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(
                    confirmText,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (destructive) colors.danger else colors.primary,
                )
            }
        },
        dismissButton = dismissText?.let {
            {
                TextButton(onClick = onDismiss) {
                    Text(it, style = MaterialTheme.typography.labelLarge, color = colors.inkSoft)
                }
            }
        },
    )
}

/**
 * Full-screen view of a bundled legal document (`assets/<assetPath>`), shown as
 * plain text like the iOS `LegalDocumentView`. The file is read off the main thread.
 */
@Composable
fun LegalDocumentDialog(assetPath: String, title: String, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val loadError = stringResource(R.string.legal_load_error)
    val text by produceState(initialValue = "", assetPath) {
        value = withContext(Dispatchers.IO) {
            runCatching { context.assets.open(assetPath).bufferedReader().use { it.readText() } }.getOrElse { loadError }
        }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(modifier = Modifier.fillMaxSize(), color = RecTheme.colors.ground) {
            Column(Modifier.statusBarsPadding().navigationBarsPadding().padding(horizontal = Spacing.screen)) {
                RecTopBar(
                    title = title,
                    onBack = onDismiss,
                    backIcon = Icons.Filled.Close,
                    backDescription = stringResource(R.string.legal_done),
                )
                Column(Modifier.verticalScroll(rememberScrollState()).padding(vertical = Spacing.md)) {
                    Text(text, style = MaterialTheme.typography.bodyMedium, color = RecTheme.colors.ink)
                }
            }
        }
    }
}
