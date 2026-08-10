package com.rec.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

// Fully-rounded capsule, matching the reference screens' pill buttons rather
// than the web mockup's 14dp rounded-rect (mobile-native large touch targets
// read better as a true pill than a softened rectangle).
private val PillShape = RoundedCornerShape(50)
private val ButtonHeight = 52.dp

@Composable
fun RecPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    containerColor: Color = RecTheme.colors.indigo,
    contentColor: Color = RecTheme.colors.cream,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().height(ButtonHeight),
        shape = PillShape,
        colors = ButtonDefaults.buttonColors(containerColor = containerColor, contentColor = contentColor),
    ) {
        Text(text, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun RecGhostButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    borderColor: Color = RecTheme.colors.thread,
    contentColor: Color = RecTheme.colors.inkSoft,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().height(ButtonHeight),
        shape = PillShape,
        border = BorderStroke(1.5.dp, borderColor),
    ) {
        Text(text, fontWeight = FontWeight.Bold, color = contentColor)
    }
}
