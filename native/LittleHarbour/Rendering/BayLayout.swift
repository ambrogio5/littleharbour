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
        "terrace1": .init(x: 680, y: 130), "estate": .init(x: 1060, y: 135),
        "claypit": .init(x: 1310, y: 135), "kiln": .init(x: 1380, y: 315),
        "plot0": .init(x: 500, y: 265), "plot1": .init(x: 630, y: 265),
        "plot2": .init(x: 760, y: 265), "plot3": .init(x: 1000, y: 315),
        "plot4": .init(x: 1135, y: 315), "plot5": .init(x: 1260, y: 315),
        "bakery": .init(x: 625, y: 420), "courtyard": .init(x: 780, y: 425),
        "fishmonger": .init(x: 800, y: 505), "kitchen": .init(x: 950, y: 450),
        "market3": .init(x: 1010, y: 395), "civic": .init(x: 510, y: 380),
        "boatyard": .init(x: 425, y: 505), "pier": .init(x: 1000, y: 510),
        "waterfront": .init(x: 1135, y: 450), "ferry": .init(x: 1250, y: 535),
        "fishing": .init(x: 190, y: 640), "lighthouse": .init(x: 1080, y: 775),
        "thirdberth": .init(x: 660, y: 560),
        "chronicle-restoration": .init(x: 370, y: 440),
        "chronicle-exhibition": .init(x: 555, y: 510),
        "chronicle-seawall": .init(x: 1370, y: 580),
        "chronicle-belltower": .init(x: 860, y: 345),
        "chronicle-garden": .init(x: 1410, y: 200),
        "chronicle-school": .init(x: 855, y: 160),
        "chronicle-regatta": .init(x: 1305, y: 440),
        "chronicle-wintermarket": .init(x: 1230, y: 215)
    ]
    static func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
        CGPoint(x: x * units, y: size.height - y * units)
    }
    static func ground(_ entity: WorldEntity) -> CGPoint {
        let key = entity.kind == "market" && entity.x == 1230 && entity.y == 1530 ? "market3" : entity.id
        let p = anchors[key] ?? CGPoint(x: entity.x / 1800 * 1300 + 100, y: entity.y / 2700 * 400 + 80)
        return point(p.x, p.y)
    }
    static func berth(_ slot: Int) -> CGPoint {
        let points = [CGPoint(x: 610, y: 615), CGPoint(x: 950, y: 605), CGPoint(x: 1190, y: 620)]
        let p = points[max(0, min(2, slot))]; return point(p.x, p.y)
    }
    static func position(_ entity: WorldEntity) -> CGPoint {
        if entity.kind == "boat", let slot = Int(entity.id.dropFirst(4)) { return berth(slot) }
        let p = ground(entity); return CGPoint(x: p.x, y: p.y + 110)
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
        case "docker": p = (.init(x: 590, y: 475), .init(x: 710, y: 475))
        case "trader": p = (.init(x: 800, y: 465), .init(x: 920, y: 465))
        case "neighbour": p = (.init(x: 530, y: 290), .init(x: 735, y: 290))
        default: p = (.init(x: 650, y: 455), .init(x: 755, y: 455))
        }
        return (point(p.0.x, p.0.y), point(p.1.x, p.1.y))
    }
}
