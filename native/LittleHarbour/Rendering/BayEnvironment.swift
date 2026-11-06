import SpriteKit
import UIKit

/// Ground, shared lanes and site activity are separate from the interactive buildings.
@MainActor final class BayEnvironment: SKNode {
    private let details = SKNode()
    private let paving = SKNode()
    private let districts = SKNode()
    private var signature = ""
    override init() {
        super.init()
        name = "sheltered-bay"
        for row in 0..<2 { for col in 0..<3 {
            let tile = SKSpriteNode(imageNamed: "bay-ground-\(col)-\(row)")
            tile.name = "bay-terrain-\(col)-\(row)"; tile.anchorPoint = .zero
            tile.size = CGSize(width: 1280, height: 1280)
            tile.position = CGPoint(x: col * 1280, y: (1 - row) * 1280)
            tile.zPosition = -10000; addChild(tile)
        } }
        paving.zPosition = -9997; addChild(paving); addChild(details); addChild(districts)
        // Fine paving overlays are restricted to the existing paved market/quay, with
        // feathered edges. They appear gradually at close zoom, never enlarge the base bitmap.
        for (x, y, w, h) in [(780.0, 435.0, 600.0, 100.0), (1080, 470, 300, 55)] {
            let patch = SKSpriteNode(imageNamed: "bay-paving")
            patch.position = BayLayout.point(x, y); patch.size = CGSize(width: w * 2.5, height: h * 2.5)
            patch.shader = SKShader(source: """
                void main() {
                    vec2 uv = v_tex_coord;
                    float edge = smoothstep(0.0, 0.15, uv.x) * smoothstep(0.0, 0.15, 1.0-uv.x)
                               * smoothstep(0.0, 0.20, uv.y) * smoothstep(0.0, 0.20, 1.0-uv.y);
                    vec4 stone = texture2D(u_texture, fract(uv * vec2(3.0, 1.0)));
                    gl_FragColor = vec4(stone.rgb * edge, edge) * v_color_mix.a;
                }
                """)
            paving.addChild(patch)
        }
        for (text, x, y) in [("FIELDS & MILL", 385.0, 75.0), ("VILLAGE TERRACES", 1000, 225), ("MARKET & QUAY", 770, 560), ("SHELTERED BAY", 825, 720)] {
            let label = SKLabelNode(fontNamed: "AvenirNext-DemiBold")
            label.text = text; label.fontSize = 38; label.fontColor = UIColor(red: 0.98, green: 0.96, blue: 0.86, alpha: 1)
            label.position = BayLayout.point(x, y); label.zPosition = 5000
            let back = SKShapeNode(rectOf: CGSize(width: label.frame.width + 38, height: 60), cornerRadius: 20)
            back.fillColor = UIColor(red: 0.06, green: 0.20, blue: 0.22, alpha: 0.8); back.strokeColor = .clear
            back.position = CGPoint(x: 0, y: 13); back.zPosition = -1; label.addChild(back); districts.addChild(label)
        }
    }
    required init?(coder: NSCoder) { fatalError("Use init()") }
    func apply(_ entities: [WorldEntity]) {
        let next = entities.map { "\($0.id):\($0.stage):\($0.level)" }.joined(separator: ",")
        guard signature != next else { return }; signature = next; details.removeAllChildren()
        let active = Set(entities.filter { $0.stage != "unbuilt" }.map(\.id))
        // Shared village lanes are revealed as neighbourhoods develop, with no change
        // to plot ownership or production. Wide faded borders soften the soil join.
        if entities.contains(where: { $0.id.hasPrefix("plot") && $0.stage != "unbuilt" }) {
            lane([(470, 293), (630, 293), (790, 293)], width: 28)
            lane([(970, 350), (1120, 350), (1285, 350)], width: 28)
        }
        for e in entities where e.stage == "built" {
            let kind: String?
            switch e.id {
            case "pier", "waterfront", "thirdberth": kind = "cargo"
            case "fishing": kind = "nets"
            case "boatyard": kind = "timber"
            case "bakery", "courtyard", "civic": kind = "bench"
            default: kind = e.id.hasPrefix("plot") && e.kind == "home" ? "bench" : nil
            }
            guard let kind else { continue }
            let foot = BayLayout.ground(e)
            prop(kind, at: CGPoint(x: foot.x + 105, y: foot.y - 12), width: e.level > 1 ? 125 : 100)
        }
        // Timber access connects real docks to the masonry edge; no decorative
        // boat or building is substituted for an unpurchased gameplay site.
        if active.contains("thirdberth") { jetty(x: 660, from: 500, to: 565) }
        if active.contains("fishing") { jetty(x: 190, from: 615, to: 650) }
        if active.contains("ferry") { jetty(x: 1250, from: 520, to: 550) }
        if active.contains("boatyard") {
            for x in [405.0, 440.0] { jetty(x: x, from: 515, to: 565, width: 9) }
        }
    }
    private func prop(_ name: String, at point: CGPoint, width: CGFloat) {
        let node = SKSpriteNode(imageNamed: "bay-" + name)
        node.name = "bay-detail-" + name; node.size = CGSize(width: width, height: width)
        node.position = point; node.zPosition = BayLayout.size.height - point.y + 5; details.addChild(node)
    }
    private func lane(_ points: [(CGFloat, CGFloat)], width: CGFloat) {
        let path = CGMutablePath()
        for (i, p) in points.enumerated() { let v = BayLayout.point(p.0, p.1); if i == 0 { path.move(to: v) } else { path.addLine(to: v) } }
        for (extra, alpha) in [(14.0, 0.12), (7.0, 0.18), (0.0, 0.45)] {
            let road = SKShapeNode(path: path); road.lineCap = .round; road.lineJoin = .round
            road.lineWidth = (width + extra) * 2.5
            road.strokeColor = UIColor(red: 0.85, green: 0.73, blue: 0.52, alpha: alpha)
            road.zPosition = -9998; details.addChild(road)
        }
    }
    private func jetty(x: CGFloat, from: CGFloat, to: CGFloat, width: CGFloat = 30) {
        for y in stride(from: from, through: to, by: 4) {
            let plank = SKShapeNode(rectOf: CGSize(width: width * 2.5, height: 8), cornerRadius: 1)
            plank.fillColor = UIColor(red: 0.48 + (Int(y) % 3 == 0 ? 0.04 : 0), green: 0.33, blue: 0.19, alpha: 1)
            plank.strokeColor = UIColor(red: 0.28, green: 0.21, blue: 0.13, alpha: 1)
            plank.lineWidth = 1; plank.position = BayLayout.point(x, y); plank.zPosition = -9980; details.addChild(plank)
        }
    }
    func zoom(_ scale: CGFloat, labels: Bool) {
        paving.alpha = max(0, min(0.36, (2.4 - scale) * 0.25))
        districts.isHidden = !labels || scale < 3.2
        // The small props are optional visual detail, not hidden interaction targets.
        for child in details.children where child.name?.hasPrefix("bay-detail") == true { child.isHidden = scale > 3.2 }
    }
}
