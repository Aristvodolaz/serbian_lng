import SwiftUI

/// A woven kilim band: the diagonal lattice that marks progress throughout the
/// app (hero divider, section rules, empty states).
struct KilimRule: View {
    var tint: Color = Palette.thread
    var cell: CGFloat = 10
    var opacity: Double = 0.55

    var body: some View {
        Canvas { context, size in
            let columns = Int(ceil(size.width / cell)) + 1
            let rows = max(1, Int(ceil(size.height / cell)))
            for row in 0..<rows {
                for column in 0..<columns where (row + column).isMultiple(of: 2) {
                    let rect = CGRect(
                        x: CGFloat(column) * cell,
                        y: CGFloat(row) * cell,
                        width: cell,
                        height: cell
                    )
                    context.fill(Path(diamondIn: rect), with: .color(tint))
                }
            }
        }
        .frame(height: cell)
        .opacity(opacity)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// The dashed thread that links nodes on the lesson path.
struct KilimThread: View {
    var tint: Color = Palette.thread

    var body: some View {
        Rectangle()
            .fill(tint)
            .frame(width: 2, height: 26)
            .opacity(0.7)
            .accessibilityHidden(true)
    }
}

extension Path {
    init(diamondIn rect: CGRect) {
        self.init()
        move(to: CGPoint(x: rect.midX, y: rect.minY))
        addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        addLine(to: CGPoint(x: rect.minX, y: rect.midY))
        closeSubpath()
    }
}
