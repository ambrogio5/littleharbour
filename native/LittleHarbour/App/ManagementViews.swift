import SwiftUI

/// Reserve the same status space at every text size. Full requirements remain
/// available to VoiceOver and in the detail alert, without moving the controls.
struct StableActionStatus: View {
    let action: HarbourAction
    @State private var showExplanation = false
    private var text: String { action.enabled ? "Ready when you are" : action.reason }
    var body: some View {
        Button { showExplanation = true } label: {
            HStack(alignment: .top, spacing: 6) {
                Image(systemName: action.enabled ? "checkmark.circle" : "info.circle")
                Text(text).lineLimit(2, reservesSpace: true)
                Spacer(minLength: 0)
            }.font(.caption).foregroundStyle(HarbourTheme.muted).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
        }.buttonStyle(.plain).accessibilityLabel(text).accessibilityHint("Show the full requirements.")
            .alert(action.title, isPresented: $showExplanation) { Button("OK", role: .cancel) {} } message: { Text(text) }
    }
}

struct ProductionPanel: View {
    @EnvironmentObject private var store: GameStore
    let site: WorldEntity?
    @State private var section = "Make"
    @State private var search = ""
    @State private var onlySite = true
    @FocusState private var searchFocused: Bool
    var body: some View {
        if let s = store.snapshot {
            let recipes = s.actions.filter { $0.invocation?.0 == "start" }
            let keys = recipes.compactMap { $0.invocation?.1.first as? String }
            VStack(alignment: .leading, spacing: 14) {
                Picker("Production view", selection: $section) {
                    Text("Make").tag("Make"); Text("Stock targets").tag("Stocks")
                }.pickerStyle(.segmented).accessibilityIdentifier("production-view")
                HStack {
                    Text("\(s.jobs.count) \(s.jobs.count == 1 ? "batch" : "batches") underway").monospacedDigit().accessibilityIdentifier("production-queue-summary")
                    Spacer()
                    Button("Manage queue") { store.navigate("Queues") }.frame(minHeight: 44)
                }.font(.caption)
                HStack {
                    TextField("Find a product", text: $search).textFieldStyle(.roundedBorder).focused($searchFocused)
                        .accessibilityIdentifier("production-search").autocorrectionDisabled().submitLabel(.done).onSubmit { searchFocused = false }
                    if !search.isEmpty { Button { search = ""; searchFocused = false } label: { Image(systemName: "xmark.circle.fill").frame(width: 44, height: 44) }.accessibilityLabel("Clear search") }
                }
                if section == "Stocks" {
                    Text("Manage every unlocked recipe here. Targets use normal ingredients and shared workshop queue space as time advances.").font(.caption)
                    Text("Apply to all \(keys.count) recipes").font(.subheadline.bold())
                    TargetChoices { target in store.setStockTargets(keys, target: target) }
                        .disabled(store.protectedSave || !s.actions.contains { $0.invocation?.0 == "setTarget" })
                    if !s.actions.contains(where: { $0.invocation?.0 == "setTarget" }) {
                        Text("Extend the working quay to unlock automatic stock targets.").font(.caption)
                        Button("Open Build") { store.navigate("Build") }.frame(minHeight: 44)
                    }
                } else {
                    if site != nil { Toggle("Only this site", isOn: $onlySite).accessibilityIdentifier("site-filter") }
                    if search.isEmpty, (site == nil || !onlySite || site?.id == "field"), let harvest = s.actions.first(where: { $0.invocation?.0 == "harvestReplant" }) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Wheat · \(s.stock["wheat"] ?? 0) stored").font(.headline).monospacedDigit().accessibilityIdentifier("stock-count-wheat")
                            ManagementAction(action: harvest)
                        }
                    }
                }
                // Catalog order and identity stay fixed across queues, stock and
                // availability updates. Never sort or filter by readiness here.
                ForEach(recipes.filter { action in
                    (section == "Stocks" || site == nil || !onlySite || action.belongs(to: site)) &&
                    (search.isEmpty || (action.title + " " + action.detail).localizedCaseInsensitiveContains(search))
                }) { action in
                    if let key = action.invocation?.1.first as? String, let workshop = s.workshops[key] {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 10) {
                                ResourceIcon(item: workshop.item, size: 32)
                                Text(action.title).font(.headline)
                                Spacer(minLength: 0)
                            }
                            Text("\(workshop.stock) stored · \(workshop.incoming) in progress")
                                .font(.caption.monospacedDigit()).accessibilityIdentifier("production-stock-" + key)
                            if section == "Stocks" { WorkshopAutomation(recipe: key, compact: true) }
                            else {
                                ManagementAction(action: action, showTitle: false)
                                DisclosureGroup("Automatic stock · \(workshop.target == 0 ? "Off" : "Keep \(workshop.target)")") { WorkshopAutomation(recipe: key) }
                                    .font(.caption.bold())
                            }
                        }.harbourCard()
                    }
                }
                if recipes.filter({ search.isEmpty || ($0.title + " " + $0.detail).localizedCaseInsensitiveContains(search) }).isEmpty {
                    Text("No matching products. Clear the search to see all unlocked recipes.").font(.caption)
                }
            }
        }
    }
}

struct TargetChoices: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    let choose: (Int) -> Void
    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 2 : 4), spacing: 8) {
            ForEach([0, 6, 12, 24], id: \.self) { value in
                Button(value == 0 ? "All off" : "Keep \(value)") { choose(value) }
                    .font(.caption.bold()).frame(maxWidth: .infinity, minHeight: 44)
                    .background(HarbourTheme.sea.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                    .accessibilityIdentifier("all-stock-target-\(value)")
            }
        }.buttonStyle(.plain)
    }
}

/// All construction and improvements have a home under Build. The original
/// commands, costs, confirmations and dedicated operational panels are retained.
struct ConstructionPanel: View {
    @EnvironmentObject private var store: GameStore
    @FocusState private var searchFocused: Bool
    @State private var expanded: Set<String> = ["Workplaces"]
    @State private var search = ""
    private let groups: [(String, [String])] = [
        ("Workplaces", ["build", "upgradeWorkshops", "specialise", "invest", "marketAccess", "buildMarketBusiness", "switchMarketBusiness", "inlandAccess", "buildTerrace", "buildKiln", "buildCourtyard"]),
        ("Harbour & coasts", ["upgrade", "establishCharter", "fundWaterfront", "supplyWaterfront", "buildLighthouseStage", "fundCoastalProject", "buildThirdBerth", "fundFerryStage", "deliverFerrySupplies"]),
        ("Homes & neighbourhood", ["openNeighbourhood", "buyNeighbourhoodPlot", "buildNeighbourhood", "upgradeNeighbourhoodHome", "moveNeighbourhoodBuilding", "removeNeighbourhoodBuilding"]),
        ("Boats & equipment", ["buyBoat", "installBoatUpgrade", "refitBoatSails", "chronicleCityRefit"])
    ]
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Buildings, land, harbour works and upgrades—in one place. Open a section to review its costs and requirements.").font(.subheadline)
            TextField("Find a building or improvement", text: $search).textFieldStyle(.roundedBorder).accessibilityIdentifier("build-search").focused($searchFocused).submitLabel(.done).onSubmit { searchFocused = false }
            ForEach(groups, id: \.0) { group in
                let actions = (store.snapshot?.actions ?? []).filter { action in
                    group.1.contains(action.invocation?.0 ?? "") && (search.isEmpty || (action.title + " " + action.detail).localizedCaseInsensitiveContains(search))
                }
                if search.isEmpty || !actions.isEmpty {
                    DisclosureGroup(isExpanded: Binding(get: { expanded.contains(group.0) || !search.isEmpty }, set: { if $0 { expanded.insert(group.0) } else { expanded.remove(group.0) } })) {
                        if actions.isEmpty { Text("No further plans here yet. Completed work stays in your town; new plans open with progression.").font(.caption).padding(.vertical, 10) }
                        ForEach(actions) { ManagementAction(action: $0) }
                    } label: { Text(group.0).font(.headline).frame(minHeight: 44) }

                }
            }
            if search.isEmpty {
                DisclosureGroup("Workshop improvements") { WorkshopRefitPanel() }.font(.headline)
                DisclosureGroup("Civic projects & festival") {
                    Text("Choose a lasting project, check its stages and contribute the required supplies.").font(.caption)
                    ForEach((store.snapshot?.actions ?? []).filter { ["festivalPrepare", "festivalSupply", "festivalCelebrate", "chronicleProject", "chronicleBuild", "chooseResidentsProposal", "deliverResidentsSupplies"].contains($0.invocation?.0 ?? "") }) { ManagementAction(action: $0) }
                    Button("Project goals & requirements") { store.navigate("Goals") }.frame(minHeight: 44)
                    Button("Festival plan") { store.navigate("Festival") }.frame(minHeight: 44).disabled(store.snapshot?.festival.unlocked != true)
                }.font(.headline)
            }
        }
    }
}

struct WorkshopRefitPanel: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dynamicTypeSize) private var typeSize
    var fixedStation: String? = nil
    @State private var chosenStation = "mill"
    @State private var tier = 2
    @State private var mode = "speed"
    private var station: String { fixedStation ?? chosenStation }
    private var refits: [HarbourAction] { store.snapshot?.actions.filter { $0.category == "Refits" } ?? [] }
    private var stations: [String] { Array(Set(refits.compactMap { $0.invocation?.1.first as? String })).sorted() }
    private func name(_ key: String) -> String { refits.first { $0.invocation?.1.first as? String == key }?.title.components(separatedBy: " · ").first ?? key.capitalized }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if fixedStation == nil {
                Picker("Workshop", selection: $chosenStation) { ForEach(stations, id: \.self) { Text(name($0)).tag($0) } }
                    .accessibilityIdentifier("refit-workshop")
            }
            if refits.contains(where: { $0.invocation?.0 == "installAdvancedRefit" && $0.invocation?.1.first as? String == station }) {
                Text("\(name(station)) · advanced profiles").font(.headline)
                if tier == 3 {
                    Image(uiImage: HarbourArtwork.image("advanced-" + station)).resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: 110).accessibilityHidden(true)
                }
                Picker("Refit tier", selection: $tier) {
                    if (store.snapshot?.advancedRefits[station]?.tier ?? 2) <= 2 { Text("Tier 2").tag(2) }
                    Text("Tier 3").tag(3)
                }.pickerStyle(.segmented).accessibilityIdentifier("refit-tier")
                Text("Workshop profile").font(.caption.bold()).foregroundStyle(HarbourTheme.muted)
                Group {
                    if typeSize.isAccessibilitySize { VStack(spacing: 8) { profileChoices } }
                    else { HStack(spacing: 8) { profileChoices } }
                }.accessibilityElement(children: .contain).accessibilityLabel("Workshop profile")
                if let action = refits.first(where: { action in
                    guard let (fn, args) = action.invocation, fn == "installAdvancedRefit", args.count == 4 else { return false }
                    return args[0] as? String == station && args[1] as? Int == tier && args[2] as? String == mode
                }) { ManagementAction(action: action) }
                Text("Choose faster batches or more output. Existing improvements remain. Yield fractions carry forward; changing profiles requires an idle workshop.")
                    .font(.caption).foregroundStyle(HarbourTheme.muted)
            } else {
                Text("Complete the lighthouse to unlock advanced speed and yield profiles.").font(.caption)
            }
            let legacy = refits.filter { $0.invocation?.0 == "installRefit" && $0.invocation?.1.first as? String == station }
            if !legacy.isEmpty { DisclosureGroup("Original workshop improvements") { ForEach(legacy) { ManagementAction(action: $0) } } }
        }.onAppear {
            if fixedStation == nil, let direction = store.snapshot?.directions.first(where: { $0.id == store.directionFocus }),
               let action = refits.first(where: { direction.choices.contains($0.id) }), let key = action.invocation?.1.first as? String { chosenStation = key }
            syncTier()
        }.onChange(of: chosenStation) { _, _ in tier = store.snapshot?.advancedRefits[station]?.tier ?? 2; syncTier() }
            .onChange(of: store.snapshot?.advancedRefits[station]?.tier) { _, _ in syncTier() }
    }
    @ViewBuilder private var profileChoices: some View {
        ForEach(["speed", "yield", "original"].filter { $0 != "original" || store.snapshot?.advancedRefits[station]?.tier == tier }, id: \.self) { choice in
            Button { mode = choice } label: {
                Text(choice.capitalized).font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity, minHeight: 44).padding(.horizontal, 8)
                    .background(mode == choice ? HarbourTheme.sea.opacity(0.14) : HarbourTheme.surface, in: RoundedRectangle(cornerRadius: 10))
                    .overlay { RoundedRectangle(cornerRadius: 10).stroke(mode == choice ? HarbourTheme.sea : HarbourTheme.muted.opacity(0.25), lineWidth: mode == choice ? 2 : 1) }
                    .contentShape(Rectangle())
            }.buttonStyle(.plain).foregroundStyle(HarbourTheme.ink)
                .accessibilityIdentifier("refit-profile-" + choice)
                .accessibilityAddTraits(mode == choice ? .isSelected : [])
                .accessibilityHint("Preview this workshop profile. Apply the refit separately below.")
        }
    }
    private func syncTier() { tier = max(tier, store.snapshot?.advancedRefits[station]?.tier ?? 2); if mode == "original", store.snapshot?.advancedRefits[station]?.tier != tier { mode = "speed" } }
}

struct MarketPanel: View {
    @EnvironmentObject private var store: GameStore
    @State private var selected = "fishmonger"
    var body: some View {
        if let s = store.snapshot {
            if let access = s.actions.first(where: { $0.invocation?.0 == "marketAccess" }) { ManagementAction(action: access) }
            else {
                Picker("Market business", selection: $selected) {
                    ForEach(s.markets) { Text("Plot \($0.plot + 1) · \($0.name)").tag($0.id) }
                }.accessibilityIdentifier("market-business")
                    .onAppear {
                        let choices = store.guidanceFocus ? s.guidance.choices : s.directions.first(where: { $0.id == store.directionFocus })?.choices ?? []
                        if let action = s.actions.first(where: { choices.contains($0.id) }), let key = action.invocation?.1.first as? String, s.markets.contains(where: { $0.id == key }) { selected = key }
                        else if let site = store.selectedSite, s.markets.contains(where: { $0.id == site }) { selected = site }
                        else if store.selectedSite == "market3" { selected = "provisioner" }
                    }
                if let business = s.markets.first(where: { $0.id == selected }) {
                    HStack {
                        Image(uiImage: HarbourArtwork.image("market-built")).resizable().scaledToFit().frame(width: 64, height: 64).accessibilityHidden(true)
                        VStack(alignment: .leading) {
                            Text(business.name).font(.headline)
                            if let demand = business.demand { Text("\(demand) of 3 orders available").font(.caption) }
                            else { Text("Choose the role for this plot").font(.caption) }
                        }
                    }
                }
                ForEach(s.actions.filter { $0.category == "Market" && $0.invocation?.1.first as? String == selected && $0.invocation?.0 != "setMarketAuto" }) { ManagementAction(action: $0) }
                if let automatic = s.actions.first(where: { $0.invocation?.0 == "setMarketAuto" && $0.invocation?.1.first as? String == selected }) {
                    Button { store.perform(automatic) } label: { Label(automatic.title, systemImage: "arrow.triangle.2.circlepath").frame(minHeight: 44) }
                        .disabled(!automatic.enabled || store.protectedSave)
                        .accessibilityIdentifier("market-automation")
                }
                ForEach(s.actions.filter { $0.invocation?.0 == "releaseReservation" && ($0.invocation?.1.first as? String)?.hasPrefix("market:") == true }) { ManagementAction(action: $0) }
                Text("Automatic supply uses this stall’s available orders and unreserved goods. Switching the third plot keeps its demand and recovery clock.").font(.caption).foregroundStyle(HarbourTheme.muted)
            }
        }
    }
}

/// Inline controls use the same validated engine commands as manual production.
struct WorkshopAutomation: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    @EnvironmentObject private var store: GameStore
    let recipe: String
    var compact = false
    @State private var showStatus = false
    var body: some View {
        if let s = store.snapshot, let workshop = s.workshops[recipe] {
            let actions = s.actions.filter { $0.invocation?.0 == "setTarget" && $0.invocation?.1.first as? String == recipe }
            if !actions.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    if !compact {
                        Label("Automatic stock", systemImage: "arrow.triangle.2.circlepath").font(.subheadline.bold())
                        Text("\(goodsNames[workshop.item] ?? workshop.item): \(workshop.stock) stored · \(workshop.incoming) in progress").font(.caption.monospacedDigit())
                    }
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 2 : 4), spacing: 8) {
                        ForEach(actions) { action in
                            let target = action.invocation?.1.last as? Int ?? 0
                            Button(target == 0 ? "Off" : "Keep \(target)") { store.perform(action) }
                                .font(.caption.bold()).frame(maxWidth: .infinity, minHeight: 44)
                                .background(workshop.target == target ? HarbourTheme.sea.opacity(0.18) : HarbourTheme.surface.opacity(0.9), in: RoundedRectangle(cornerRadius: 10))
                                .disabled(!action.enabled || store.protectedSave || workshop.target == target)
                                .accessibilityAddTraits(workshop.target == target ? .isSelected : [])
                                .accessibilityIdentifier("automation-\(recipe)-\(target)")
                        }
                    }
                    Button { showStatus = true } label: {
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "info.circle")
                            Text(workshop.status + ". Uses normal ingredients and queue space.").lineLimit(3, reservesSpace: true)
                            Spacer(minLength: 0)
                        }.font(.caption).foregroundStyle(HarbourTheme.muted).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    }.buttonStyle(.plain).accessibilityLabel(workshop.status + ". Uses normal ingredients and queue space.")
                        .accessibilityHint("Show automatic production details.")
                        .alert("Automatic stock", isPresented: $showStatus) { Button("OK", role: .cancel) {} } message: { Text(workshop.status + ". Uses normal ingredients and queue space.") }
                }.padding(12).background(HarbourTheme.sea.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))
            }
        }
    }
}

/// A reusable review surface; changing a picker never executes an economic command.
struct ManagementAction: View {
    @EnvironmentObject private var store: GameStore
    let action: HarbourAction
    var showTitle = true
    @State private var confirm = false
    @State private var plan = false
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let partner = action.partner { Text(partner).font(.caption).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
            if showTitle { Text(action.title).font(.subheadline.bold()).fixedSize(horizontal: false, vertical: true) }
            if let cost = action.detail.components(separatedBy: "\n").first, !cost.isEmpty { Text(cost).font(.caption).foregroundStyle(HarbourTheme.muted) }
            Button { if action.destructive { confirm = true } else { store.perform(action) } } label: {
                Text(action.verb).font(.subheadline.bold()).frame(maxWidth: .infinity, minHeight: 44)
            }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).disabled(!action.enabled || store.protectedSave)
                .accessibilityLabel(action.title).accessibilityIdentifier(action.invocation?.0 == "harvestReplant" ? "harvest" : "action-" + action.id)
            StableActionStatus(action: action)
            if action.detail.contains("\n") { DisclosureGroup("Batch preview") { Text(action.detail.components(separatedBy: "\n").dropFirst().joined(separator: "\n")).font(.caption) } }
            if action.goal != nil { Button("Plan supplies") { plan = true }.font(.caption).frame(minHeight: 44) }
        }.padding(12).background(HarbourTheme.surface.opacity(0.94), in: RoundedRectangle(cornerRadius: 14))
            .confirmationDialog("Review this change", isPresented: $confirm, titleVisibility: .visible) {
                Button(action.title, role: .destructive) { store.perform(action) }
                Button("Cancel", role: .cancel) {}
            } message: { Text(action.detail.isEmpty ? action.title : action.detail) }
            .sheet(isPresented: $plan) { if let goal = action.goal { ProjectView(goal: goal) } }
    }
}

struct DirectionsPanel: View {
    @EnvironmentObject private var store: GameStore
    var body: some View {
        if let s = store.snapshot {
            if s.festival.unlocked {
                VStack(alignment: .leading, spacing: 8) {
                    Label("HARBOUR FESTIVAL", systemImage: "party.popper").font(.caption.bold())
                    Text(s.festival.title).font(.headline)
                    Text(s.festival.stage == 4 ? "Your decorated courtyard now hosts new local requests." : "A new chapter: choose your fair, bring coastal visitors and open the celebration.").font(.caption)
                    Button(s.festival.stage == 4 ? "Festival requests" : "Plan the festival") { store.navigate("Festival") }.frame(minHeight: 44).accessibilityIdentifier("open-festival")
                }.harbourCard()
            }
            Text("Choose what your harbour becomes").font(.system(.headline, design: .serif))
            Text("Keep following Elena, or pursue these ambitions at your own pace. Progress comes from your real town and survives saves.").font(.caption).foregroundStyle(HarbourTheme.muted)
            ForEach(s.directions) { direction in
                VStack(alignment: .leading, spacing: 10) {
                    Text(direction.title).font(.headline)
                    Text(direction.goal).font(.subheadline.bold())
                    ProgressView(value: Double(direction.progress), total: Double(max(1, direction.total)))
                    Text("\(direction.progress) / \(direction.total)").font(.caption.monospacedDigit())
                    Text(direction.body).font(.caption).fixedSize(horizontal: false, vertical: true)
                    Button(direction.unlocked ? "Work on this" : "Follow Elena to unlock") { store.followDirection(direction) }
                        .buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).disabled(!direction.unlocked).frame(minHeight: 44)
                        .accessibilityIdentifier("direction-" + direction.id)
                }.harbourCard()
            }
            DisclosureGroup("Town specialisation · \(s.townFocus?.capitalized ?? "choose a direction")") {
                Text("Your town direction changes its economic bonuses. Review each benefit and the cost of switching.").font(.caption).padding(.vertical, 8)
                ForEach(s.actions.filter { $0.invocation?.0 == "setTownFocus" }) { ManagementAction(action: $0) }
            }.font(.subheadline).harbourCard()
        }
    }
}

struct FleetPanel: View {
    @EnvironmentObject private var store: GameStore
    @State private var route = "quarry"
    @State private var tier = 1
    @State private var islandTier = 1
    @State private var mode = "Cargo"
    private var actions: [HarbourAction] { store.snapshot?.actions ?? [] }
    private var slot: Int { store.selectedBerth }
    private func matching(_ name: String) -> [HarbourAction] { actions.filter { $0.matches(name, boat: slot) } }
    private var mission: HarbourAction? {
        if mode == "City" { return matching("chronicleCitySail").first }
        if mode == "Passengers" { return matching("startFerryService").first { $0.invocation?.1[1] as? String == route } }
        if mode == "Circuit" { return matching("startCircuit").first { action in
            guard let stops = action.invocation?.1[1] as? [[String: Any]], stops.count == 2 else { return false }
            return stops[0]["tier"] as? Int == tier && stops[1]["tier"] as? Int == islandTier
        } }
        return matching("startVoyage").first { $0.invocation?.1[1] as? String == route && $0.invocation?.1[2] as? Int == tier }
    }
    var body: some View {
        if let s = store.snapshot {
            VStack(alignment: .leading, spacing: 12) {
                Text("CHOOSE YOUR BOAT").font(.caption2.bold()).foregroundStyle(HarbourTheme.muted)
                HStack(spacing: 8) {
                    ForEach(0..<s.boats.count, id: \.self) { berth in
                        let boat = s.boats.indices.contains(berth) ? s.boats[berth] : nil
                        Button { store.selectedBerth = berth } label: {
                            VStack(spacing: 4) {
                                if let boat { Image(uiImage: HarbourArtwork.image(boat.artwork)).resizable().scaledToFit().frame(height: 54).accessibilityHidden(true) }
                                else { Image(systemName: "sailboat").frame(height: 54) }
                                Text("Berth \(berth + 1)").font(.caption.bold())
                                Text(boat.map { $0.trip == nil ? $0.type.capitalized : "At sea" } ?? (berth < s.berthCount ? "Add a boat" : "Locked")).font(.caption2)
                            }.frame(maxWidth: .infinity).padding(8)
                                .background(slot == berth ? HarbourTheme.sea.opacity(0.14) : HarbourTheme.surface.opacity(0.9), in: RoundedRectangle(cornerRadius: 14))
                                .overlay { RoundedRectangle(cornerRadius: 14).stroke(slot == berth ? HarbourTheme.sea : .clear, lineWidth: 2) }
                                .contentShape(Rectangle())
                        }.buttonStyle(.plain).accessibilityIdentifier("boat-selector-\(berth)").accessibilityAddTraits(slot == berth ? .isSelected : [])
                    }
                }
                if store.category == "Ferry" {
                    ForEach(actions.filter { $0.category == "Ferry" && $0.invocation?.0 != "startFerryService" }) { ManagementAction(action: $0) }
                }
                if s.boats.indices.contains(slot), let boat = s.boats[slot] {
                    if let trip = boat.trip {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("\(trip.ferry == true ? "Passengers" : "Cargo") · \(trip.outward ? "To" : "Returning from") \(destination(trip.route)) · \(Int(ceil(trip.left)))s remaining").font(.subheadline.bold()).accessibilityIdentifier("voyage-status")
                            ProgressView(value: max(0, min(1, 1 - trip.left / max(1, trip.duration))))
                            Text("This boat must return before its next mission. You can prepare another boat now.").font(.caption)
                        }.padding(12).background(HarbourTheme.gold.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                    }
                    if s.festival.stage == 2 {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Festival visitors · Pietra \(s.festival.visits["quarry"] ?? 0)/2 · Island \(s.festival.visits["island"] ?? 0)/2").font(.caption.bold())
                        Text("Only completed passenger services count. Choose Ferry below; cargo and recalls do not bring visitors.").font(.caption)
                        Button("Return to festival") { store.navigate("Festival") }.font(.caption).frame(minHeight: 44)
                    }.padding(12).background(HarbourTheme.gold.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                }
                    missionPicker
                    if let mission { ManagementAction(action: mission) }
                    else { Text(mode == "Passengers" ? "Finish the ferry terminal to carry passengers." : "This mission is not unlocked yet. Continue the coastal projects with Elena.").font(.caption) }
                    if mode == "City" {
                        Text("The city needs a coaster with Expanded hold. Its voyage takes four game minutes and returns with imported glaze for the decorating bench.").font(.caption)
                        ForEach(matching("chronicleCityRefit")) { ManagementAction(action: $0) }
                        ForEach(matching("chronicleCityExplore")) { ManagementAction(action: $0) }
                    }
                    ForEach(matching("chronicleCityRecall")) { ManagementAction(action: $0) }
                    repeatControls(boat)
                    DisclosureGroup("Boat upgrades & recall") {
                        ForEach(actions.filter { $0.boatSlot == slot && ["installBoatUpgrade", "refitBoatSails", "cancelVoyage"].contains($0.invocation?.0 ?? "") }) { ManagementAction(action: $0) }
                    }.font(.subheadline).padding(.vertical, 8)
                } else {
                    if slot == 2, let unlock = actions.first(where: { $0.invocation?.0 == "buildThirdBerth" }) { ManagementAction(action: unlock) }
                    Text("Choose a boat for this berth. Each boat has its own cargo, voyage and repeat route.").font(.caption)
                    ForEach(matching("buyBoat")) { ManagementAction(action: $0) }
                }
            }.onAppear { configureSelection() }.onChange(of: store.category) { _, _ in configureSelection() }
                .onChange(of: store.guidanceFocus) { _, _ in configureSelection() }
                .onChange(of: store.preferredFleetMission) { _, _ in configureSelection() }
                .onChange(of: store.preferredFleetRoute) { _, _ in configureSelection() }
        }
    }
    private var missionPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("PLAN THIS BOAT’S MISSION").font(.caption2.bold()).foregroundStyle(HarbourTheme.muted)
            Picker("Mission type", selection: $mode) {
                Text("Cargo").tag("Cargo"); Text("Circuit").tag("Circuit"); Text("Ferry").tag("Passengers")
                if store.snapshot?.chronicle.city.unlocked == true { Text("City").tag("City") }
            }.pickerStyle(.segmented).accessibilityIdentifier("mission-type")
            if mode == "City" { Text("Porto Grande · city port").font(.subheadline.bold()) }
            else if mode != "Circuit" {
                Picker("Destination", selection: $route) { Text("Pietra Cove").tag("quarry"); Text("Olive Island").tag("island") }.pickerStyle(.segmented).accessibilityIdentifier("mission-destination")
            } else { Text("Pietra Cove → Olive Island → home").font(.caption) }
            if mode != "Passengers" && mode != "City" {
                tierPicker(mode == "Circuit" ? "Pietra cargo" : "Cargo size", selection: $tier)
                if mode == "Circuit" { tierPicker("Island cargo", selection: $islandTier) }
            }
        }
    }
    private func tierPicker(_ title: String, selection: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 4) { Text(title).font(.caption); Picker(title, selection: selection) { Text("Small").tag(1); Text("Medium").tag(2); Text("Large").tag(3) }.pickerStyle(.segmented) }
    }
    @ViewBuilder private func repeatControls(_ boat: Boat) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Repeat route", systemImage: "repeat").font(.subheadline.bold())
            Text(boat.repeat.map { "\(destination($0.route)) · cargo tier \($0.tier). Automatically sails again when supplies are ready." } ?? "Off · this boat returns home after its mission.").font(.caption)
            if mode == "Cargo", let action = matching("setRepeatVoyage").first(where: { $0.invocation?.1.count == 3 && $0.invocation?.1[1] as? String == route && $0.invocation?.1[2] as? Int == tier }) {
                Button("Repeat selected cargo route") { store.perform(action) }.frame(minHeight: 44).buttonStyle(.bordered)
                    .disabled(!action.enabled || store.protectedSave).accessibilityIdentifier("repeat-selected-route")
                if !action.enabled { Text(action.reason).font(.caption) }
            } else if boat.repeat == nil { Text("Earn three visits to a destination to unlock its repeat cargo route.").font(.caption).foregroundStyle(HarbourTheme.muted) }
            if let stop = matching("setRepeatVoyage").first(where: { $0.invocation?.1.count == 2 }) {
                Button("Stop repeating") { store.perform(stop) }.frame(minHeight: 44).disabled(!stop.enabled || store.protectedSave)
            }
        }.padding(12).background(HarbourTheme.sea.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
    }
    private func destination(_ key: String) -> String { key == "city" ? "Porto Grande" : key == "quarry" ? "Pietra Cove" : key == "island" ? "Olive Island" : key.capitalized }
    private func configureSelection() {
        if store.preferredFleetMission == "City", store.snapshot?.chronicle.city.unlocked == true { mode = "City"; return }
        if let destination = store.preferredFleetRoute, let mission = store.preferredFleetMission {
            route = destination; mode = mission; tier = 1; return
        }
        mode = store.category == "Ferry" ? "Passengers" : store.category == "Circuits" ? "Circuit" : "Cargo"
        let ids = store.guidanceFocus ? store.snapshot?.guidance.choices : store.snapshot?.directions.first { $0.id == store.directionFocus }?.choices
        if actions.contains(where: { (ids ?? []).contains($0.id) && $0.invocation?.0 == "buildThirdBerth" }) { store.selectedBerth = 2; return }
        if let action = actions.first(where: { (ids ?? []).contains($0.id) && ["startVoyage", "startFerryService", "buyBoat"].contains($0.invocation?.0 ?? "") }), let args = action.invocation?.1 {
            store.selectedBerth = action.boatSlot ?? 0
            if args.count > 1, let destination = args[1] as? String, ["quarry", "island"].contains(destination) { route = destination }
            if args.count > 2, let value = args[2] as? Int { tier = value }
        }
    }
}

struct FestivalPanel: View {
    @EnvironmentObject private var store: GameStore
    var body: some View {
        if let s = store.snapshot {
            let f = s.festival
            VStack(alignment: .leading, spacing: 12) {
                Label(f.stage == 4 ? "A CELEBRATION TO KEEP" : "CHAPTER 6 · HARBOUR FESTIVAL", systemImage: "party.popper").font(.caption.bold()).foregroundStyle(HarbourTheme.sea)
                Text(f.title).font(.system(.title3, design: .serif, weight: .semibold)).accessibilityIdentifier("festival-title")
                Text("Elena · “\(s.story.festivalLine)”").font(.caption).italic().fixedSize(horizontal: false, vertical: true)
                if f.unlocked {
                    ProgressView(value: Double(f.stage), total: 4).tint(HarbourTheme.sea)
                    Text("\(f.stage) of 4 stages complete").font(.caption).accessibilityIdentifier("festival-progress")
                }
                Text(f.body).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                if !f.unlocked {
                    Button("Continue with Elena") { store.followGuidance() }.frame(minHeight: 44)
                } else {
                    if f.stage < 4 {
                        Text("Reward: decorated courtyard, a journal memory and two new festival requests to choose from.").font(.caption).foregroundStyle(HarbourTheme.muted)
                    }
                    if f.stage == 1 {
                        HStack {
                            ForEach(["food", "craft"], id: \.self) { choice in
                                if let action = s.actions.first(where: { $0.invocation?.0 == "festivalChoose" && $0.invocation?.1.first as? String == choice }) {
                                    Button(choice == "food" ? "Food fair" : "Craft exhibition") { store.perform(action) }
                                        .font(.caption.bold()).frame(maxWidth: .infinity, minHeight: 44)
                                        .background(f.choice == choice ? HarbourTheme.sea.opacity(0.18) : HarbourTheme.surface, in: RoundedRectangle(cornerRadius: 10))
                                        .disabled(!action.enabled || store.protectedSave)
                                        .accessibilityAddTraits(f.choice == choice ? .isSelected : []).accessibilityIdentifier("festival-theme-" + choice)
                                }
                            }
                        }
                    }
                    ForEach(f.requirements) { supply in
                        HStack {
                            ResourceIcon(item: supply.item, size: 24)
                            Text(goodsNames[supply.item] ?? "Coins")
                            Spacer(minLength: 4)
                            VStack(alignment: .trailing) {
                                Text("\(supply.available) / \(supply.required)").monospacedDigit()
                                if supply.incoming > 0 { Text("+\(supply.incoming) in progress").font(.caption2) }
                            }
                        }.font(.caption)
                    }
                    if !f.requirements.isEmpty { Text("Available goods exclude other reservations. Incoming goods must finish before delivery.").font(.caption2).foregroundStyle(HarbourTheme.muted) }
                    if f.stage == 2 {
                        ForEach(["quarry", "island"], id: \.self) { route in
                            HStack { Text(route == "quarry" ? "Pietra Cove visitors" : "Olive Island visitors"); Spacer(); Text("\(f.visits[route] ?? 0) / 2").monospacedDigit() }.font(.subheadline)
                        }
                        Button("Choose a boat & passenger service") { store.navigate("Ferry") }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).frame(minHeight: 44).accessibilityIdentifier("festival-ferry")
                    }
                    ForEach(s.actions.filter { $0.category == "Festival" && $0.invocation?.0 != "festivalChoose" }) { action in
                        ManagementAction(action: action)
                    }
                    if f.stage < 4 {
                        Button("Elena · help with the next step") { store.followGuidance() }.frame(minHeight: 44).accessibilityIdentifier("festival-help")
                    } else {
                        Text("\(f.orders) festival requests fulfilled").font(.caption).accessibilityIdentifier("festival-orders")
                        Text("Choose a request, then plan or reserve its supplies. Previewing spends nothing.").font(.caption).foregroundStyle(HarbourTheme.muted)
                    }
                }
            }.padding(12).background(HarbourTheme.surface.opacity(0.92), in: RoundedRectangle(cornerRadius: 16))
        }
    }
}
