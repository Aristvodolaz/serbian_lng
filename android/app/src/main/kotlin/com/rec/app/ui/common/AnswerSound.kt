package com.rec.app.ui.common

import android.media.AudioManager
import android.media.ToneGenerator

/**
 * Short answer cue, the Android counterpart of iOS `SoundService`. iOS plays bundled
 * `correct.caf` / `wrong.caf`; those files don't play on Android, so this uses the system
 * ACK / NACK tones instead. shortcut: system beeps, not the app's own sounds — swap in
 * `res/raw` audio if the designed cues are wanted.
 */
object AnswerSound {
    private var tone: ToneGenerator? = null

    fun play(correct: Boolean) {
        val generator = tone ?: runCatching { ToneGenerator(AudioManager.STREAM_MUSIC, 80) }.getOrNull()?.also { tone = it }
            ?: return
        generator.startTone(if (correct) ToneGenerator.TONE_PROP_ACK else ToneGenerator.TONE_PROP_NACK, 150)
    }
}
