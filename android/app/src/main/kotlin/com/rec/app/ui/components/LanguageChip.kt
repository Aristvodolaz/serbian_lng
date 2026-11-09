package com.rec.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.rec.app.ui.theme.RecTheme

/**
 * Русский / English as one segmented pill: the chosen side fills with the
 * brand gradient and the other sits on the white track, like the reference's toggles.
 */
@Composable
fun LanguageSwitch(english: Boolean, onSelect: (english: Boolean) -> Unit, modifier: Modifier = Modifier) {
    val colors = RecTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .shadow(6.dp, RoundedCornerShape(50), spotColor = colors.indigo)
            .background(colors.surface, RoundedCornerShape(50))
            .padding(5.dp),
    ) {
        listOf(false to "Русский", true to "English").forEach { (isEnglish, label) ->
            val selected = english == isEnglish
            val bg by animateColorAsState(if (selected) colors.indigo else Color.Transparent, tween(220), label = "lang-bg")
            val fg by animateColorAsState(if (selected) colors.cream else colors.inkSoft, tween(220), label = "lang-fg")
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(50))
                    .background(
                        if (selected) Brush.horizontalGradient(listOf(colors.indigo, colors.indigoSoft)) else Brush.horizontalGradient(listOf(bg, bg)),
                    )
                    .clickable { onSelect(isEnglish) }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(label, style = MaterialTheme.typography.labelLarge, color = fg)
            }
        }
    }
}
