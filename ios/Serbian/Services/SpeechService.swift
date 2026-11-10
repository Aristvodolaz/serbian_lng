import AVFoundation
import Foundation

/// On-device pronunciation (AVSpeechSynthesizer, sr-RS). `latinFallback` is
/// spoken when only a non-Serbian voice is available, since those voices
/// garble Cyrillic.
final class SpeechService: NSObject {
    static let shared = SpeechService()

    private let synthesizer = AVSpeechSynthesizer()

    private override init() {
        super.init()
        synthesizer.delegate = self
    }

    func pronounce(_ word: ReviewWord) {
        pronounce(word.cyrillic, latinFallback: word.latin)
    }

    func pronounce(_ word: Word) {
        pronounce(word.cyrillic, latinFallback: word.latin)
    }

    func pronounce(_ text: String, latinFallback: String? = nil) {
        activateSession()

        guard let voice = serbianVoice() else {
            print("SpeechService: no Serbian voice available")
            return
        }

        let spoken = voice.language.hasPrefix("sr") ? text : (latinFallback ?? text)
        let utterance = AVSpeechUtterance(string: spoken)
        utterance.voice = voice
        utterance.rate = 0.45

        synthesizer.stopSpeaking(at: .word)
        synthesizer.speak(utterance)
    }

    private func serbianVoice() -> AVSpeechSynthesisVoice? {
        for language in ["sr-RS", "sr", "hr-HR", "bs-BA"] {
            if let voice = AVSpeechSynthesisVoice(language: language) {
                return voice
            }
        }
        return nil
    }

    // MARK: - Audio session

    private func activateSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? session.setActive(true, options: [.notifyOthersOnDeactivation])
    }
}

extension SpeechService: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFailWithError error: Error) {
        print("SpeechService: synthesis failed: \(error.localizedDescription)")
    }
}
