import SwiftUI

/// Inline controls use the same validated engine commands as manual production.
struct WorkshopAutomation: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    @EnvironmentObject private var store: GameStore
    let recipe: String
    var body: some View {
        if let s = store.snapshot, let workshop = s.workshops[recipe] {
            let actions = s.actions.filter { $0.invocation?.0 == "setTarget" && $0.invocation?.1.first as? String == recipe }
            if !actions.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Automatic stock", systemImage: "arrow.triangle.2.circlepath").font(.subheadline.bold())
                    Text("\(goodsNames[workshop.item] ?? workshop.item): \(workshop.stock) stored · \(workshop.incoming) in progress").font(.caption)
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 2 : 4), spacing: 8) {
                        ForEach(actions) { action in
                            let target = action.invocation?.1.last as? Int ?? 0
                            Button(target == 0 ? "Off" : "Keep \(target)") { store.perform(action) }
                                .font(.caption.bold()).frame(maxWidth: .infinity, minHeight: 44)
                                .background(workshop.target == target ? HarbourTheme.sea.opacity(0.18) : HarbourTheme.surface.opacity(0.9), in: RoundedRectangle(cornerRadius: 10))
                                .disabled(!action.enabled || store.protectedSave || store.lastPerformedActionID != nil || workshop.target == target)
                                .accessibilityAddTraits(workshop.target == target ? .isSelected : [])
                                .accessibilityIdentifier("automation-\(recipe)-\(target)")
                        }
                    }
                    Text(workshop.status + ". Uses normal ingredients and queue space.").font(.caption).foregroundStyle(HarbourTheme.muted)
                }.padding(12).background(HarbourTheme.sea.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))
            }
        }
    }
}

/// A reusable review surface; changing a picker never executes an economic command.
struct ManagementAction: View {
    @EnvironmentObject private var store: GameStore
    let action: HarbourAction
    @State private var confirm = false
    @State private var plan = false
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let partner = action.partner { Text(partner).font(.caption).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
            Text(action.title).font(.subheadline.bold()).fixedSize(horizontal: false, vertical: true)
            if !action.detail.isEmpty { Text(action.detail).font(.caption).foregroundStyle(HarbourTheme.muted) }
            if !action.enabled { Label(action.reason, systemImage: "info.circle").font(.caption).foregroundStyle(HarbourTheme.muted) }
            Button { if action.destructive { confirm = true } else { store.perform(action) } } label: {
                Text(action.enabled ? action.verb : "Not ready yet").font(.subheadline.bold()).frame(maxWidth: .infinity, minHeight: 44)
            }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).disabled(!action.enabled || store.protectedSave || store.lastPerformedActionID != nil)
                .accessibilityLabel(action.title).accessibilityIdentifier("action-" + action.id)
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
                    ForEach(0..<2, id: \.self) { berth in
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
                    repeatControls(boat)
                    DisclosureGroup("Boat upgrades & recall") {
                        ForEach(actions.filter { $0.boatSlot == slot && ["installBoatUpgrade", "refitBoatSails", "cancelVoyage"].contains($0.invocation?.0 ?? "") }) { ManagementAction(action: $0) }
                    }.font(.subheadline).padding(.vertical, 8)
                } else {
                    Text("Choose a boat for this berth. Each boat has its own cargo, voyage and repeat route.").font(.caption)
                    ForEach(matching("buyBoat")) { ManagementAction(action: $0) }
                }
            }.onAppear { configureSelection() }.onChange(of: store.category) { _, _ in configureSelection() }
                .onChange(of: store.guidanceFocus) { _, _ in configureSelection() }
        }
    }
    private var missionPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("PLAN THIS BOAT’S MISSION").font(.caption2.bold()).foregroundStyle(HarbourTheme.muted)
            Picker("Mission type", selection: $mode) {
                Text("Cargo").tag("Cargo"); Text("Circuit").tag("Circuit"); Text("Ferry").tag("Passengers")
            }.pickerStyle(.segmented).accessibilityIdentifier("mission-type")
            if mode != "Circuit" {
                Picker("Destination", selection: $route) { Text("Pietra Cove").tag("quarry"); Text("Olive Island").tag("island") }.pickerStyle(.segmented).accessibilityIdentifier("mission-destination")
            } else { Text("Pietra Cove → Olive Island → home").font(.caption) }
            if mode != "Passengers" {
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
                    .disabled(!action.enabled || store.protectedSave || store.lastPerformedActionID != nil).accessibilityIdentifier("repeat-selected-route")
                if !action.enabled { Text(action.reason).font(.caption) }
            } else if boat.repeat == nil { Text("Earn three visits to a destination to unlock its repeat cargo route.").font(.caption).foregroundStyle(HarbourTheme.muted) }
            if let stop = matching("setRepeatVoyage").first(where: { $0.invocation?.1.count == 2 }) {
                Button("Stop repeating") { store.perform(stop) }.frame(minHeight: 44).disabled(!stop.enabled || store.protectedSave || store.lastPerformedActionID != nil)
            }
        }.padding(12).background(HarbourTheme.sea.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
    }
    private func destination(_ key: String) -> String { key == "quarry" ? "Pietra Cove" : key == "island" ? "Olive Island" : key.capitalized }
    private func configureSelection() {
        mode = store.category == "Ferry" ? "Passengers" : store.category == "Circuits" ? "Circuit" : "Cargo"
        let ids = store.guidanceFocus ? store.snapshot?.guidance.choices : store.snapshot?.directions.first { $0.id == store.directionFocus }?.choices
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
                                        .disabled(!action.enabled || store.protectedSave || store.lastPerformedActionID != nil)
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
                        Text("Choose one request. Completing it refreshes both offers; previewing them spends nothing.").font(.caption).foregroundStyle(HarbourTheme.muted)
                    }
                }
            }.padding(12).background(HarbourTheme.surface.opacity(0.92), in: RoundedRectangle(cornerRadius: 16))
        }
    }
}
