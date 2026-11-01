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
        ["Production":"From hillside harvests to harbour provisions.", "Trade":"Prepare your cargo. Bring the coast a little closer.", "Build":"Give your growing town somewhere to flourish.", "Fleet":"Equip your boats and chart the next voyage.", "Ferry":"Welcome passengers to your corner of the coast.", "Neighbourhood":"A place to live, make and belong.", "Journal":"The story your choices are writing.", "Queues":"Keep an eye on the work already underway.", "Contracts":"Fulfil coastal requests and establish your charter.", "Waterfront":"Restore the waterfront, one delivery at a time.", "Market":"Bring fresh life to the market quarter.", "Inland":"Plant terraces and make room for new harvests.", "Circuits":"Plan your fleet’s repeating trade routes.", "Lighthouse":"Restore a landmark and open the coast.", "Destinations":"Build lasting coastal partnerships.", "Town layout":"Arrange the places your neighbours call home.", "Residents":"Help your neighbours shape their shared space.", "Refits":"Prepare your boats for the work ahead.", "Automation":"Set targets for your working town.", "Reservations":"Keep materials aside for your next project."][category] ?? "Small decisions. A town of your own."
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

struct ResourceIcon: View {
    let item: String
    var size: CGFloat = 36
    var body: some View {
        Image(uiImage: HarbourArtwork.image("good-" + item)).resizable().scaledToFit()
            .frame(width: size, height: size).accessibilityHidden(true)
    }
}

extension HarbourTheme {
    static func artwork(_ category: String) -> String {
        ["Production":"mill-built", "Trade":"boat-built", "Build":"home-building", "Contracts":"market-built", "Waterfront":"waterfront-built", "Market":"market-built", "Inland":"orchard-built", "Fleet":"boat-upgraded", "Circuits":"boat-built", "Lighthouse":"lighthouse-built", "Destinations":"ferry-built", "Neighbourhood":"home-built", "Town layout":"square-built", "Residents":"garden-built", "Ferry":"ferry-built", "Refits":"boatyard-built", "Automation":"mill-built", "Reservations":"carpenter-built", "Queues":"bakery-built", "Journal":"square-built"][category] ?? "home-built"
    }
}
