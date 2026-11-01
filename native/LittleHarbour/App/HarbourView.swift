import SwiftUI
import Combine
import UniformTypeIdentifiers

private let harbourInk = Color(red: 0.12, green: 0.27, blue: 0.27)
private let harbourPaper = Color(red: 0.97, green: 0.95, blue: 0.89)

struct HarbourView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.scenePhase) private var phase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var scene = HarbourScene(size: CGSize(width: 800, height: 1000))
    @State private var showInspector = false
    @State private var showSettings = false
    private let timer = Timer.publish(every: 0.25, on: .main, in: .common).autoconnect()
    var body: some View {
        GeometryReader { geometry in
            let wide = geometry.size.width >= 760
            VStack(spacing: 0) {
                header
                HStack(spacing: 0) {
                    ZStack(alignment: .topLeading) {
                        HarbourMap(scene: scene, snapshot: store.snapshot, selected: store.selectedSite, reduceMotion: reduceMotion, paused: !store.active || store.modalOpen || store.protectedSave)
                        VStack(spacing: 8) {
                            cameraControls(wide: wide)
                            Spacer()
                            objective(wide: wide)
                        }.padding(12)
                    }.clipped()
                    if wide { InspectorView().frame(width: min(420, geometry.size.width * 0.4)).background(harbourPaper) }
                }
                dock(wide: wide)
            }
            .background(harbourPaper)
            .onAppear { scene.onSelect = { entity in store.select(entity); if !wide { showInspector = true } } }
            .onChange(of: wide) { _, value in scene.onSelect = { entity in store.select(entity); if !value { showInspector = true } } }
            .sheet(isPresented: $showInspector) { NavigationStack { InspectorView().toolbar { ToolbarItem(placement: .confirmationAction) { Button("Map") { showInspector = false } } } }.presentationDetents([.medium, .large]).presentationDragIndicator(.visible) }
        }
        .tint(harbourInk)
        .sheet(isPresented: $showSettings) { SettingsView() }
        .onChange(of: showSettings) { _, value in store.modalOpen = value; if value { store.flush() } }
        .onChange(of: phase) { _, value in store.lifecycle(value == .active) }
        .onReceive(timer) { _ in store.pulse() }
        .overlay(alignment: .top) {
            if let message = store.message {
                HStack { Text(message).font(.callout); Button { store.message = nil } label: { Image(systemName: "xmark.circle.fill").frame(width: 44, height: 44) }.accessibilityLabel("Dismiss message") }
                    .padding(12).foregroundStyle(.white).background(harbourInk, in: RoundedRectangle(cornerRadius: 18)).padding()
            }
        }
    }
    private var header: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 1) {
                Text("LITTLE HARBOUR").font(.system(.caption2, design: .rounded, weight: .bold)).tracking(2)
                Text(store.snapshot?.style.identity ?? "Your Mediterranean town").font(.system(.headline, design: .serif))
            }
            Spacer(minLength: 0)
            Label("\(store.snapshot?.coins ?? 0)", systemImage: "circle.inset.filled").font(.system(.subheadline, design: .rounded, weight: .semibold)).accessibilityLabel("\(store.snapshot?.coins ?? 0) coins")
            Button { showSettings = true } label: { Image(systemName: store.protectedSave ? "exclamationmark.shield" : "gearshape").frame(width: 44, height: 44) }.accessibilityLabel("Settings and saves")
        }.foregroundStyle(harbourInk).padding(.horizontal, 16).padding(.vertical, 5).background(harbourPaper)
    }
    private func cameraControls(wide: Bool) -> some View {
        HStack(spacing: 5) {
            Menu {
                Button("Whole town") { scene.focus("all") }
                Button("Home harbour") { scene.focus("harbour") }
                Button("Hillside & fields") { scene.focus("inland") }
                Button("Neighbourhood") { scene.focus("neighbourhood") }
                Button("Market quarter") { scene.focus("market") }
                Button("Working coast") { scene.focus("coast") }
            } label: { Label("Explore", systemImage: "map").frame(minHeight: 44) }
            Menu {
                ForEach(store.snapshot?.entities ?? []) { entity in
                    Button("\(entity.label) · \(entity.stage) · level \(entity.level)") { store.select(entity); scene.focus(entity.zone); if !wide { showInspector = true } }
                }
            } label: { Label("Sites", systemImage: "building.2").frame(minHeight: 44) }
            Spacer(minLength: 0)
            Button { scene.zoom(1.25) } label: { Image(systemName: "minus").frame(width: 44, height: 44) }.accessibilityLabel("Zoom out")
            Button { scene.zoom(0.8) } label: { Image(systemName: "plus").frame(width: 44, height: 44) }.accessibilityLabel("Zoom in")
        }.font(.subheadline.weight(.semibold)).padding(.horizontal, 8).foregroundStyle(harbourInk).background(harbourPaper.opacity(0.96), in: RoundedRectangle(cornerRadius: 15))
    }
    private func objective(wide: Bool) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            if store.protectedSave {
                Text("Your saved town is protected").font(.headline)
                Text("Open Settings to export the original, restore a backup, or import a compatible save. Play is paused.").font(.callout)
                Button("Open save recovery") { showSettings = true }.buttonStyle(.borderedProminent)
            } else if let objective = store.snapshot?.objective {
                HStack { Text("CHAPTER \(objective.chapter) · \(objective.chapterName.uppercased())").font(.caption2.weight(.bold)).tracking(1); Spacer(); Text("\(store.snapshot?.deliveries ?? 0) deliveries").font(.caption) }
                Button {
                    store.category = category(for: objective.target); if !wide { showInspector = true }
                } label: { HStack { Text(objective.title).font(.system(.title3, design: .serif, weight: .semibold)); Spacer(); Image(systemName: "arrow.up.right") }.multilineTextAlignment(.leading) }.accessibilityIdentifier("objective")
                Text(objective.description).font(.callout).lineLimit(3)
            }
        }.padding(15).frame(maxWidth: 620, alignment: .leading).foregroundStyle(harbourInk).background(harbourPaper.opacity(0.97), in: RoundedRectangle(cornerRadius: 18))
    }
    private func dock(wide: Bool) -> some View {
        HStack(spacing: 0) {
            ForEach([("Production", "leaf"), ("Trade", "shippingbox"), ("Build", "hammer")], id: \.0) { item in
                Button { store.category = item.0; if !wide { showInspector = true } } label: { VStack(spacing: 4) { Image(systemName: item.1); Text(item.0).font(.caption) }.frame(maxWidth: .infinity, minHeight: 54) }
                    .accessibilityIdentifier("nav-" + item.0)
            }
            Menu {
                ForEach(store.snapshot?.categories ?? [], id: \.self) { category in Button(category) { store.category = category; if !wide { showInspector = true } } }
                Button("Town journal") { store.category = "Journal"; if !wide { showInspector = true } }
            } label: { VStack(spacing: 4) { Image(systemName: "square.grid.2x2"); Text("Town").font(.caption) }.frame(maxWidth: .infinity, minHeight: 54) }
            Menu {
                Button("Pause") { store.speed(0) }; Button("Normal speed") { store.speed(1) }; Button("Fast · 3×") { store.speed(3) }
            } label: { VStack(spacing: 4) { Image(systemName: store.snapshot?.speed == 0 ? "pause.circle" : "play.circle"); Text(store.snapshot?.speed == 3 ? "3×" : store.snapshot?.speed == 0 ? "Paused" : "1×").font(.caption) }.frame(maxWidth: .infinity, minHeight: 54) }.accessibilityLabel("Simulation speed")
        }.foregroundStyle(harbourInk).padding(.horizontal, 8).background(harbourPaper)
    }
    private func category(for target: String?) -> String {
        ["produce":"Production", "trade":"Trade", "build":"Build", "contracts":"Contracts", "waterfront":"Waterfront", "market":"Market", "inland":"Inland", "fleet":"Fleet", "neighbourhood":"Neighbourhood", "residents":"Residents", "ferry":"Ferry"][target ?? ""] ?? "Production"
    }
}

struct InspectorView: View {
    @EnvironmentObject private var store: GameStore
    @State private var pendingAction: HarbourAction?
    @State private var projectGoal: String?
    @State private var query = ""
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .firstTextBaseline) {
                    Text(store.category).font(.system(.largeTitle, design: .serif, weight: .semibold))
                    Spacer()
                    Menu { ForEach((store.snapshot?.categories ?? []) + ["Journal"], id: \.self) { name in Button(name) { store.category = name; query = "" } } } label: { Image(systemName: "line.3.horizontal.decrease.circle").frame(width: 44, height: 44) }.accessibilityLabel("Choose town activity")
                }
                if let entity = store.snapshot?.entities.first(where: { $0.id == store.selectedSite }) {
                    HStack {
                        Image(uiImage: HarbourArtwork.image(entity.texture)).resizable().scaledToFit().frame(width: 90, height: 90).accessibilityHidden(true)
                        VStack(alignment: .leading) { Text(entity.label).font(.headline); Text("\(entity.stage.capitalized) · level \(entity.level)").font(.caption) }
                        Spacer()
                    }.padding(8).background(.white.opacity(0.65), in: RoundedRectangle(cornerRadius: 14))
                }
                if let s = store.snapshot {
                    if store.category == "Journal" { journal(s) }
                    else {
                        stock(s)
                        if ["Fleet", "Circuits", "Ferry"].contains(store.category) { boats(s) }
                        if store.category == "Production" || store.category == "Queues" { jobs(s) }
                        TextField("Find an action or resource", text: $query).textFieldStyle(.roundedBorder).accessibilityLabel("Search actions")
                        let actions = s.actions.filter { $0.category == store.category && (query.isEmpty || ($0.title + $0.detail).localizedCaseInsensitiveContains(query)) }
                        ForEach(actions) { action in actionCard(action) }
                        if actions.isEmpty { Text("No actions here yet. Follow the chapter objective to open more of the town.").foregroundStyle(.secondary) }
                    }
                }
            }.padding(20)
        }.background(harbourPaper).foregroundStyle(harbourInk)
        .safeAreaInset(edge: .bottom) { FeedbackBanner() }
        .confirmationDialog("Confirm this investment", isPresented: Binding(get: { pendingAction != nil }, set: { if !$0 { pendingAction = nil } }), titleVisibility: .visible) {
            if let action = pendingAction { Button(action.title, role: .destructive) { store.perform(action); pendingAction = nil } }
            Button("Cancel", role: .cancel) { pendingAction = nil }
        } message: { if let action = pendingAction { Text(action.detail.isEmpty ? "Completed deliveries and spent materials are not refunded. Review the stated refund before continuing." : action.detail + ". This replaces the current setup without a refund.") } }
        .sheet(item: Binding(get: { projectGoal.map(GoalSelection.init) }, set: { projectGoal = $0?.id })) { goal in ProjectView(goal: goal.id) }
    }
    private func stock(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("STOREHOUSE").font(.caption2.weight(.bold)).tracking(1.5)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 86))], alignment: .leading, spacing: 8) {
                ForEach(s.stock.keys.sorted().filter { (s.stock[$0] ?? 0) > 0 }, id: \.self) { item in
                    VStack(alignment: .leading, spacing: 2) { Text("\(s.stock[item] ?? 0)").font(.system(.title3, design: .rounded, weight: .semibold)); Text(goodsNames[item] ?? item).font(.caption) }.frame(maxWidth: .infinity, alignment: .leading).padding(9).background(.white.opacity(0.65), in: RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }
    private func jobs(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(s.jobs) { job in
                VStack(alignment: .leading, spacing: 4) {
                    HStack { Text(job.name).font(.subheadline.weight(.medium)); Spacer(); Text("\(Int(ceil(job.left)))s").font(.caption.monospacedDigit()) }
                    ProgressView(value: max(0, min(1, 1 - job.left / max(1, job.duration)))).accessibilityLabel(job.name).accessibilityValue("\(Int(ceil(job.left))) seconds remaining")
                }
            }
        }
    }
    private func boats(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(s.boats.indices, id: \.self) { slot in
                if let boat = s.boats[slot] {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Berth \(slot + 1) · \(boat.type.capitalized)").font(.headline)
                        if let trip = boat.trip {
                            Text("\(trip.ferry == true ? "Passengers" : "Cargo") → \(trip.route.capitalized) · \(Int(ceil(trip.left)))s remaining").font(.caption).accessibilityIdentifier("voyage-status")
                            ProgressView(value: max(0, min(1, 1 - trip.left / trip.duration)))
                        } else { Text("Moored · ready for provisions").font(.caption) }
                    }.padding(10).background(.white.opacity(0.65), in: RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }
    private func actionCard(_ action: HarbourAction) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Button { if action.destructive { pendingAction = action } else { store.perform(action) } } label: {
                HStack(alignment: .top) { Text(action.title).font(.system(.body, design: .rounded, weight: .semibold)).multilineTextAlignment(.leading); Spacer(minLength: 4); Image(systemName: action.enabled ? "arrow.right.circle.fill" : "lock.circle") }
                    .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            }.disabled(!action.enabled || store.protectedSave).accessibilityIdentifier(action.title == "Harvest & replant" ? "harvest" : "action-" + action.id)
            if !action.detail.isEmpty { Text(action.detail).font(.caption).foregroundStyle(.secondary) }
            if !action.enabled { Text(action.reason).font(.caption).foregroundStyle(.secondary) }
            if let goal = action.goal {
                HStack { Button("Plan supplies") { projectGoal = goal }; Spacer(); Button("Reserve") { store.reserve(goal) }.disabled(store.protectedSave) }.font(.caption.weight(.semibold)).frame(minHeight: 44)
            }
        }.padding(13).background(.white.opacity(0.75), in: RoundedRectangle(cornerRadius: 14))
    }
    private func journal(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Season \(s.evolution.season) · \(s.evolution.choiceCount) decisions").font(.headline)
            ForEach(s.evolution.axes.keys.sorted(), id: \.self) { axis in HStack { Text(axis.capitalized).frame(width: 95, alignment: .leading); ProgressView(value: Double(s.evolution.axes[axis] ?? 0), total: 100); Text("\(s.evolution.axes[axis] ?? 0)").monospacedDigit() } }
            if let event = s.event {
                Text(event.title).font(.title3.bold()); Text(event.description)
                ForEach(event.options) { option in Button(option.label) { store.resolve(option.id) }.buttonStyle(.bordered).disabled(store.protectedSave) }
            }
            Text("Town activity").font(.headline)
            ForEach(Array(s.log.enumerated()), id: \.offset) { _, line in Text(line).font(.callout).padding(.vertical, 4) }
        }
    }
}
private struct GoalSelection: Identifiable { let id: String }
struct ProjectView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    let goal: String
    var body: some View {
        NavigationStack {
            ScrollView {
                if let plan = store.plan(goal) {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(plan.title).font(.system(.title, design: .serif))
                        ForEach(plan.requirements) { r in Text("\(goodsNames[r.item] ?? r.item.capitalized): \(r.available)/\(r.required) · \(r.incoming) incoming · \(r.missing) missing").font(.callout) }
                        ForEach(plan.recipes) { r in Text("\(r.batches) × \(r.key) · \(Int(r.seconds))s · \(r.queueable) ready to queue") }
                        ForEach(Array(plan.blockers.enumerated()), id: \.offset) { _, b in Text(b.message).foregroundStyle(.secondary) }
                        Button("Queue available production") { store.queuePlan(goal) }.buttonStyle(.borderedProminent).disabled(store.protectedSave)
                        Button("Reserve available supplies") { store.reserve(goal) }.buttonStyle(.bordered).disabled(store.protectedSave)
                        Text("Reservations protect supplies from other orders. Only finished ingredients can be used. Time stops when you leave the app.").font(.footnote).foregroundStyle(.secondary)
                    }.padding()
                }
            }.navigationTitle("Production plan").navigationBarTitleDisplayMode(.inline).toolbar { Button("Done") { dismiss() } }
        }
    }
}

struct FeedbackBanner: View {
    @EnvironmentObject private var store: GameStore
    var body: some View {
        if let message = store.message {
            HStack {
                Text(message).font(.callout)
                Spacer(minLength: 4)
                Button { store.message = nil } label: { Image(systemName: "xmark.circle.fill").frame(width: 44, height: 44) }.accessibilityLabel("Dismiss message")
            }.padding(12).foregroundStyle(.white).background(harbourInk).accessibilityElement(children: .contain)
        }
    }
}
