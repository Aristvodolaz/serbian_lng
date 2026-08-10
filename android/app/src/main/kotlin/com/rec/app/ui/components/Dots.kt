package com.rec.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Onboarding step indicator: small dots, the active one elongated into a pill. */
@Composable
fun PageDots(
    total: Int,
    activeIndex: Int,
    dotColor: Color,
    activeColor: Color,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(5.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(total) { i ->
            val active = i == activeIndex
            Box(
                Modifier
                    .height(6.dp)
                    .width(if (active) 18.dp else 6.dp)
                    .background(if (active) activeColor else dotColor, RoundedCornerShape(50)),
            )
        }
    }
}

/** Purely decorative kilim-weave rule — a row of small diamonds, no state. */
@Composable
fun WeaveDots(
    count: Int,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        repeat(count) {
            Box(
                Modifier
                    .height(6.dp)
                    .width(6.dp)
                    .rotate(45f)
                    .background(color, RoundedCornerShape(1.dp)),
            )
        }
    }
}
