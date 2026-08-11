package com.rec.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rec.app.R
import com.rec.app.ui.theme.RecTheme

/** A dead-end error screen with no way forward is the single worst state an
 * app can leave someone in — every Error branch gets this instead of bare text. */
@Composable
fun ErrorContent(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Filled.ErrorOutline, contentDescription = null, tint = colors.oxblood, modifier = Modifier.size(40.dp))
        Spacer(Modifier.height(12.dp))
        Text(message, color = colors.oxblood, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(16.dp))
        RecGhostButton(
            text = stringResource(R.string.action_retry),
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth(0.7f),
        )
    }
}
