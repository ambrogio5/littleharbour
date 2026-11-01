import SpriteKit
import UIKit
import SwiftUI

@MainActor final class HarbourScene: SKScene {
    let world = SKNode()
    let cameraNode = SKCameraNode()
    private let ornaments = SKNode()
    private var sprites: [String: SKSpriteNode] = [:]
    private var labels: [String: SKLabelNode] = [:]
    private var textures: [String: SKTexture] = [:]
    private var entities: [WorldEntity] = []
    private var current: HarbourSnapshot?
    private var styleSignature = ""
    private var initialFocus = false
    private var focusedRegion = "inland"
    private var selectionRing = SKShapeNode(ellipseOf: CGSize(width: 225, height: 116))
    var reduceMotion = false
    var onSelect: ((WorldEntity) -> Void)?
    override init(size: CGSize) {
        super.init(size: size)
        scaleMode = .resizeFill; backgroundColor = UIColor(red: 0.17, green: 0.39, blue: 0.44, alpha: 1)
        addChild(world); addChild(cameraNode); camera = cameraNode
        let terrain = SKSpriteNode(texture: texture("terrain"), size: CGSize(width: 1800, height: 2700))
        terrain.anchorPoint = .zero; terrain.position = .zero; terrain.zPosition = -10000; world.addChild(terrain)
        world.addChild(ornaments)
        selectionRing.strokeColor = UIColor(red: 1, green: 0.87, blue: 0.55, alpha: 1)
        selectionRing.lineWidth = 5; selectionRing.fillColor = .clear; selectionRing.zPosition = 5000; selectionRing.isHidden = true; world.addChild(selectionRing)
    }
    required init?(coder: NSCoder) { fatalError("Use init(size:)") }
    private func texture(_ name: String) -> SKTexture {
        if let cached = textures[name] { return cached }
        let result = SKTexture(imageNamed: name); result.filteringMode = .linear; textures[name] = result; return result
    }
    func apply(_ snapshot: HarbourSnapshot, selected: String?) {
        entities = snapshot.entities; current = snapshot
        let ids = Set(entities.map(\.id))
        for id in sprites.keys.filter({ !ids.contains($0) }) { sprites.removeValue(forKey: id)?.removeFromParent(); labels.removeValue(forKey: id)?.removeFromParent() }
        for e in entities {
            let node: SKSpriteNode
            if let existing = sprites[e.id] { node = existing }
            else {
                node = SKSpriteNode(); node.size = CGSize(width: 320, height: 320); node.name = e.id
                world.addChild(node); sprites[e.id] = node
                let label = SKLabelNode(fontNamed: "AvenirNext-DemiBold"); label.fontSize = 23
                label.fontColor = UIColor(red: 0.16, green: 0.25, blue: 0.23, alpha: 1)
                label.verticalAlignmentMode = .top; label.zPosition = 4000; world.addChild(label); labels[e.id] = label
            }
            if node.userData?["texture"] as? String != e.texture { node.texture = texture(e.texture); node.userData = ["texture": e.texture] }
            node.position = CGPoint(x: e.x, y: 2700 - e.y); node.zPosition = e.y
            node.alpha = e.stage == "unbuilt" ? 0.83 : 1
            labels[e.id]?.text = e.label
            labels[e.id]?.position = CGPoint(x: e.x, y: 2700 - e.y - 92)
            labels[e.id]?.isHidden = cameraNode.xScale > 3.8 && e.id != selected
        }
        if let selected, let e = entities.first(where: { $0.id == selected }) { selectionRing.position = CGPoint(x: e.x, y: 2700 - e.y - 25); selectionRing.isHidden = false }
        else { selectionRing.isHidden = true }
        let signature = "\(snapshot.style.oliveDensity)-\(snapshot.style.lanterns)-\(snapshot.style.marketStalls)-\(snapshot.style.tradeTraffic)-\(snapshot.style.repairedFacades)"
        if signature != styleSignature { styleSignature = signature; rebuildOrnaments(snapshot.style) }
        animateActivity(snapshot)
        if !initialFocus && size.width > 0 { initialFocus = true; focus(snapshot.deliveries == 0 ? "inland" : "harbour") }
    }
    private func rebuildOrnaments(_ style: WorldStyle) {
        ornaments.removeAllChildren()
        for i in 0..<max(0, min(16, style.oliveDensity - 14)) {
            let tree = SKSpriteNode(texture: texture("orchard-built"), size: CGSize(width: 90, height: 90))
            let y = CGFloat(280 + i / 6 * 122); tree.position = CGPoint(x: 195 + i % 6 * 139, y: 2700 - Int(y)); tree.zPosition = y - 10; ornaments.addChild(tree)
        }
        for i in 0..<min(7, style.marketStalls) {
            let stall = SKSpriteNode(texture: texture("market-built"), size: CGSize(width: 105, height: 105))
            let y = 1140 + i / 3 * 102; stall.position = CGPoint(x: 1010 + i % 3 * 147, y: 2700 - y); stall.zPosition = CGFloat(y - 1); ornaments.addChild(stall)
        }
        for i in 0..<min(9, style.lanterns) {
            let lantern = SKShapeNode(rectOf: CGSize(width: 10, height: 16), cornerRadius: 3)
            lantern.fillColor = UIColor(red: 0.98, green: 0.81, blue: 0.43, alpha: 1); lantern.strokeColor = .brown
            let y = 1430 + i / 4 * 138; lantern.position = CGPoint(x: 260 + i % 4 * 159, y: 2700 - y); lantern.zPosition = CGFloat(y + 1); ornaments.addChild(lantern)
        }
        for i in 0..<min(4, max(0, style.tradeTraffic - 1)) {
            let boat = SKSpriteNode(texture: texture("boat-built"), size: CGSize(width: 125, height: 125))
            boat.position = CGPoint(x: 1230 + i % 2 * 95, y: 2700 - (2000 + i * 125)); boat.zPosition = 3000; ornaments.addChild(boat)
        }
    }
    private func animateActivity(_ snapshot: HarbourSnapshot) {
        for slot in snapshot.boats.indices {
            guard let sprite = sprites["boat\(slot)"], let trip = snapshot.boats[slot]?.trip else { continue }
            if !reduceMotion {
                let progress = max(0, min(1, 1 - trip.left / trip.duration))
                let excursion = sin(progress * .pi)
                sprite.position.x = 1630 + excursion * 90
                sprite.position.y = CGFloat(2700 - (2100 + slot * 240)) + excursion * (trip.route == "quarry" ? 850 : 1350)
            }
        }
        if let mill = sprites["mill"] { mill.color = .white; mill.colorBlendFactor = snapshot.jobs.contains(where: { $0.name == "Mill flour" }) ? 0.10 : 0 }
    }
    override func didChangeSize(_ oldSize: CGSize) {
        if initialFocus { focus(focusedRegion) }
    }
    func focus(_ region: String) {
        focusedRegion = region
        let frame: CGRect
        switch region {
        case "inland": frame = CGRect(x: 80, y: 1730, width: 1500, height: 950)
        case "neighbourhood": frame = CGRect(x: 60, y: 1070, width: 910, height: 830)
        case "market": frame = CGRect(x: 860, y: 1030, width: 860, height: 880)
        case "coast": frame = CGRect(x: 1080, y: 100, width: 720, height: 1120)
        case "harbour": frame = CGRect(x: 230, y: 300, width: 1250, height: 900)
        default: frame = CGRect(x: 0, y: 0, width: 1800, height: 2700)
        }
        guard size.width > 0, size.height > 0 else { return }
        cameraNode.position = CGPoint(x: frame.midX, y: frame.midY)
        cameraNode.setScale(max(frame.width / size.width, frame.height / size.height) * 1.04)
        clampCamera()
    }
    func zoom(_ multiplier: CGFloat) { cameraNode.setScale(min(8, max(0.65, cameraNode.xScale * multiplier))); clampCamera() }
    func clampCamera() {
        let halfW = min(900, size.width * cameraNode.xScale / 2), halfH = min(1350, size.height * cameraNode.yScale / 2)
        cameraNode.position.x = max(halfW, min(1800 - halfW, cameraNode.position.x))
        cameraNode.position.y = max(halfH, min(2700 - halfH, cameraNode.position.y))
    }
    func tap(at screen: CGPoint, in view: SKView) {
        let candidates = entities.map { entity -> (WorldEntity, CGFloat) in
            let point = convertPoint(toView: CGPoint(x: entity.x, y: 2700 - entity.y))
            return (entity, hypot(point.x - screen.x, point.y - screen.y))
        }
        if let hit = candidates.min(by: { $0.1 < $1.1 }), hit.1 <= max(24, 100 / cameraNode.xScale) { onSelect?(hit.0) }
    }
}

struct HarbourMap: UIViewRepresentable {
    let scene: HarbourScene
    let snapshot: HarbourSnapshot?
    let selected: String?
    let reduceMotion: Bool
    let paused: Bool
    func makeUIView(context: Context) -> SKView {
        let view = SKView(); view.preferredFramesPerSecond = 30; view.ignoresSiblingOrder = true
        view.presentScene(scene)
        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pan(_:)))
        let pinch = UIPinchGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pinch(_:)))
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.tap(_:)))
        tap.require(toFail: pan); view.addGestureRecognizer(pan); view.addGestureRecognizer(pinch); view.addGestureRecognizer(tap)
        view.accessibilityIdentifier = "world-map"
        view.isAccessibilityElement = true; view.accessibilityLabel = "Little Harbour town map"
        view.accessibilityHint = "Use the Sites menu to select buildings with VoiceOver. District and zoom buttons are above the map."
        return view
    }
    func updateUIView(_ view: SKView, context: Context) {
        scene.reduceMotion = reduceMotion
        if let snapshot { scene.apply(snapshot, selected: selected) }
        view.accessibilityValue = String(format: "Zoom %.2f", 1 / scene.cameraNode.xScale)
        view.isPaused = paused
    }
    func makeCoordinator() -> Coordinator { Coordinator(scene: scene) }
    @MainActor final class Coordinator: NSObject {
        let scene: HarbourScene
        init(scene: HarbourScene) { self.scene = scene }
        @objc func pan(_ gesture: UIPanGestureRecognizer) {
            let delta = gesture.translation(in: gesture.view); gesture.setTranslation(.zero, in: gesture.view)
            scene.cameraNode.position.x -= delta.x * scene.cameraNode.xScale
            scene.cameraNode.position.y += delta.y * scene.cameraNode.yScale
            scene.clampCamera()
        }
        @objc func pinch(_ gesture: UIPinchGestureRecognizer) {
            guard let view = gesture.view as? SKView else { return }
            let point = gesture.location(in: view), before = scene.convertPoint(fromView: point)
            scene.zoom(1 / gesture.scale); gesture.scale = 1
            let after = scene.convertPoint(fromView: point)
            scene.cameraNode.position.x += before.x - after.x; scene.cameraNode.position.y += before.y - after.y
            scene.clampCamera()
            view.accessibilityValue = String(format: "Zoom %.2f", 1 / scene.cameraNode.xScale)
        }
        @objc func tap(_ gesture: UITapGestureRecognizer) { if let view = gesture.view as? SKView { scene.tap(at: gesture.location(in: view), in: view) } }
    }
}
