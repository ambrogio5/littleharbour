import Foundation
import CoreGraphics

/// Versioned presentation geography. Engine coordinates, plot IDs and saves never move.
enum BayLayout {
    static let version = 4
    static let minimumScale: CGFloat = 0.5
    static let size = CGSize(width: 3840, height: 2560)
    static let bounds = CGRect(origin: .zero, size: size)
    static let units: CGFloat = 2.5
    // Ground-contact anchors in the 1536×1024 source painting, measured from its top left.
    static let anchors: [String: CGPoint] = [
        "field": .init(x: 145, y: 170), "mill": .init(x: 250, y: 325),
        "olive": .init(x: 120, y: 440), "terrace0": .init(x: 530, y: 135),
        "terrace1": .init(x: 680, y: 125), "estate": .init(x: 1040, y: 155),
        "claypit": .init(x: 1250, y: 145), "kiln": .init(x: 1360, y: 245),
        // Two staggered terrace groups leave the central and eastern stairs open.
        "plot0": .init(x: 505, y: 250), "plot1": .init(x: 645, y: 230),
        "plot2": .init(x: 755, y: 270), "plot3": .init(x: 1020, y: 300),
        "plot4": .init(x: 1155, y: 325), "plot5": .init(x: 1360, y: 405),
        "bakery": .init(x: 605, y: 400), "courtyard": .init(x: 795, y: 405),
        "fishmonger": .init(x: 745, y: 475), "kitchen": .init(x: 930, y: 390),
        "market3": .init(x: 1050, y: 400), "civic": .init(x: 485, y: 370),
        // Ground contacts stay behind the quay wall, with room for the promenade.
        "boatyard": .init(x: 365, y: 520), "pier": .init(x: 1000, y: 475),
        "waterfront": .init(x: 1140, y: 435), "ferry": .init(x: 1260, y: 485),
        "fishing": .init(x: 125, y: 650), "lighthouse": .init(x: 1080, y: 765),
        "thirdberth": .init(x: 620, y: 480), "specialist": .init(x: 1050, y: 400),
        "chronicle-restoration": .init(x: 400, y: 425),
        "chronicle-exhibition": .init(x: 510, y: 470),
        "chronicle-seawall": .init(x: 1370, y: 550),
        "chronicle-belltower": .init(x: 740, y: 360),
        "chronicle-garden": .init(x: 1410, y: 170),
        "chronicle-school": .init(x: 860, y: 155),
        "chronicle-regatta": .init(x: 1280, y: 405),
        "chronicle-wintermarket": .init(x: 1220, y: 240)
    ]
    struct Placement: Equatable {
        var mirrored = false
        var scale: CGFloat = 1
        var xScale: CGFloat { mirrored ? -scale : scale }
    }
    // Facing belongs to the site, not its current business or construction phase.
    // Reflect the painted façade around its upright axis; rotating a flat sprite
    // in screen space would lean its walls instead of turning the building.
    private static let placements: [String: Placement] = [
        "plot0": .init(mirrored: true), "plot1": .init(scale: 0.92),
        "plot2": .init(scale: 0.98), "plot3": .init(mirrored: true, scale: 0.98),
        "plot4": .init(), "plot5": .init(mirrored: true, scale: 0.96),
        "estate": .init(mirrored: true, scale: 0.92), "terrace1": .init(mirrored: true, scale: 0.92),
        "kiln": .init(mirrored: true, scale: 0.92), "claypit": .init(scale: 0.88),
        "bakery": .init(mirrored: true), "kitchen": .init(mirrored: true, scale: 0.9),
        "market3": .init(scale: 0.9), "fishmonger": .init(scale: 0.9),
        "boatyard": .init(mirrored: true), "pier": .init(scale: 0.9),
        "waterfront": .init(mirrored: true, scale: 0.94), "ferry": .init(scale: 0.94),
        "fishing": .init(mirrored: true, scale: 0.86), "thirdberth": .init(mirrored: true, scale: 0.88),
        "chronicle-belltower": .init(scale: 0.88), "chronicle-school": .init(mirrored: true, scale: 0.92),
        "chronicle-restoration": .init(mirrored: true, scale: 0.9),
        "chronicle-exhibition": .init(scale: 0.88), "chronicle-regatta": .init(mirrored: true, scale: 0.82),
        "chronicle-wintermarket": .init(mirrored: true, scale: 0.88)
    ]
    private static func key(_ entity: WorldEntity) -> String {
        entity.kind == "market" && entity.x == 1230 && entity.y == 1530 ? "market3" : entity.id
    }
    static func placement(_ entity: WorldEntity) -> Placement {
        entity.kind == "boat" ? Placement() : placements[key(entity)] ?? Placement()
    }
    static let groundOffset: CGFloat = 120
    /// A decoration offset in the site's local ground plane, following its facing and size.
    static func groundDetail(_ entity: WorldEntity, x: CGFloat, y: CGFloat) -> CGPoint {
        let foot = ground(entity), p = placement(entity)
        return CGPoint(x: foot.x + x * p.xScale, y: foot.y + y * p.scale)
    }
    static func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
        CGPoint(x: x * units, y: size.height - y * units)
    }
    static func ground(_ entity: WorldEntity) -> CGPoint {
        let p = anchors[key(entity)] ?? CGPoint(x: entity.x / 1800 * 1300 + 100, y: entity.y / 2700 * 400 + 80)
        return point(p.x, p.y)
    }
    static func berth(_ slot: Int) -> CGPoint {
        let points = [CGPoint(x: 610, y: 615), CGPoint(x: 950, y: 605), CGPoint(x: 1190, y: 620)]
        let p = points[max(0, min(2, slot))]; return point(p.x, p.y)
    }
    static func position(_ entity: WorldEntity) -> CGPoint {
        if entity.kind == "boat", let slot = Int(entity.id.dropFirst(4)) { return berth(slot) }
        let p = ground(entity); return CGPoint(x: p.x, y: p.y + groundOffset * placement(entity).scale)
    }
    static func frame(_ region: String) -> CGRect {
        let r: CGRect
        switch region {
        case "inland": r = .init(x: 55, y: 55, width: 710, height: 430)
        case "neighbourhood": r = .init(x: 430, y: 165, width: 910, height: 240)
        case "market": r = .init(x: 520, y: 310, width: 730, height: 260)
        case "coast": r = .init(x: 810, y: 430, width: 650, height: 420)
        case "harbour": r = .init(x: 300, y: 350, width: 1060, height: 430)
        default: r = .init(x: 40, y: 40, width: 1460, height: 850)
        }
        return CGRect(x: r.minX * units, y: size.height - r.maxY * units, width: r.width * units, height: r.height * units)
    }
    /// Decorative people stay on connected ground, independently of the economy clock.
    static func residentRoute(_ id: String) -> (CGPoint, CGPoint) {
        let p: (CGPoint, CGPoint)
        switch id {
        case "farmer": p = (.init(x: 190, y: 200), .init(x: 265, y: 225))
        case "docker": p = (.init(x: 555, y: 440), .init(x: 700, y: 440))
        case "trader": p = (.init(x: 830, y: 465), .init(x: 930, y: 445))
        case "neighbour": p = (.init(x: 550, y: 285), .init(x: 685, y: 280))
        default: p = (.init(x: 650, y: 455), .init(x: 755, y: 455))
        }
        return (point(p.0.x, p.0.y), point(p.1.x, p.1.y))
    }
}
