import AVFoundation
import Foundation

/// Short answer feedback sounds. Uses the `.ambient` session category so the
/// cues mix with (rather than interrupt) whatever the learner is listening to.
final class SoundService {
    static let shared = SoundService()

    enum Effect: String {
        case correct
        case wrong
    }

    private var players: [Effect: AVAudioPlayer] = [:]

    private init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
        for effect in [Effect.correct, .wrong] {
            if let url = Bundle.main.url(forResource: effect.rawValue, withExtension: "caf"),
               let player = try? AVAudioPlayer(contentsOf: url) {
                player.prepareToPlay()
                players[effect] = player
            }
        }
    }

    func play(_ effect: Effect) {
        guard let player = players[effect] else { return }
        player.currentTime = 0
        player.play()
    }
}
