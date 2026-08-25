import AVFoundation
import Foundation

/// Pronunciation for flashcards. Uses the backend TTS endpoint (Google Cloud)
/// for real Serbian speech. Falls back to on-device synthesis if offline.
final class SpeechService: NSObject {
    static let shared = SpeechService()

    private let synthesizer = AVSpeechSynthesizer()
    private var player: AVAudioPlayer?
    private var api: RecAPI?

    private override init() {
        super.init()
        synthesizer.delegate = self
    }

    /// Set the API so we can call the backend TTS endpoint.
    func configure(api: RecAPI) {
        self.api = api
    }

    func pronounce(_ word: ReviewWord) {
        activateSession()

        // Prefer backend TTS (real Serbian) — fall back to on-device if it fails.
        Task {
            do {
                guard let api else { throw CocoaError(.fileReadUnknown) }
                let text = word.cyrillic
                let data = try await api.speak(text)
                try play(data)
            } catch {
                print("SpeechService: backend TTS failed (\(error)), using on-device fallback")
                speakWithTTS(word)
            }
        }
    }

    private func play(_ data: Data) throws {
        player = try AVAudioPlayer(data: data)
        player?.prepareToPlay()
        player?.play()
    }

    // MARK: - On-device fallback

    private func speakWithTTS(_ word: ReviewWord) {
        guard let voice = serbianVoice() else {
            print("SpeechService: no Serbian voice available")
            return
        }

        let spoken = voice.language.hasPrefix("sr") ? word.cyrillic : word.latin
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
