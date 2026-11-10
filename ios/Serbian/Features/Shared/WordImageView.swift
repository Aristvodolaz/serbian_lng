import SwiftUI

/// Remote word image with a neutral placeholder while loading or on failure;
/// renders nothing when there is no URL, so callers need no conditional.
struct WordImageView: View {
    let url: String?
    var height: CGFloat = 140

    var body: some View {
        if let url, !url.isEmpty, let remote = URL(string: url) {
            AsyncImage(url: remote) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                default:
                    Palette.surfaceRaised
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .clipShape(RoundedRectangle(cornerRadius: Metrics.cardCorner, style: .continuous))
        }
    }
}
