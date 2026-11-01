import SpriteKit
import UIKit
import SwiftUI

@MainActor final class HarbourScene: SKScene {
    let world = SKNode()
    let cameraNode = SKCameraNode()
    private let ornaments = SKNode()
    private var sprites: [String: SKSpriteNode] = [:]
    private var labels: [String: SKLabelNode] = [:]
    private var labelPlates: [String: SKShapeNode] = [:]
    private var badges: [String: SKLabelNode] = [:]
    private var selectedID: String?
    var showLabels = true
    private let textures: NSCache<NSString, SKTexture> = { let c = NSCache<NSString, SKTexture>(); c.totalCostLimit = 48 * 1024 * 1024; return c }()
    private var activitySignature = ""
    private var entities: [WorldEntity] = []
    private var current: HarbourSnapshot?
    private var styleSignature = ""
    private var initialFocus = false
    private var focusedRegion: String? = "inland"
    private var viewportPreferences: UserDefaults?
    private var viewportKey = "mapViewport"
    private var restoredViewport: MapViewport?
    private var selectionRing = SKShapeNode(ellipseOf: CGSize(width: 225, height: 116))
    var reduceMotion = false
    var onSelect: ((WorldEntity) -> Void)?
    var onZoomChange: ((CGFloat) -> Void)?
    override init(size: CGSize) {
        super.init(size: size)
        scaleMode = .resizeFill; backgroundColor = UIColor(red: 0.08, green: 0.39, blue: 0.49, alpha: 1)
        addChild(world); addChild(cameraNode); camera = cameraNode
        // A restrained sea-chart surround makes fitted-map margins intentional.
        let waves = CGMutablePath()
        for row in -12...20 {
            for column in -14...20 {
                let x = CGFloat(column * 260 + (row.isMultiple(of: 2) ? 0 : 130)), y = CGFloat(row * 190)
                waves.move(to: CGPoint(x: x, y: y))
                waves.addCurve(to: CGPoint(x: x + 66, y: y), control1: CGPoint(x: x + 22, y: y + 10), control2: CGPoint(x: x + 44, y: y - 10))
            }
        }
        let seaMarks = SKShapeNode(path: waves); seaMarks.strokeColor = UIColor(white: 1, alpha: 0.085)
        seaMarks.lineWidth = 2; seaMarks.zPosition = -10001; world.addChild(seaMarks)
        let terrain = SKSpriteNode(texture: texture("terrain"), size: CGSize(width: 1800, height: 2700))
        terrain.anchorPoint = .zero; terrain.position = .zero; terrain.zPosition = -10000; world.addChild(terrain)
        world.addChild(ornaments)
        selectionRing.strokeColor = UIColor(red: 1, green: 0.87, blue: 0.55, alpha: 1)
        selectionRing.lineWidth = 4; selectionRing.fillColor = UIColor(red: 1, green: 0.88, blue: 0.58, alpha: 0.15); selectionRing.zPosition = 1; selectionRing.isHidden = true; world.addChild(selectionRing)
    }
    required init?(coder: NSCoder) { fatalError("Use init(size:)") }
    func configureViewport(preferences: UserDefaults?, key: String = "mapViewport") {
        guard !initialFocus else { return }
        viewportPreferences = preferences; viewportKey = key
        restoredViewport = MapViewport.decode(preferences?.data(forKey: key))
    }
    func persistViewport() {
        guard initialFocus, let preferences = viewportPreferences else { return }
        let value = MapViewport(version: 1, x: cameraNode.position.x, y: cameraNode.position.y, scale: max(0.65, cameraNode.xScale), region: focusedRegion)
        if value.isValid, let data = try? JSONEncoder().encode(value), preferences.data(forKey: viewportKey) != data { preferences.set(data, forKey: viewportKey) }
    }
    // Presentation anchors align fixed coastal landmarks to the painted shore.
    // Saved neighbourhood plots and all economic coordinates remain untouched.
    func mapPosition(_ entity: WorldEntity) -> CGPoint {
        let shore: [String: CGPoint] = ["pier": CGPoint(x: 1150, y: 2320), "fishing": CGPoint(x: 530, y: 2120), "ferry": CGPoint(x: 1400, y: 2060), "lighthouse": CGPoint(x: 1510, y: 1780)]
        let p = shore[entity.id] ?? CGPoint(x: entity.x, y: entity.y)
        return CGPoint(x: p.x, y: 2700 - p.y)
    }
    private func texture(_ name: String) -> SKTexture {
        if let cached = textures.object(forKey: name as NSString) { return cached }
        let result = SKTexture(imageNamed: name); result.filteringMode = .linear; textures.setObject(result, forKey: name as NSString, cost: Int(result.size().width * result.size().height * 4)); return result
    }
    func apply(_ snapshot: HarbourSnapshot, selected: String?) {
        entities = snapshot.entities; current = snapshot; selectedID = selected
        let ids = Set(entities.map(\.id))
        for id in sprites.keys.filter({ !ids.contains($0) }) { sprites.removeValue(forKey: id)?.removeFromParent(); labels.removeValue(forKey: id)?.removeFromParent(); labelPlates.removeValue(forKey: id)?.removeFromParent(); badges.removeValue(forKey: id)?.removeFromParent() }
        for e in entities {
            let node: SKSpriteNode
            if let existing = sprites[e.id] { node = existing }
            else {
                node = SKSpriteNode(); node.size = CGSize(width: 320, height: 320); node.name = e.id
                world.addChild(node); sprites[e.id] = node
                let label = SKLabelNode(fontNamed: "AvenirNext-DemiBold"); label.fontSize = 23
                label.fontColor = UIColor(red: 0.10, green: 0.25, blue: 0.27, alpha: 1)
                label.verticalAlignmentMode = .center; label.zPosition = 4001; world.addChild(label); labels[e.id] = label
                let plate = SKShapeNode(); plate.fillColor = UIColor(red: 0.99, green: 0.97, blue: 0.91, alpha: 0.94); plate.strokeColor = UIColor(red: 0.25, green: 0.39, blue: 0.36, alpha: 0.18); plate.lineWidth = 1; plate.zPosition = 4000; world.addChild(plate); labelPlates[e.id] = plate
                let badge = SKLabelNode(fontNamed: "AvenirNext-Bold"); badge.fontSize = 22; badge.fontColor = UIColor(red: 0.12, green: 0.35, blue: 0.31, alpha: 1); badge.zPosition = 4002; world.addChild(badge); badges[e.id] = badge
            }
            if node.userData?["texture"] as? String != e.texture { node.texture = texture(e.texture); node.userData = ["texture": e.texture] }
            node.position = mapPosition(e); node.zPosition = 2700 - mapPosition(e).y
            node.alpha = e.stage == "unbuilt" ? 0.74 : 1
            labels[e.id]?.text = e.displayLabel
            labels[e.id]?.position = CGPoint(x: mapPosition(e).x, y: mapPosition(e).y - 124)
            badges[e.id]?.text = e.ripe == true ? "✦" : e.stage == "building" ? "•••" : nil
            badges[e.id]?.position = CGPoint(x: mapPosition(e).x + 91, y: mapPosition(e).y + 84)
            if let badge = badges[e.id] {
                if !reduceMotion && snapshot.speed > 0 && e.ripe == true {
                    if badge.action(forKey: "ready") == nil { badge.run(.repeatForever(.sequence([.fadeAlpha(to: 0.45, duration: 0.8), .fadeAlpha(to: 1, duration: 0.8)])), withKey: "ready") }
                } else { badge.removeAllActions(); badge.alpha = 1 }
            }
        }
        if let selected, let e = entities.first(where: { $0.id == selected }) { selectionRing.position = CGPoint(x: mapPosition(e).x, y: mapPosition(e).y - 60); selectionRing.zPosition = 2700 - mapPosition(e).y - 0.5; selectionRing.isHidden = false }
        else { selectionRing.isHidden = true }
        let signature = "\(snapshot.style.oliveDensity)-\(snapshot.style.lanterns)-\(snapshot.style.marketStalls)-\(snapshot.style.tradeTraffic)-\(snapshot.style.repairedFacades)"
        if signature != styleSignature { styleSignature = signature; rebuildOrnaments(snapshot.style) }
        animateActivity(snapshot)
        updateLabels()
        if !initialFocus && size.width > 0 && size.height > 0 {
            initialFocus = true
            if let viewport = restoredViewport {
                if let region = viewport.region { focus(region) }
                else {
                    focusedRegion = nil; cameraNode.position = CGPoint(x: viewport.x, y: viewport.y)
                    cameraNode.setScale(min(8, viewport.scale)); clampCamera()
                }
                restoredViewport = nil
            } else { focus(snapshot.deliveries == 0 ? "inland" : "harbour") }
        }
    }
    private func rebuildOrnaments(_ style: WorldStyle) {
        ornaments.removeAllChildren()
        for i in 0..<max(0, min(16, style.oliveDensity - 14)) {
            let tree = SKSpriteNode(texture: texture("olive-tree"), size: CGSize(width: 90, height: 90))
            let y = CGFloat(280 + i * 94); tree.position = CGPoint(x: 105 + i % 2 * 55, y: 2700 - Int(y)); tree.zPosition = y - 10; ornaments.addChild(tree)
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
            boat.position = CGPoint(x: 1680 + i % 2 * 70, y: 2700 - (1370 + i * 150)); boat.zPosition = 3000; ornaments.addChild(boat)
        }
    }
    private func animateActivity(_ snapshot: HarbourSnapshot) {
        let working = Set(snapshot.jobs.map(\.name))
        let signature = "\(reduceMotion)-\(snapshot.speed)-" + working.sorted().joined(separator: ",")
        if signature != activitySignature {
            activitySignature = signature
            for sprite in sprites.values { sprite.childNode(withName: "work-effect")?.removeFromParent() }
            if !reduceMotion && snapshot.speed > 0 {
                for (id, names) in [("bakery", ["Bake bread"]), ("kiln", ["Fire jars", "Fire tiles"])] where names.contains(where: working.contains) {
                    guard let sprite = sprites[id] else { continue }
                    let effect = SKNode(); effect.name = "work-effect"; effect.zPosition = 1; sprite.addChild(effect)
                    for i in 0..<3 {
                        let puff = SKShapeNode(ellipseOf: CGSize(width: 12, height: 9)); puff.fillColor = UIColor(white: 1, alpha: 0.42); puff.strokeColor = .clear; puff.alpha = 0; effect.addChild(puff)
                        puff.run(.sequence([.wait(forDuration: Double(i) * 0.7), .repeatForever(.sequence([
                            .run { [weak puff] in puff?.position = CGPoint(x: 20, y: 91); puff?.setScale(0.6); puff?.alpha = 0.55 },
                            .group([.moveBy(x: 24, y: 50, duration: 2.4), .scale(to: 2, duration: 2.4), .fadeOut(withDuration: 2.4)])
                        ]))]))
                    }
                }
            }
        }
        for slot in snapshot.boats.indices {
            guard let sprite = sprites["boat\(slot)"] else { continue }
            guard let trip = snapshot.boats[slot]?.trip else { sprite.childNode(withName: "wake")?.removeFromParent(); continue }
            if !reduceMotion {
                let progress = max(0, min(1, 1 - trip.left / trip.duration))
                let excursion = sin(progress * .pi)
                sprite.position.x = 1630 + excursion * 90
                sprite.position.y = CGFloat(2700 - (2100 + slot * 240)) + excursion * (trip.route == "quarry" ? 850 : 1350)
                sprite.zPosition = 2700 - sprite.position.y
                if sprite.childNode(withName: "wake") == nil {
                    let path = CGMutablePath()
                    for offset in [0, 18, 36] {
                        path.move(to: CGPoint(x: -52 - offset / 2, y: -66 - offset))
                        path.addQuadCurve(to: CGPoint(x: 52 + offset / 2, y: -66 - offset), control: CGPoint(x: 0, y: -94 - offset))
                    }
                    let wake = SKShapeNode(path: path); wake.name = "wake"; wake.strokeColor = UIColor(white: 1, alpha: 0.65); wake.lineWidth = 3; wake.zPosition = -1; sprite.addChild(wake)
                }
                sprite.childNode(withName: "wake")?.alpha = CGFloat(min(0.85, excursion * 2))
            } else { sprite.childNode(withName: "wake")?.removeFromParent() }
        }
        // Labels and selection travel with the real boat, rather than staying at its berth.
        for e in entities where e.kind == "boat" {
            guard let boat = sprites[e.id] else { continue }
            labels[e.id]?.position = CGPoint(x: boat.position.x, y: boat.position.y - 124)
            if selectedID == e.id { selectionRing.position = CGPoint(x: boat.position.x, y: boat.position.y - 60); selectionRing.zPosition = boat.zPosition - 0.5 }
        }
    }
    override func didChangeSize(_ oldSize: CGSize) {
        guard size.width > 0, size.height > 0 else { return }
        guard initialFocus else {
            // A paused save may publish its only snapshot before SKView has a size.
            if let current { apply(current, selected: selectedID) }
            return
        }
        if let region = focusedRegion { focus(region) }
        else { clampCamera(); persistViewport() }
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
        let horizontal = frame.width / size.width, vertical = frame.height / size.height
        // Districts favour readable buildings on tall screens; Whole town fits all geography.
        cameraNode.setScale((region == "all" ? max(horizontal, vertical) : sqrt(horizontal * vertical)) * 1.04)
        clampCamera(); persistViewport()
    }
    private func updateLabels() {
        var candidates: [MapLabelLayout.Candidate] = []
        for e in entities {
            guard let label = labels[e.id], let plate = labelPlates[e.id] else { continue }
            label.fontSize = min(36, max(20, 11 * cameraNode.xScale))
            let rect = CGRect(x: -label.frame.width / 2 - 12, y: -label.frame.height / 2 - 7, width: label.frame.width + 24, height: label.frame.height + 14)
            plate.path = CGPath(roundedRect: rect, cornerWidth: 10, cornerHeight: 10, transform: nil)
            plate.position = label.position
            if e.id == selectedID || (showLabels && cameraNode.xScale < 3.5 && e.stage != "unbuilt") {
                let box = rect.offsetBy(dx: label.position.x, dy: label.position.y).insetBy(dx: -5 * cameraNode.xScale, dy: -4 * cameraNode.xScale)
                candidates.append(.init(id: e.id, frame: box, priority: e.id == selectedID ? 100 : e.ripe == true ? 20 : 10))
            }
            badges[e.id]?.isHidden = cameraNode.xScale > 3.8
        }
        let visible = MapLabelLayout.visible(candidates)
        for e in entities { labels[e.id]?.isHidden = !visible.contains(e.id); labelPlates[e.id]?.isHidden = !visible.contains(e.id) }
    }
    func focusSite(_ entity: WorldEntity) {
        focusedRegion = nil
        cameraNode.position = sprites[entity.id]?.position ?? mapPosition(entity)
        cameraNode.setScale(min(1.6, max(0.9, cameraNode.xScale)))
        clampCamera(); persistViewport()
    }
    func zoom(_ multiplier: CGFloat, persist: Bool = true) {
        guard multiplier.isFinite, multiplier > 0 else { return }
        focusedRegion = nil
        cameraNode.setScale(min(8, max(0.65, cameraNode.xScale * multiplier))); clampCamera()
        if persist { persistViewport() }
    }
    func pan(by delta: CGPoint) {
        guard delta.x.isFinite, delta.y.isFinite else { return }
        focusedRegion = nil
        cameraNode.position.x -= delta.x * cameraNode.xScale
        cameraNode.position.y += delta.y * cameraNode.yScale
        clampCamera()
    }
    func clampCamera() {
        let halfW = min(900, size.width * cameraNode.xScale / 2), halfH = min(1350, size.height * cameraNode.yScale / 2)
        cameraNode.position.x = max(halfW, min(1800 - halfW, cameraNode.position.x))
        cameraNode.position.y = max(halfH, min(2700 - halfH, cameraNode.position.y))
        updateLabels(); onZoomChange?(cameraNode.xScale)
    }
    func tap(at screen: CGPoint, in view: SKView) {
        let candidates = entities.map { entity -> (WorldEntity, CGFloat) in
            let renderedPosition = sprites[entity.id]?.position ?? CGPoint(x: entity.x, y: 2700 - entity.y)
            let point = convertPoint(toView: renderedPosition)
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
    let showLabels: Bool
    let paused: Bool
    func makeUIView(context: Context) -> SKView {
        let view = SKView(); view.preferredFramesPerSecond = 30; view.ignoresSiblingOrder = true
        view.presentScene(scene)
        scene.onZoomChange = { [weak view] scale in view?.accessibilityValue = String(format: "Zoom %.2f", 1 / scale) }
        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pan(_:)))
        let pinch = UIPinchGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pinch(_:)))
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.tap(_:)))
        tap.require(toFail: pan); view.addGestureRecognizer(pan); view.addGestureRecognizer(pinch); view.addGestureRecognizer(tap)
        view.accessibilityIdentifier = "world-map"
        view.isAccessibilityElement = true; view.accessibilityLabel = "Little Harbour town map"
        view.accessibilityHint = "Use Sites to search and select buildings with VoiceOver. District and zoom buttons are above the map."
        return view
    }
    func updateUIView(_ view: SKView, context: Context) {
        scene.reduceMotion = reduceMotion; scene.showLabels = showLabels
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
            scene.pan(by: delta)
            if gesture.state == .ended || gesture.state == .cancelled { scene.persistViewport() }
        }
        @objc func pinch(_ gesture: UIPinchGestureRecognizer) {
            guard let view = gesture.view as? SKView else { return }
            let point = gesture.location(in: view), before = scene.convertPoint(fromView: point)
            scene.zoom(1 / gesture.scale, persist: false); gesture.scale = 1
            let after = scene.convertPoint(fromView: point)
            scene.cameraNode.position.x += before.x - after.x; scene.cameraNode.position.y += before.y - after.y
            scene.clampCamera()
            if gesture.state == .ended || gesture.state == .cancelled { scene.persistViewport() }
            view.accessibilityValue = String(format: "Zoom %.2f", 1 / scene.cameraNode.xScale)
        }
        @objc func tap(_ gesture: UITapGestureRecognizer) { if let view = gesture.view as? SKView { scene.tap(at: gesture.location(in: view), in: view) } }
    }
}

@MainActor enum HarbourArtwork {
    private static let cache: NSCache<NSString, UIImage> = { let c = NSCache<NSString, UIImage>(); c.totalCostLimit = 12 * 1024 * 1024; return c }()
    static func image(_ name: String) -> UIImage {
        if let image = cache.object(forKey: name as NSString) { return image }
        let image = Bundle.main.path(forResource: name, ofType: "png").flatMap { UIImage(contentsOfFile: $0) } ?? UIImage(systemName: "building.2") ?? UIImage()
        cache.setObject(image, forKey: name as NSString, cost: Int(image.size.width * image.size.height * image.scale * image.scale * 4))
        return image
    }
}
