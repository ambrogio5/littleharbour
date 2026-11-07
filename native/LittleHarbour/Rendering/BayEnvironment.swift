import SpriteKit
import UIKit

/// Ground, paving and site activity are separate from the interactive buildings.
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
            let placement = BayLayout.placement(e)
            prop(kind, at: BayLayout.groundDetail(e, x: 105, y: -12),
                 width: (e.level > 1 ? 125 : 100) * placement.scale, mirrored: placement.mirrored)
        }
    }
    private func prop(_ name: String, at point: CGPoint, width: CGFloat, mirrored: Bool) {
        let node = SKSpriteNode(imageNamed: "bay-" + name)
        node.name = "bay-detail-" + name; node.size = CGSize(width: width, height: width)
        node.xScale = mirrored ? -1 : 1
        node.position = point; node.zPosition = BayLayout.size.height - point.y + 5; details.addChild(node)
    }
    func zoom(_ scale: CGFloat, labels: Bool) {
        paving.alpha = max(0, min(0.36, (2.4 - scale) * 0.25))
        districts.isHidden = !labels || scale < 3.2
        // The small props are optional visual detail, not hidden interaction targets.
        for child in details.children where child.name?.hasPrefix("bay-detail") == true { child.isHidden = scale > 3.2 }
    }
}
