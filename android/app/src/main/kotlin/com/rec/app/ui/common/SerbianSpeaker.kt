package com.rec.app.ui.common

import android.speech.tts.TextToSpeech
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import java.util.Locale

/**
 * Speaks Serbian text aloud via the device's TTS engine. There's no recorded
 * audio yet (Word.audioUrl from the backend is unused so far) — this is the
 * pronunciation source for flashcards until real recordings exist.
 *
 * Callers should pass the *Latin* form, not Cyrillic: most devices don't have
 * a Serbian voice installed, and the fallback locale below reads Latin script
 * far more reliably than Cyrillic regardless of which language voice ends up
 * actually speaking it.
 */
@Composable
fun rememberSerbianSpeaker(): (String) -> Unit {
    val context = LocalContext.current
    val ttsRef = remember { arrayOfNulls<TextToSpeech>(1) }

    DisposableEffect(Unit) {
        lateinit var engine: TextToSpeech
        engine = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val result = engine.setLanguage(Locale.forLanguageTag("sr-RS"))
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    engine.language = Locale.getDefault()
                }
            }
        }
        ttsRef[0] = engine

        onDispose {
            engine.stop()
            engine.shutdown()
            ttsRef[0] = null
        }
    }

    return remember {
        { text: String -> ttsRef[0]?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "rec-pronounce") }
    }
}
