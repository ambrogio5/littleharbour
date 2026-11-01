import SwiftUI

// One palette for the world chrome, management panels and recovery screens.
enum HarbourTheme {
    static let ink = Color(red: 0.10, green: 0.25, blue: 0.27)
    static let paper = Color(red: 0.98, green: 0.96, blue: 0.91)
    static let sea = Color(red: 0.13, green: 0.39, blue: 0.41)
    static let gold = Color(red: 0.72, green: 0.45, blue: 0.16)
    static let muted = Color(red: 0.37, green: 0.43, blue: 0.40)
    static func symbol(_ category: String) -> String {
        ["Production":"leaf", "Queues":"clock", "Trade":"shippingbox", "Build":"hammer", "Contracts":"scroll", "Waterfront":"water.waves", "Market":"basket", "Inland":"sun.max", "Fleet":"sailboat", "Circuits":"arrow.triangle.branch", "Lighthouse":"light.beacon.max", "Destinations":"map", "Neighbourhood":"house", "Town layout":"square.grid.3x3", "Residents":"person.2", "Ferry":"ferry", "Refits":"wrench.and.screwdriver", "Automation":"arrow.triangle.2.circlepath", "Reservations":"archivebox", "Journal":"book.closed"][category] ?? "square.grid.2x2"
    }
    static func caption(_ category: String) -> String {
        ["Production":"From hillside harvests to harbour provisions.", "Trade":"Prepare your cargo. Bring the coast a little closer.", "Build":"Give your growing town somewhere to flourish.", "Fleet":"Equip your boats and chart the next voyage.", "Ferry":"Welcome passengers to your corner of the coast.", "Neighbourhood":"A place to live, make and belong.", "Journal":"The story your choices are writing.", "Queues":"Keep an eye on the work already underway."][category] ?? "Small decisions. A town of your own."
    }
    static func goodSymbol(_ good: String) -> String {
        ["wheat":"leaf", "flour":"bag", "bread":"birthday.cake", "wood":"tree", "stone":"mountain.2", "fish":"fish", "oil":"drop", "olives":"leaf.circle", "wine":"wineglass", "grapes":"circle.hexagongrid", "cloth":"square.stack", "sails":"sailboat", "provisions":"basket", "planks":"rectangle.split.3x1", "clay":"mountain.2", "fruit":"carrot", "vegetables":"carrot", "jars":"mug", "tiles":"square.grid.2x2", "preserves":"mug", "flax":"leaf", "boatparts":"gearshape", "furniture":"chair"][good] ?? "shippingbox"
    }
}

struct HarbourCard: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(16).background(.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(HarbourTheme.ink.opacity(0.07), lineWidth: 1))
    }
}
extension View { func harbourCard() -> some View { modifier(HarbourCard()) } }
