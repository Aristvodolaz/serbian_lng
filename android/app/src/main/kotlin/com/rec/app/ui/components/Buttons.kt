package com.rec.app.ui.components

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

// Fully-rounded capsule, matching the reference screens' pill buttons rather
// than the web mockup's 14dp rounded-rect (mobile-native large touch targets
// read better as a true pill than a softened rectangle).
private val PillShape = RoundedCornerShape(50)
private val ButtonHeight = 52.dp

/** Squashes to 0.96x on press and springs back — buttons that don't move read as unresponsive. */
@Composable
private fun rememberPressScale(interactionSource: MutableInteractionSource): Float {
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.96f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "button-press-scale",
    )
    return scale
}

@Composable
fun RecPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    containerColor: Color = RecTheme.colors.indigo,
    contentColor: Color = RecTheme.colors.cream,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val scale = rememberPressScale(interactionSource)
    Button(
        onClick = onClick,
        enabled = enabled,
        interactionSource = interactionSource,
        modifier = modifier
            .fillMaxWidth()
            .height(ButtonHeight)
            .graphicsLayer { scaleX = scale; scaleY = scale },
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
    val interactionSource = remember { MutableInteractionSource() }
    val scale = rememberPressScale(interactionSource)
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        interactionSource = interactionSource,
        modifier = modifier
            .fillMaxWidth()
            .height(ButtonHeight)
            .graphicsLayer { scaleX = scale; scaleY = scale },
        shape = PillShape,
        border = BorderStroke(1.5.dp, borderColor),
    ) {
        Text(text, fontWeight = FontWeight.Bold, color = contentColor)
    }
}
