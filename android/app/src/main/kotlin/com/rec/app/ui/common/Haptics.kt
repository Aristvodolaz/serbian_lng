package com.rec.app.ui.common

import android.os.Build
import android.view.HapticFeedbackConstants
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalView

/**
 * Richer than Compose's own HapticFeedbackType (which only exposes LongPress
 * and TextHandleMove) — CONFIRM/REJECT read as distinctly "right"/"wrong"
 * where LongPress alone would feel the same for both. CONFIRM/REJECT only
 * exist from API 30, so older devices fall back to a lighter tap / a buzz.
 */
@Composable
fun rememberAnswerHaptics(): (Boolean) -> Unit {
    val view = LocalView.current
    return { correct ->
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (correct) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.REJECT
        } else {
            if (correct) HapticFeedbackConstants.VIRTUAL_KEY else HapticFeedbackConstants.LONG_PRESS
        }
        view.performHapticFeedback(constant)
    }
}

/** A single celebratory tick — lesson complete, badge earned. */
@Composable
fun rememberCelebrationHaptic(): () -> Unit {
    val view = LocalView.current
    return {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            HapticFeedbackConstants.CONFIRM
        } else {
            HapticFeedbackConstants.VIRTUAL_KEY
        }
        view.performHapticFeedback(constant)
    }
}
