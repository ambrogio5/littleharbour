import Foundation

struct HarbourAction: Decodable, Identifiable {
    let id, category, title, detail, reason: String
    let enabled, destructive: Bool
    let goal: String?
    let partner: String?
}
struct WorldEntity: Decodable, Identifiable {
    let id, zone, kind, label, stage: String
    let x, y: Double
    let level: Int
    let ripe: Bool?
    let tab, select: String?
    let artwork: String?
    var displayLabel: String {
        guard id.hasPrefix("plot"), stage != "unbuilt" else { return label }
        return ["home": "Town house", "carpenter": "Carpenter", "weaver": "Weaving studio", "sailmaker": "Sail loft", "square": "Public square", "flaxgarden": "Flax garden"][kind] ?? label
    }
    var texture: String {
        if let artwork, stage == "built" { return artwork }
        if id.hasPrefix("chronicle-") { return stage == "unbuilt" ? "home-unbuilt" : stage == "building" ? id + "-construction" : id + (level == 2 ? "-alternate" : "") }
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
        if tab == "goals" { return "Goals" }
        if tab == "festival" { return "Festival" }
        if id == "pier" { return stage == "unbuilt" ? "Build" : "Trade" }
        if id == "waterfront" { return "Waterfront" }
        if id == "lighthouse" { return "Lighthouse" }
        if id == "ferry" { return "Ferry" }
        if id == "civic" { return "Residents" }
        if ["specialist", "boatyard", "estate"].contains(id) && stage == "unbuilt" || (["olive", "fishing"].contains(id) && stage == "unbuilt") { return "Build" }
        if id == "boat0" || id == "boat1" || id == "boat2" || id == "thirdberth" { return "Fleet" }
        if stage == "built", ["kiln", "claypit", "terrace0", "terrace1", "boatyard", "estate"].contains(id) { return "Production" }
        if id.hasPrefix("plot"), stage == "built", ["carpenter", "weaver", "sailmaker", "flaxgarden"].contains(kind) { return "Production" }
        if id.hasPrefix("plot") { return "Neighbourhood" }
        if tab == "market" { return "Market" }
        if tab == "inland" { return "Inland" }
        return "Production"
    }
}
struct NextStep: Decodable {
    let goalTitle: String?
    struct Requirement: Decodable, Identifiable { let item: String; let required, available: Int; var id: String { item } }
    let title, body, category: String
    let actionID, siteID: String?
    let choices: [String]
    let waiting: Bool
    let requirements: [Requirement]
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
    struct RepeatRoute: Decodable { let route: String; let tier: Int }
    let `repeat`: RepeatRoute?
    struct Trip: Decodable {
        let left, duration: Double; let route: String; let ferry: Bool?
        var progress: Double { max(0, min(1, 1 - left / max(0.001, duration))) }
        var outward: Bool { progress < 0.5 }
    }
    let type: String
    let upgrade: String?
    let sails: Bool?
    let trip: Trip?
    var artwork: String { "vessel-" + type + (upgrade != nil || sails == true ? "-upgraded" : "") }
    // The bay departs southwest. Historical texture suffixes describe the old map,
    // so select by the actual painted bow direction without rotating upright masts.
    var sailingArtwork: String { artwork + (trip?.outward == true ? "-homebound" : "-outbound") }
}
struct WorkshopState: Decodable { let target, stock, incoming: Int; let item, status, station: String }
struct TownDirection: Decodable, Identifiable {
    let id, title, goal, body, category: String
    let progress, total: Int
    let choices: [String]
    let unlocked: Bool
    let siteID: String?
}
struct FestivalState: Decodable {
    struct Supply: Decodable, Identifiable {
        let item: String
        let required, available, incoming: Int
        var id: String { item }
    }
    let unlocked: Bool
    let stage, orders: Int
    let choice: String?
    let visits: [String: Int]
    let title, body: String
    let requirements: [Supply]
}
struct StoryMemory: Decodable, Identifiable {
    let id, title, body, art, dateLabel: String
    let chapter: Int?
}
struct HarbourStory: Decodable {
    let townName, voice, opening, festivalLine: String
    let memories, decisions: [StoryMemory]
}
struct MarketState: Decodable, Identifiable { let id, name: String; let plot: Int; let demand: Int? }
struct AdvancedRefit: Decodable { let tier, epoch: Int; let mode: String }
struct CrewState: Decodable {
    struct Option: Decodable, Identifiable { let id, title, kind, reason: String; let recipe: String? }
    struct Team: Decodable, Identifiable {
        let id: Int
        let name, title, reason: String
        let unlocked: Bool
        let target: String?
        let options: [Option]
    }
    let epoch, unlocked: Int
    let teams: [Team]
}
struct HarbourSnapshot: Decodable {
    let crews: CrewState
    let chronicle: ChronicleState
    let markets: [MarketState]
    let advancedRefits: [String: AdvancedRefit]
    let legacyBrowserAvailable: Bool
    let story: HarbourStory
    let festival: FestivalState
    let workshops: [String: WorkshopState]
    let directions: [TownDirection]
    let townFocus: String?
    let berthCount: Int
    let coins, speed, deliveries: Int
    let seconds: Double
    let stock: [String: Int]
    let jobs: [ProductionJob]
    let objective: Objective
    let guidance: NextStep
    let entities: [WorldEntity]
    let actions: [HarbourAction]
    let evolution: LivingTown
    let style: WorldStyle
    let event: TownEvent?
    let log: [String]
    let boats: [Boat?]
    func artwork(for entity: WorldEntity) -> String {
        guard entity.kind == "boat", let slot = Int(entity.id.dropFirst(4)), boats.indices.contains(slot), let boat = boats[slot] else { return entity.texture }
        return boat.artwork
    }
    var categories: [String] {
        let order = ["Festival", "Production", "Queues", "Trade", "Build", "Contracts", "Waterfront", "Market", "Inland", "Fleet", "Circuits", "Lighthouse", "Destinations", "Neighbourhood", "Town layout", "Residents", "Ferry", "Refits", "Automation", "Reservations"]
        return order.filter { category in actions.contains { $0.category == category } }
    }
}
struct ProjectPlan: Decodable {
    struct Requirement: Decodable, Identifiable {
        let item: String
        let required, available, incoming, missing: Int
        let reserved: Int?
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
    struct Blocker: Decodable { let message: String; let kind: String? }
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
        guard let (name, args) = invocation else { return "Continue" }
        if name == "chronicleCitySail" || name == "chronicleCityExplore" { return "Set sail" }
        if name == "chronicleCityRecall" { return "Recall & refund cargo" }
        if name == "chronicleCityCraft" { return "Decorate ceramics" }
        if name == "chronicleCityDeliver" { return "Contribute ceramics" }
        if name == "chronicleCityChoose" { return "Choose expedition" }
        if name == "chronicleBegin" { return "Begin the year" }
        if name == "chronicleAccept" { return "Accept request" }
        if name == "chronicleChoose" || name == "chronicleProject" { return "Choose this path" }
        if name == "chronicleBuild" && args.count > 1 && args[1] as? Int == 2 || name == "chronicleDeliver" && title == "Welcome both crews" { return "Welcome crews" }
        if name == "chronicleDeliver" || name == "chronicleBuild" || name == "chroniclePartner" || name == "chronicleHouseholds" { return "Contribute & continue" }
        if name == "chronicleSpecialist" { return "Assign adviser" }
        if name == "chronicleAdvice" { return "Reconsider choice" }
        if name == "chronicleRelease" { return "Return supplies" }
        if name == "installAdvancedRefit" { return args.count > 2 && args[2] as? String == "original" ? "Restore setup" : "Install profile" }
        if name == "switchMarketBusiness" { return "Switch business" }
        if name == "buildThirdBerth" { return "Open berth" }
        if name == "festivalPrepare" { return "Prepare courtyard" }
        if name == "festivalSupply" { return "Contribute supplies" }
        if name == "festivalCelebrate" { return "Open the festival" }
        if name == "festivalOrder" { return "Fulfil request" }
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
        if ["boat0", "boat1", "boat2"].contains(site.id), let berth = Int(site.id.dropFirst(4)) { return (args.first as? Int) == berth }
        if name == "build" { return first == site.id }
        if site.id == "pier" { return name == "upgrade" || category == "Trade" }
        // A system panel is already scoped to its harbour district.
        return category == site.category && !["Production", "Build", "Neighbourhood", "Fleet"].contains(category)
    }
}


/// Device-local presentation state, independent of the economic save envelope.
struct MapViewport: Codable, Equatable {
    let version: Int
    let x, y, scale: Double
    let region: String?
    var isValid: Bool {
        let knownRegion = region.map { ["all", "inland", "neighbourhood", "market", "coast", "harbour"].contains($0) } ?? true
        let withinBounds = version == 1 ? (0...1800).contains(x) && (0...2700).contains(y)
            : version == 2 ? (-300...2100).contains(x) && (-350...3050).contains(y)
            : version == 3 ? (-2450...3550).contains(x) && (-650...3350).contains(y)
            : (0...3840).contains(x) && (0...2560).contains(y)
        return [1, 2, 3, 4].contains(version) && x.isFinite && y.isFinite && scale.isFinite
            && withinBounds && ((version == 4 ? 0.5 : 0.65)...64).contains(scale)
            && knownRegion
    }
    static func decode(_ data: Data?) -> MapViewport? {
        guard let data, data.count <= 1024, let value = try? JSONDecoder().decode(Self.self, from: data), value.isValid else { return nil }
        return value
    }
}

/// Deterministic label collision handling: selection first, then ready work.
struct MapLabelLayout {
    struct Candidate { let id: String; let frame: CGRect; let priority: Int }
    static func visible(_ candidates: [Candidate]) -> Set<String> {
        var occupied: [CGRect] = [], result = Set<String>()
        for candidate in candidates.sorted(by: { $0.priority == $1.priority ? $0.id < $1.id : $0.priority > $1.priority }) {
            guard !occupied.contains(where: { $0.intersects(candidate.frame) }) else { continue }
            occupied.append(candidate.frame); result.insert(candidate.id)
        }
        return result
    }
}

/// Cosmetic town life follows built sites; it never spends or produces resources.
struct TownResident {
    let id, artwork: String
    let start, end: CGPoint
    let duration, offset: Double
    static func routes(in snapshot: HarbourSnapshot) -> [TownResident] {
        let built = Set(snapshot.entities.filter { $0.stage == "built" || $0.stage == "upgraded" || $0.stage == "ripe" }.map(\.id))
        var routes = [
            TownResident(id: "farmer", artwork: "person-farmer", start: CGPoint(x: 560, y: 540), end: CGPoint(x: 780, y: 640), duration: 19, offset: 0.2),
            TownResident(id: "baker", artwork: "person-vendor", start: CGPoint(x: 970, y: 975), end: CGPoint(x: 1200, y: 975), duration: 22, offset: 0.6)
        ]
        if built.contains("pier") { routes.append(.init(id: "docker", artwork: "person-docker", start: CGPoint(x: 720, y: 2050), end: CGPoint(x: 900, y: 2100), duration: 24, offset: 0.4)) }
        if snapshot.entities.contains(where: { $0.kind == "market" && $0.stage == "built" }) { routes.append(.init(id: "trader", artwork: "person-vendor", start: CGPoint(x: 1320, y: 1325), end: CGPoint(x: 1480, y: 1325), duration: 23, offset: 0.8)) }
        if snapshot.entities.contains(where: { $0.kind == "home" && $0.stage != "unbuilt" && $0.stage != "building" }) { routes.append(.init(id: "neighbour", artwork: "person-farmer", start: CGPoint(x: 430, y: 1170), end: CGPoint(x: 450, y: 1510), duration: 29, offset: 0.3)) }
        return routes
    }
}

extension HarbourAction {
    var boatSlot: Int? { invocation?.1.first as? Int }
    func matches(_ function: String, boat: Int) -> Bool { invocation?.0 == function && boatSlot == boat }
}

/// Presentation-only coastal journey. Both legs use their true tangent for the wake.
struct VesselPose {
    let position: CGPoint
    let heading: CGFloat
    static func at(slot: Int, trip: Boat.Trip) -> VesselPose {
        let berth = BayLayout.berth(slot)
        let exits: [CGFloat] = [420, 680, 800]
        let exit = BayLayout.point(exits[max(0, min(2, slot))] - (trip.route == "quarry" ? 25 : 0), 960)
        let dx = exit.x - berth.x, dy = exit.y - berth.y
        let excursion = sin(trip.progress * .pi)
        return .init(position: CGPoint(x: berth.x + excursion * dx, y: berth.y + excursion * dy),
                     heading: atan2(dy, dx) + (trip.outward ? 0 : .pi))
    }
}

struct ChronicleState: Decodable {
    struct City: Decodable {
        let unlocked: Bool
        let glaze, ceramics, chapter, activeVoyages: Int
        let jobLeft, jobDuration: Double
        let choices: [String]
        let explored: [Int]
    }
    let city: City
    struct Request: Decodable, Identifiable {
        let id, title, partner, body, goal: String
        let accepted: Bool
        let kind, boats: Int
        let usedBoats, eligibleBoats: [Int]
        let visitedRoutes: [String]
        let choice: String?
        let cost: [String: Int]
    }
    struct Partner: Decodable, Identifiable {
        let id, name, role, line: String
        let requests, level, work: Int
        let assigned: Bool
        let next: Int?
    }
    struct Project: Decodable, Identifiable {
        struct Mission: Decodable, Identifiable {
            let route, title: String
            let passengers, complete: Bool
            var id: String { route }
        }
        let id, title, partner, art: String
        let branches, outcomes: [String]
        let materials: [[String]]
        let transport: [[String]]
        let missions: [Mission]
        let usedBoats, eligibleBoats: [Int]
        let stage, branch, boats, routes: Int
        let goal: String?
        let needsStanding: Bool
    }
    struct Memory: Decodable, Identifiable {
        let id, title, body: String
        let seconds: Double
        let season: Int
    }
    let coast, townName, awning: String
    let started, unlocked: Bool
    let pin: String?
    let season: String
    let year, standing, households: Int
    let remaining: Double
    let offers: [Request]
    let partners: [Partner]
    let projects: [Project]
    let memories: [Memory]
}
