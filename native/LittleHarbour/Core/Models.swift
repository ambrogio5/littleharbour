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
        if id == "pier" { return stage == "unbuilt" ? "Build" : "Trade" }
        if id == "waterfront" { return "Waterfront" }
        if id == "lighthouse" { return "Lighthouse" }
        if id == "ferry" { return "Ferry" }
        if id == "civic" { return "Residents" }
        if ["specialist", "boatyard", "estate"].contains(id) && stage == "unbuilt" || (["olive", "fishing"].contains(id) && stage == "unbuilt") { return "Build" }
        if id == "boat0" || id == "boat1" { return "Fleet" }
        if stage == "built", ["kiln", "claypit", "terrace0", "terrace1", "boatyard", "estate"].contains(id) { return "Production" }
        if id.hasPrefix("plot"), stage == "built", ["carpenter", "weaver", "sailmaker", "flaxgarden"].contains(kind) { return "Production" }
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

extension HarbourAction {
    // Match structured engine arguments rather than translated display text.
    var invocation: (String, [Any])? {
        guard let raw = try? JSONSerialization.jsonObject(with: Data(id.utf8)) as? [Any], raw.count == 2,
              let name = raw[0] as? String, let args = raw[1] as? [Any] else { return nil }
        return (name, args)
    }
    var verb: String {
        guard let (name, _) = invocation else { return "Continue" }
        if name == "harvestReplant" { return "Harvest & replant" }
        if name == "start" { return "Start production" }
        if name.hasPrefix("dispatch") { return "Send shipment" }
        if name.hasPrefix("startFerry") { return "Launch service" }
        if name.hasPrefix("startVoyage") || name == "startCircuit" { return "Set sail" }
        if name.hasPrefix("build") || name == "invest" { return "Start building" }
        if name.hasPrefix("fund") { return "Fund project" }
        if name.hasPrefix("select") || name.hasPrefix("choose") { return "Choose" }
        if name.hasPrefix("buy") { return "Purchase" }
        if name.hasPrefix("upgrade") || name.hasPrefix("install") { return "Upgrade" }
        if name.hasPrefix("cancel") || name == "abandonContract" { return "Review cancellation" }
        if name.hasPrefix("remove") { return "Review redevelopment" }
        if name.hasPrefix("deliver") || name.hasPrefix("supply") { return "Deliver supplies" }
        return "Continue"
    }
    func belongs(to site: WorldEntity?) -> Bool {
        guard let site, let (name, args) = invocation else { return true }
        let first = args.first as? String ?? ""
        if site.id == "field" { return name == "harvestReplant" || first == "field" }
        let recipes: [String: [String]] = ["mill":["mill"], "bakery":["bakery"], "olive":["olives","press"], "fishing":["fishing"], "boatyard":["saw","fittings"], "estate":["grapes","wine"], "kiln":["jars","tiles","fruitPreserves","vegetablePreserves"], "claypit":["clay"], "terrace0":["orchard0","garden0"], "terrace1":["orchard1","garden1"], "carpenter":["furniture"], "weaver":["cloth"], "sailmaker":["sails"], "flaxgarden":["flax"]]
        if name == "start" || name == "setTarget" { return recipes[site.id.hasPrefix("plot") ? site.kind : site.id]?.contains(first) == true }
        if site.id.hasPrefix("plot"), let plot = Int(site.id.dropFirst(4)) { return (args.first as? Int) == plot }
        if ["boat0", "boat1"].contains(site.id), let berth = Int(site.id.dropFirst(4)) { return (args.first as? Int) == berth }
        if name == "build" { return first == site.id }
        if site.id == "pier" { return name == "upgrade" || category == "Trade" }
        // A system panel is already scoped to its harbour district.
        return category == site.category && !["Production", "Build", "Neighbourhood", "Fleet"].contains(category)
    }
}
