import Foundation

struct HarbourAction: Decodable, Identifiable {
    let id, category, title, detail, reason: String
    let enabled, destructive: Bool
    let goal: String?
}
struct WorldEntity: Decodable, Identifiable {
    let id, zone, kind, label, stage: String
    let x, y: Double
    let level: Int
    let ripe: Bool?
    let tab, select: String?
    var displayLabel: String {
        guard id.hasPrefix("plot"), stage != "unbuilt" else { return label }
        return ["home": "Town house", "carpenter": "Carpenter", "weaver": "Weaving studio", "sailmaker": "Sail loft", "square": "Public square", "flaxgarden": "Flax garden"][kind] ?? label
    }
    var texture: String {
        let type: String
        switch id {
        case "specialist": type = "specialist"
        case "kiln": type = "kiln"
        case "claypit": type = "clay"
        case "courtyard", "civic": type = "square"
        default: type = kind
        }
        let phase = stage == "unbuilt" || stage == "building" ? stage : (ripe == true ? "ripe" : (level > 1 ? "upgraded" : "built"))
        return type + "-" + phase
    }
    var category: String {
        if id == "pier" { return "Trade" }
        if id == "waterfront" { return "Waterfront" }
        if id == "lighthouse" { return "Lighthouse" }
        if id == "ferry" { return "Ferry" }
        if id == "civic" { return "Residents" }
        if ["specialist", "boatyard", "estate"].contains(id) && stage == "unbuilt" || (["olive", "fishing"].contains(id) && stage == "unbuilt") { return "Build" }
        if id.hasPrefix("boat") { return "Fleet" }
        if id.hasPrefix("plot") { return "Neighbourhood" }
        if tab == "market" { return "Market" }
        if tab == "inland" { return "Inland" }
        return "Production"
    }
}
struct Objective: Decodable {
    let title, description, chapterName: String
    let chapter: Int
    let target: String?
}
struct ProductionJob: Decodable, Identifiable {
    let id, name: String
    let left, duration: Double
}
struct LivingTown: Decodable {
    let axes: [String: Int]
    let season, choiceCount: Int
}
struct WorldStyle: Decodable {
    let identity: String
    let oliveDensity, lanterns, marketStalls, tradeTraffic, repairedFacades: Int
}
struct TownEvent: Decodable {
    struct Option: Decodable, Identifiable { let id, label: String }
    let title, description: String
    let options: [Option]
}
struct Boat: Decodable {
    struct Trip: Decodable { let left, duration: Double; let route: String; let ferry: Bool? }
    let type: String
    let trip: Trip?
}
struct HarbourSnapshot: Decodable {
    let coins, speed, deliveries: Int
    let seconds: Double
    let stock: [String: Int]
    let jobs: [ProductionJob]
    let objective: Objective
    let entities: [WorldEntity]
    let actions: [HarbourAction]
    let evolution: LivingTown
    let style: WorldStyle
    let event: TownEvent?
    let log: [String]
    let boats: [Boat?]
    var categories: [String] {
        let order = ["Production", "Queues", "Trade", "Build", "Contracts", "Waterfront", "Market", "Inland", "Fleet", "Circuits", "Lighthouse", "Destinations", "Neighbourhood", "Town layout", "Residents", "Ferry", "Refits", "Automation", "Reservations"]
        return order.filter { category in actions.contains { $0.category == category } }
    }
}
struct ProjectPlan: Decodable {
    struct Requirement: Decodable, Identifiable {
        let item: String
        let required, available, incoming, missing: Int
        var id: String { item }
    }
    struct Recipe: Decodable, Identifiable {
        let key, station: String
        let batches, queueable: Int
        let seconds: Double
        var id: String { key }
        var name: String {
            ["field":"Grow wheat", "mill":"Mill flour", "bakery":"Bake bread", "press":"Press olive oil", "saw":"Saw planks", "fittings":"Make boat fittings", "orchard0":"Harvest upper orchard", "garden0":"Harvest upper garden", "orchard1":"Harvest lower orchard", "garden1":"Harvest lower garden"][key] ?? key.replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression).capitalized
        }
    }
    struct Blocker: Decodable { let message: String }
    let title: String
    let ready: Bool
    let requirements: [Requirement]
    let recipes: [Recipe]
    let blockers: [Blocker]
}
let goodsNames = ["wheat":"Wheat", "flour":"Flour", "bread":"Bread", "olives":"Olives", "oil":"Olive oil", "fish":"Fish", "wood":"Timber", "stone":"Stone", "planks":"Planks", "boatparts":"Boat fittings", "grapes":"Grapes", "wine":"Wine", "provisions":"Provisions", "clay":"Clay", "fruit":"Fruit", "vegetables":"Vegetables", "jars":"Jars", "tiles":"Tiles", "preserves":"Preserves", "flax":"Flax", "cloth":"Cloth", "furniture":"Furniture", "sails":"Sails"]
