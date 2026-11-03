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
    private var residents: [String: SKSpriteNode] = [:]
    private var residentRoutes: [TownResident] = []
    private var residentTime: TimeInterval = 0
    private var previousFrame: TimeInterval?
    private var lastSelectionTime: TimeInterval = -.infinity
    var showLabels = true
    private let textures: NSCache<NSString, SKTexture> = { let c = NSCache<NSString, SKTexture>(); c.totalCostLimit = 48 * 1024 * 1024; return c }()
    private var festivalSignature = ""
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
        let surround = SKSpriteNode(texture: texture("terrain-surround"), size: CGSize(width: 6000, height: 4000))
        surround.name = "landscape-surround"; surround.anchorPoint = .zero
        surround.position = CGPoint(x: -2450, y: -650); surround.zPosition = -10001; world.addChild(surround)
        let terrain = SKSpriteNode(texture: texture("terrain"), size: CGSize(width: 1800, height: 2700))
        terrain.shader = SKShader(source: """
        void main() {
            vec2 edge = min(v_tex_coord, vec2(1.0) - v_tex_coord);
            float blend = smoothstep(0.0, 0.055, edge.x) * smoothstep(0.0, 0.037, edge.y);
            gl_FragColor = texture2D(u_texture, v_tex_coord) * blend;
        }
        """)
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
        let value = MapViewport(version: 3, x: cameraNode.position.x, y: cameraNode.position.y, scale: max(0.65, cameraNode.xScale), region: focusedRegion)
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
            let boat = e.kind == "boat" ? Int(e.id.dropFirst(4)).flatMap { snapshot.boats.indices.contains($0) ? snapshot.boats[$0] : nil } : nil
            let artwork = boat.map { !reduceMotion && $0.trip != nil ? $0.sailingArtwork : $0.artwork } ?? e.texture
            node.size = CGSize(width: boat?.type == "cutter" ? 270 : 320, height: boat?.type == "cutter" ? 270 : 320)
            if node.userData?["texture"] as? String != artwork { node.texture = texture(artwork); node.userData = ["texture": artwork] }
            // A consistent soft ground contact; purely cosmetic, static under Reduce Motion.
            if e.kind != "boat" && node.childNode(withName: "ground-contact") == nil {
                let shadow = SKNode(); shadow.name = "ground-contact"; shadow.zPosition = -1
                for radius in stride(from: 3, through: 0, by: -1) {
                    let ellipse = SKShapeNode(ellipseOf: CGSize(width: 150 + radius * 18, height: 30 + radius * 7))
                    ellipse.fillColor = UIColor(red: 0.18, green: 0.19, blue: 0.12, alpha: 0.045)
                    ellipse.strokeColor = .clear; ellipse.position = CGPoint(x: 12, y: -86)
                    shadow.addChild(ellipse)
                }
                node.addChild(shadow)
            }
            node.childNode(withName: "ground-contact")?.isHidden = e.stage == "unbuilt"
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
        decorateFestival(snapshot.festival)
        animateActivity(snapshot)
        populateTown(snapshot)
        updateLabels()
        if !initialFocus && size.width > 0 && size.height > 0 {
            initialFocus = true
            if let viewport = restoredViewport {
                if let region = viewport.region { focus(region) }
                else {
                    focusedRegion = nil; cameraNode.position = CGPoint(x: viewport.x, y: viewport.y)
                    cameraNode.setScale(min(16, viewport.scale)); clampCamera()
                }
                restoredViewport = nil
            } else { focus(snapshot.deliveries == 0 ? "inland" : "harbour") }
        }
    }
    private func decorateFestival(_ festival: FestivalState) {
        let signature = "\(festival.stage)-\(festival.choice ?? "")"
        guard signature != festivalSignature else { return }
        festivalSignature = signature
        sprites["courtyard"]?.childNode(withName: "festival-decoration")?.removeFromParent()
        guard festival.stage > 0, let courtyard = sprites["courtyard"] else { return }
        let layer = SKNode(); layer.name = "festival-decoration"; layer.zPosition = 2; courtyard.addChild(layer)
        let wood = UIColor(red: 0.39, green: 0.25, blue: 0.13, alpha: 1)
        for x in [-130.0, 130.0] {
            let post = SKShapeNode(rectOf: CGSize(width: 7, height: 170), cornerRadius: 2)
            post.fillColor = wood; post.strokeColor = .clear; post.position = CGPoint(x: x, y: 15); layer.addChild(post)
        }
        let ropePath = CGMutablePath(); ropePath.move(to: CGPoint(x: -130, y: 100)); ropePath.addQuadCurve(to: CGPoint(x: 130, y: 100), control: CGPoint(x: 0, y: 48))
        let rope = SKShapeNode(path: ropePath); rope.strokeColor = wood; rope.lineWidth = 3; layer.addChild(rope)
        if festival.stage >= 2 {
            let colors: [UIColor] = [UIColor(red: 0.15, green: 0.46, blue: 0.49, alpha: 1), UIColor(red: 0.92, green: 0.64, blue: 0.26, alpha: 1), UIColor(red: 0.78, green: 0.32, blue: 0.23, alpha: 1)]
            for i in 0..<(festival.stage == 4 ? 9 : 5) {
                let x = CGFloat(-110 + i * (festival.stage == 4 ? 27 : 54)), y = 74 + 26 * pow(x / 130, 2)
                let path = CGMutablePath(); path.move(to: CGPoint(x: -9, y: 0)); path.addLine(to: CGPoint(x: 9, y: 0)); path.addLine(to: CGPoint(x: 2, y: -25)); path.closeSubpath()
                let flag = SKShapeNode(path: path); flag.fillColor = colors[i % colors.count]; flag.strokeColor = wood.withAlphaComponent(0.45); flag.lineWidth = 1; flag.position = CGPoint(x: x, y: y); layer.addChild(flag)
            }
            let stall = SKSpriteNode(texture: texture(festival.choice == "craft" ? "weaver-built" : "market-built"), size: CGSize(width: 130, height: 130))
            stall.position = CGPoint(x: -106, y: -32); stall.zPosition = 1; layer.addChild(stall)
        }
        if festival.stage >= 3 {
            for i in 0..<3 {
                let person = SKSpriteNode(texture: texture(["person-vendor", "person-docker", "person-farmer"][i]), size: CGSize(width: 40, height: 64))
                person.position = CGPoint(x: -15 + i * 46, y: -75 + i % 2 * 14); person.zPosition = 2; layer.addChild(person)
            }
        }
        if festival.stage == 4 {
            for x in [-130.0, 130.0] {
                let glow = SKShapeNode(ellipseOf: CGSize(width: 35, height: 35)); glow.fillColor = UIColor(red: 1, green: 0.76, blue: 0.32, alpha: 0.2); glow.strokeColor = .clear; glow.position = CGPoint(x: x, y: 82); layer.addChild(glow)
                let lantern = SKShapeNode(rectOf: CGSize(width: 12, height: 17), cornerRadius: 3); lantern.fillColor = UIColor(red: 1, green: 0.83, blue: 0.47, alpha: 1); lantern.strokeColor = wood; lantern.position = glow.position; layer.addChild(lantern)
            }
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
            let boat = SKSpriteNode(texture: texture(i.isMultiple(of: 2) ? "vessel-cutter" : "vessel-coaster"), size: CGSize(width: 125, height: 125))
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
                let pose = VesselPose.at(slot: slot, trip: trip)
                let excursion = sin(trip.progress * .pi)
                sprite.position = pose.position
                sprite.zPosition = 2700 - sprite.position.y
                if sprite.childNode(withName: "wake") == nil {
                    let path = CGMutablePath()
                    for offset in [0, 18, 36] {
                        path.move(to: CGPoint(x: -52 - offset / 2, y: -66 - offset))
                        path.addQuadCurve(to: CGPoint(x: 52 + offset / 2, y: -66 - offset), control: CGPoint(x: 0, y: -94 - offset))
                    }
                    let wake = SKShapeNode(path: path); wake.name = "wake"; wake.strokeColor = UIColor(white: 1, alpha: 0.65); wake.lineWidth = 3; wake.zPosition = -1; sprite.addChild(wake)
                }
                if let wake = sprite.childNode(withName: "wake") {
                    wake.position = CGPoint(x: 0, y: -75)
                    wake.zRotation = pose.heading - .pi / 2
                    wake.alpha = CGFloat(min(0.85, excursion * 2))
                }
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
        default: frame = CGRect(x: -120, y: -180, width: 2040, height: 3060)
        }
        guard size.width > 0, size.height > 0 else { return }
        cameraNode.position = CGPoint(x: frame.midX, y: frame.midY)
        let horizontal = frame.width / size.width, vertical = frame.height / size.height
        // Districts favour readable buildings on tall screens; Whole town fits all geography.
        cameraNode.setScale((region == "all" ? max(horizontal, vertical) : sqrt(horizontal * vertical)) * 1.04)
        clampCamera()
        // District shortcuts frame the painted land; expanded margins are for manual exploration.
        if region != "all" {
            let halfW = min(900, size.width * cameraNode.xScale / 2), halfH = min(1350, size.height * cameraNode.yScale / 2)
            cameraNode.position.x = max(halfW, min(1800 - halfW, cameraNode.position.x))
            cameraNode.position.y = max(halfH, min(2700 - halfH, cameraNode.position.y))
        }
        persistViewport()
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
        cameraNode.setScale(min(16, max(0.65, cameraNode.xScale * multiplier))); clampCamera()
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
        guard size.width > 0, size.height > 0 else { return }
        // Clamp the visible viewport, not only its centre, to the painted surround.
        let maximum = min(16, 6000 / size.width, 4000 / size.height)
        cameraNode.setScale(min(maximum, max(0.65, cameraNode.xScale)))
        let halfW = size.width * cameraNode.xScale / 2, halfH = size.height * cameraNode.yScale / 2
        cameraNode.position.x = max(-2450 + halfW, min(3550 - halfW, cameraNode.position.x))
        cameraNode.position.y = max(-650 + halfH, min(3350 - halfH, cameraNode.position.y))
        updateLabels(); onZoomChange?(cameraNode.xScale)
    }
    /// Uses the visible building silhouette area, including roofs, instead of a tiny centre target.
    func site(at point: CGPoint) -> WorldEntity? {
        let tolerance = min(70, 18 * cameraNode.xScale)
        return entities.compactMap { entity -> (WorldEntity, CGFloat)? in
            guard let sprite = sprites[entity.id] else { return nil }
            let dx = abs(point.x - sprite.position.x), dy = abs(point.y - sprite.position.y)
            let radius = sprite.size.width * 0.43
            guard dx <= radius + tolerance, dy <= radius + tolerance else { return nil }
            let score = hypot(dx / (radius + tolerance), dy / (radius + tolerance))
            return score <= 1.15 ? (entity, score) : nil
        }.min { $0.1 < $1.1 }?.0
    }
    func tap(at screen: CGPoint, in view: SKView) {
        let now = ProcessInfo.processInfo.systemUptime
        guard now - lastSelectionTime > 0.35, let hit = site(at: convertPoint(fromView: screen)) else { return }
        lastSelectionTime = now; onSelect?(hit)
    }
    private func populateTown(_ snapshot: HarbourSnapshot) {
        residentRoutes = TownResident.routes(in: snapshot)
        let ids = Set(residentRoutes.map(\.id))
        for id in residents.keys.filter({ !ids.contains($0) }) { residents.removeValue(forKey: id)?.removeFromParent() }
        for route in residentRoutes where residents[route.id] == nil {
            let person = SKSpriteNode(texture: texture(route.artwork), size: CGSize(width: 86, height: 86))
            person.name = "resident-" + route.id; person.anchorPoint = CGPoint(x: 0.5, y: 0.08)
            residents[route.id] = person; world.addChild(person)
        }
        positionResidents()
    }
    private func positionResidents() {
        for route in residentRoutes {
            guard let person = residents[route.id] else { continue }
            let phase = reduceMotion ? route.offset : residentTime / route.duration + route.offset
            let cycle = phase.truncatingRemainder(dividingBy: 2)
            let progress = cycle <= 1 ? cycle : 2 - cycle
            let p = CGPoint(x: route.start.x + (route.end.x - route.start.x) * progress, y: route.start.y + (route.end.y - route.start.y) * progress)
            let bob = !reduceMotion && current?.speed != 0 ? abs(sin(residentTime * 5 + route.offset)) * 2 : 0
            person.position = CGPoint(x: p.x, y: 2700 - p.y + bob)
            person.zPosition = p.y + 1
            person.xScale = cycle <= 1 ? 1 : -1
        }
    }
    override func update(_ currentTime: TimeInterval) {
        let elapsed = previousFrame.map { max(0, min(0.1, currentTime - $0)) } ?? 0
        previousFrame = currentTime
        if !reduceMotion && (current?.speed ?? 0) > 0 { residentTime += elapsed; positionResidents() }
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
        tap.require(toFail: pan); tap.require(toFail: pinch); view.addGestureRecognizer(pan); view.addGestureRecognizer(pinch); view.addGestureRecognizer(tap)
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
