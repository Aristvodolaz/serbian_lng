import AVFoundation
import Foundation

/// Pronunciation for flashcards. The backend may ship an `audioUrl`; when it
/// doesn't, fall back to speech synthesis so the speaker button always works.
final class SpeechService {
    static let shared = SpeechService()

    private let synthesizer = AVSpeechSynthesizer()
    private var player: AVPlayer?

    private init() {}

    func pronounce(_ word: ReviewWord) {
        activateSession()

        if let url = word.audioURL {
            player = AVPlayer(url: url)
            player?.play()
            return
        }

        let voice = serbianVoice()
        // A Croatian or Bosnian voice reads the Latin spelling correctly; a
        // Serbian one handles Cyrillic natively.
        let spoken = voice?.language.hasPrefix("sr") == true ? word.cyrillic : word.latin
        let utterance = AVSpeechUtterance(string: spoken)
        utterance.voice = voice
        utterance.rate = 0.45

        synthesizer.stopSpeaking(at: .immediate)
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

    private func activateSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? session.setActive(true, options: [])
    }
}
