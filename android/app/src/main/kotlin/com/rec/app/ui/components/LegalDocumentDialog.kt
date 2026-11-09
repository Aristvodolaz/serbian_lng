package com.rec.app.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.rec.app.R
import com.rec.app.ui.theme.RecTheme

/**
 * Full-screen view of a bundled legal document (`assets/<assetPath>`), shown as plain text
 * like the iOS `LegalDocumentView`, so Markdown markers are visible.
 */
@Composable
fun LegalDocumentDialog(assetPath: String, title: String, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val loadError = stringResource(R.string.legal_load_error)
    val text = remember(assetPath) {
        runCatching { context.assets.open(assetPath).bufferedReader().use { it.readText() } }
            .getOrElse { loadError }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(modifier = Modifier.fillMaxSize(), color = RecTheme.colors.ground) {
            Column(Modifier.statusBarsPadding().padding(20.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        title,
                        style = MaterialTheme.typography.titleLarge,
                        color = RecTheme.colors.ink,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = onDismiss) {
                        Text(stringResource(R.string.legal_done), color = RecTheme.colors.indigo)
                    }
                }
                Column(Modifier.verticalScroll(rememberScrollState())) {
                    Text(text, style = MaterialTheme.typography.bodyMedium, color = RecTheme.colors.ink)
                }
            }
        }
    }
}
