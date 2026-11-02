import SwiftUI
import Combine
import UniformTypeIdentifiers

private let harbourInk = HarbourTheme.ink
private let harbourPaper = HarbourTheme.paper

/// Lazily owned once per window; snapshot refreshes must not recreate the terrain.
@MainActor private final class HarbourMapState: ObservableObject {
    let scene: HarbourScene
    init() {
        scene = HarbourScene(size: CGSize(width: 800, height: 1000))
        let arguments = ProcessInfo.processInfo.arguments
        if !arguments.contains("--ui-testing") {
            let key = arguments.contains("--persistence-testing") ? "ui-test-mapViewport" : "mapViewport"
            if arguments.contains("--persistence-testing") && arguments.contains("--reset-test-town") { UserDefaults.standard.removeObject(forKey: key) }
            scene.configureViewport(preferences: .standard, key: key)
        }
    }
}

struct HarbourView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.scenePhase) private var phase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @StateObject private var mapState = HarbourMapState()
    private var scene: HarbourScene { mapState.scene }
    @State private var showInspector = false
    @State private var showSettings = false
    @State private var showSites = false
    @State private var showExplore = false
    @State private var showTown = false
    @State private var showSpeed = false
    @State private var pendingCategory: String?
    @State private var pendingSite: WorldEntity?
    @State private var hasSideInspector = false
    @State private var expandedObjective = false
    @AppStorage("mapLabels") private var mapLabels = true
    private let timer = Timer.publish(every: 0.25, on: .main, in: .common).autoconnect()
    var body: some View {
        GeometryReader { geometry in
            let wide = geometry.size.width >= 760
            VStack(spacing: 0) {
                header
                HStack(spacing: 0) {
                    VStack(spacing: 0) {
                        // Keep native control hit regions outside the UIKit/SpriteKit surface.
                        // A separate toolbar avoids ambiguous accessibility hit regions on older iOS.
                        cameraControls(wide: wide).padding(.horizontal, 12).padding(.vertical, 8).background(harbourPaper)
                        ZStack(alignment: .bottomLeading) {
                            HarbourMap(scene: scene, snapshot: store.snapshot, selected: store.selectedSite, reduceMotion: reduceMotion, showLabels: mapLabels, paused: !store.active || store.modalOpen || store.protectedSave)
                            objective(wide: wide, compact: geometry.size.height < 450).padding(12)
                        }.clipped()
                    }
                    if wide { InspectorView().frame(width: min(400, geometry.size.width * 0.40)).background(harbourPaper).overlay(alignment: .leading) { Rectangle().fill(harbourInk.opacity(0.10)).frame(width: 1) } }
                }
                dock(wide: wide)
            }
            .background(harbourPaper)
            .onAppear { hasSideInspector = wide; scene.onSelect = { entity in guard !showInspector && !showSites && !showExplore && !showTown && !showSettings else { return }; store.select(entity); if !wide { showInspector = true } } }
            .onChange(of: wide) { _, value in hasSideInspector = value; if value { showInspector = false }; scene.onSelect = { entity in guard !showInspector && !showSites && !showExplore && !showTown && !showSettings else { return }; store.select(entity); if !value { showInspector = true } } }
            .sheet(isPresented: $showInspector) {
                NavigationStack {
                    InspectorView()
                        .safeAreaInset(edge: .bottom, spacing: 0) { inspectorNavigation }
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) { Button("Next step") { store.followGuidance() }.accessibilityIdentifier("toolbar-next-step") }
                            ToolbarItem(placement: .confirmationAction) { Button("Map") { showInspector = false } }
                        }
                }.presentationDetents([.large]).presentationCornerRadius(28).presentationDragIndicator(.visible)
            }
        }
        .tint(harbourInk)
        .sheet(isPresented: $showSettings) { SettingsView() }
        .sheet(isPresented: $showSites, onDismiss: {
            guard let site = pendingSite else { return }
            pendingSite = nil
            let current = store.snapshot?.entities.first { $0.id == site.id } ?? site
            store.select(current); scene.focusSite(current)
            if !hasSideInspector { showInspector = true }
        }) {
            SiteDirectoryView { site in pendingSite = site; showSites = false }
        }
        .sheet(isPresented: $showExplore) {
            ExploreDirectoryView { region in scene.focus(region); showExplore = false }
        }
        .sheet(isPresented: $showTown, onDismiss: {
            guard let category = pendingCategory else { return }
            pendingCategory = nil; store.navigate(category)
            if !hasSideInspector { showInspector = true }
        }) {
            TownDirectoryView { category in pendingCategory = category; showTown = false }
        }
        .confirmationDialog("Town pace", isPresented: $showSpeed, titleVisibility: .visible) {
            Button("Pause") { store.speed(0) }
            Button("Normal speed") { store.speed(1) }
            Button("Fast · 3×") { store.speed(3) }
            Button("Cancel", role: .cancel) {}
        }
        .onChange(of: showSettings) { _, value in store.modalOpen = value; if value { store.flush() } }
        .onChange(of: phase) { _, value in
            if value != .active { scene.persistViewport() }
            store.lifecycle(value == .active)
        }
        .onReceive(timer) { _ in store.pulse() }
        .safeAreaInset(edge: .bottom) {
            if !hasSideInspector && !showInspector && !showSettings { FeedbackBanner() }
        }
    }

    private var inspectorNavigation: some View {
        HStack(spacing: 8) {
            ForEach([("Production", "leaf"), ("Trade", "shippingbox"), ("Build", "hammer")], id: \.0) { item in
                Button { store.navigate(item.0) } label: {
                    VStack(spacing: 4) { Image(systemName: item.1); Text(item.0).font(.caption.weight(.semibold)) }
                        .frame(maxWidth: .infinity, minHeight: 54)
                        .background(store.category == item.0 ? HarbourTheme.sea.opacity(0.12) : .clear, in: RoundedRectangle(cornerRadius: 12))
                }.accessibilityIdentifier("inspector-nav-" + item.0).accessibilityAddTraits(store.category == item.0 ? .isSelected : [])
            }
        }.padding(.horizontal, 16).padding(.vertical, 8).foregroundStyle(harbourInk).background(harbourPaper)
            .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private var header: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 1) {
                Text("LITTLE HARBOUR").font(.system(.caption2, design: .rounded, weight: .bold)).tracking(2.4).lineLimit(1).minimumScaleFactor(0.8).foregroundStyle(HarbourTheme.muted)
                Text(store.snapshot?.style.identity ?? "Your Mediterranean town").font(.system(.headline, design: .serif)).lineLimit(2)
            }
            Spacer(minLength: 0)
            HStack(spacing: 5) { ResourceIcon(item: "coins", size: 26); Text("\(store.snapshot?.coins ?? 0)") }.font(.system(.subheadline, design: .rounded, weight: .bold)).monospacedDigit().padding(.horizontal, 12).padding(.vertical, 8).background(HarbourTheme.gold.opacity(0.12), in: Capsule()).accessibilityLabel("\(store.snapshot?.coins ?? 0) coins")
            Button { showSettings = true } label: { Image(systemName: store.protectedSave ? "exclamationmark.shield" : "gearshape").frame(width: 44, height: 44) }.accessibilityLabel("Settings and saves")
        }.foregroundStyle(harbourInk).padding(.horizontal, 16).padding(.vertical, 7).background(harbourPaper).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private func cameraControls(wide: Bool) -> some View {
        HStack(spacing: 5) {
            Button { showExplore = true } label: { Label("Explore", systemImage: "map").labelStyle(MapControlLabelStyle(compact: typeSize.isAccessibilitySize)).frame(minWidth: 44, minHeight: 44) }.accessibilityLabel("Explore")
            Button { pendingSite = nil; showSites = true } label: { Label("Sites", systemImage: "building.2").labelStyle(MapControlLabelStyle(compact: typeSize.isAccessibilitySize)).frame(minWidth: 44, minHeight: 44) }.accessibilityLabel("Sites")
            Spacer(minLength: 0)
            Button { scene.focus("all") } label: { Image(systemName: "arrow.up.left.and.arrow.down.right").frame(width: 44, height: 44) }.accessibilityLabel("Whole town").accessibilityIdentifier("fit-town")
            Button { scene.zoom(1.25) } label: { Image(systemName: "minus").frame(width: 44, height: 44) }.accessibilityLabel("Zoom out")
            Button { scene.zoom(0.8) } label: { Image(systemName: "plus").frame(width: 44, height: 44) }.accessibilityLabel("Zoom in")
        }.font(.subheadline.weight(.semibold)).padding(.horizontal, 8).foregroundStyle(harbourInk).background(harbourPaper.opacity(0.97), in: RoundedRectangle(cornerRadius: 18)).shadow(color: harbourInk.opacity(0.12), radius: 12, y: 4)
    }
    private func objective(wide: Bool, compact: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            if store.protectedSave {
                Text("Your saved town is protected").font(.headline)
                Text("Open Settings to export the original, restore a backup, or import a compatible save. Play is paused.").font(.callout)
                Button("Open save recovery") { showSettings = true }.buttonStyle(.borderedProminent)
            } else if let objective = store.snapshot?.objective {
                if !compact {
                    HStack {
                        Text("CHAPTER \(objective.chapter) · \(objective.chapterName.uppercased())").font(.caption2.weight(.bold)).tracking(0.8).lineLimit(1)
                        Spacer(minLength: 6)
                        Text("\(store.snapshot?.deliveries ?? 0) deliveries").font(.caption2).monospacedDigit()
                    }.foregroundStyle(HarbourTheme.muted)
                }
                HStack(spacing: 8) {
                    Button {
                        store.followGuidance(); if !wide { showInspector = true }
                    } label: {
                        HStack { if !compact { Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: 44, height: 48).accessibilityHidden(true) }; VStack(alignment: .leading, spacing: 3) { Text("NEXT STEP").font(.caption2.weight(.bold)).tracking(1); Text(store.snapshot?.guidance.title ?? objective.title).font(.system(compact ? .headline : .title3, design: .serif, weight: .semibold)).lineLimit(compact ? 1 : 2) }; Spacer(minLength: 8); Image(systemName: "arrow.right").font(.subheadline) }.frame(minHeight: 44).multilineTextAlignment(.leading)
                    }.accessibilityIdentifier("objective")
                    if !compact {
                        Button { withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) { expandedObjective.toggle() } } label: {
                            Image(systemName: expandedObjective ? "chevron.up" : "info").font(.subheadline.weight(.semibold)).frame(width: 44, height: 44).background(harbourInk.opacity(0.06), in: Circle())
                        }.accessibilityLabel(expandedObjective ? "Hide chapter guidance" : "Show chapter guidance").accessibilityIdentifier("objective-details")
                    }
                }
                if !compact && expandedObjective { Text("Elena · your harbour guide").font(.headline); Text(store.snapshot?.guidance.body ?? objective.description).font(.callout).fixedSize(horizontal: false, vertical: true) }

            }
        }.padding(15).frame(maxWidth: 540, alignment: .leading).foregroundStyle(harbourInk).background(harbourPaper.opacity(0.97), in: RoundedRectangle(cornerRadius: 18))
    }
    private func dock(wide: Bool) -> some View {
        HStack(spacing: 0) {
            ForEach([("Production", "leaf"), ("Trade", "shippingbox"), ("Build", "hammer")], id: \.0) { item in
                Button { store.navigate(item.0); if !wide { showInspector = true } } label: { VStack(spacing: 4) { Image(systemName: item.1); Text(item.0).font(.caption.weight(store.category == item.0 ? .bold : .medium)) }.frame(maxWidth: .infinity, minHeight: 54).background(store.category == item.0 ? HarbourTheme.sea.opacity(0.10) : .clear, in: RoundedRectangle(cornerRadius: 15)).padding(.horizontal, 3) }
                    .accessibilityIdentifier("nav-" + item.0).accessibilityAddTraits(store.category == item.0 ? .isSelected : [])
            }
            Button { pendingCategory = nil; showTown = true } label: { VStack(spacing: 4) { Image(systemName: "square.grid.2x2"); Text("Town").font(.caption) }.frame(maxWidth: .infinity, minHeight: 54).background(["Production", "Trade", "Build"].contains(store.category) ? .clear : HarbourTheme.sea.opacity(0.10), in: RoundedRectangle(cornerRadius: 15)) }.accessibilityLabel("Town")
            Button { showSpeed = true } label: { VStack(spacing: 4) { Image(systemName: store.snapshot?.speed == 0 ? "pause.circle" : "play.circle"); Text(store.snapshot?.speed == 3 ? "3×" : store.snapshot?.speed == 0 ? "Paused" : "1×").font(.caption) }.frame(maxWidth: .infinity, minHeight: 54) }.accessibilityLabel("Simulation speed").accessibilityValue(store.snapshot?.speed == 0 ? "Paused" : store.snapshot?.speed == 3 ? "Three times normal" : "Normal")
        }.foregroundStyle(harbourInk).padding(.horizontal, 8).padding(.vertical, 5).background(harbourPaper).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private func category(for target: String?) -> String {
        ["produce":"Production", "trade":"Trade", "build":"Build", "contracts":"Contracts", "waterfront":"Waterfront", "market":"Market", "inland":"Inland", "fleet":"Fleet", "neighbourhood":"Neighbourhood", "residents":"Residents", "ferry":"Ferry"][target ?? ""] ?? "Production"
    }
}

struct InspectorView: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    @EnvironmentObject private var store: GameStore
    @State private var pendingAction: HarbourAction?
    @State private var projectGoal: String?
    @State private var query = ""
    @FocusState private var searchFocused: Bool
    @State private var readyOnly = false
    @State private var showActivityPicker = false
    @State private var allSupplies = false
    @State private var siteOnly = true
    private var selected: WorldEntity? { store.snapshot?.entities.first { $0.id == store.selectedSite && $0.category == store.category } }
    var body: some View {
        ScrollViewReader { reader in
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Color.clear.frame(height: 0).id("panel-top")
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 5) {
                            Label("YOUR TOWN", systemImage: HarbourTheme.symbol(store.category)).font(.caption2.weight(.bold)).tracking(1.8).foregroundStyle(HarbourTheme.muted)
                            Text(store.category).font(.system(typeSize.isAccessibilitySize ? .headline : .largeTitle, design: .serif, weight: .semibold))
                        }
                        Spacer()
                        Button { showActivityPicker = true } label: { Image(systemName: "line.3.horizontal.decrease").frame(width: 44, height: 44).background(harbourInk.opacity(0.06), in: Circle()) }.accessibilityLabel("Choose town activity")
                    }
                    if selected == nil && !store.guidanceFocus { Text(HarbourTheme.caption(store.category)).font(.subheadline).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
                    if let entity = selected {
                        HStack(spacing: 8) {
                            Image(uiImage: HarbourArtwork.image(store.snapshot?.artwork(for: entity) ?? entity.texture)).resizable().scaledToFit().frame(width: 98, height: 98).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(entity.displayLabel).font(.system(.title3, design: .serif, weight: .semibold))
                                Label(entity.stage == "unbuilt" ? "A place for something new" : entity.stage == "building" ? "Construction underway" : "Level \(entity.level) · \(entity.ripe == true ? "Ready to harvest" : "Established")", systemImage: entity.stage == "building" ? "hammer" : entity.stage == "unbuilt" ? "plus.circle" : "checkmark.seal").font(.caption)
                            }
                            Spacer(minLength: 0)
                            Button { store.selectedSite = nil } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }.accessibilityLabel("Clear selected site")
                        }.harbourCard()
                    }
                    if let s = store.snapshot {
                        guidanceCard(s)
                        if store.category == "Journal" { journal(s) }
                        else {
                            if ["Fleet", "Circuits", "Ferry"].contains(store.category) { boats(s) }
                            if (store.category == "Production" || store.category == "Queues") && (!store.guidanceFocus || s.guidance.waiting) { jobs(s) }
                            if selected == nil && !store.guidanceFocus { stock(s) }
                            if !store.guidanceFocus { HStack {
                                Image(systemName: "magnifyingglass").foregroundStyle(HarbourTheme.muted)
                                TextField("Find an action or resource", text: $query).focused($searchFocused).accessibilityLabel("Search actions").autocorrectionDisabled().submitLabel(.done).onSubmit { searchFocused = false }
                                if !query.isEmpty { Button { query = ""; searchFocused = false } label: { Image(systemName: "xmark.circle.fill").font(.system(size: 22)).frame(width: 44, height: 44) }.accessibilityLabel("Clear search") }
                            }.padding(.horizontal, 12).frame(minHeight: 46).background(.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 13)) }
                            let categoryActions = s.actions.filter { $0.category == store.category && (!store.guidanceFocus || s.guidance.choices.contains($0.id)) }
                            let relevant = categoryActions.filter { $0.belongs(to: selected) }
                            if selected != nil && !relevant.isEmpty {
                                Toggle("Only this site", isOn: $siteOnly).font(.subheadline).accessibilityIdentifier("site-filter")
                            }
                            if !store.guidanceFocus { Picker("Action availability", selection: $readyOnly) {
                                Text("All actions").tag(false)
                                Text("Ready now").tag(true)
                            }.pickerStyle(.segmented).accessibilityIdentifier("action-filter") }
                            let actions = (selected != nil && siteOnly && !relevant.isEmpty ? relevant : categoryActions).filter { (!readyOnly || $0.enabled) && (query.isEmpty || ($0.title + " " + $0.detail + " " + $0.reason).localizedCaseInsensitiveContains(query)) }
                            HStack {
                                Text(store.guidanceFocus ? "YOUR NEXT ACTION" : readyOnly ? "READY TO GO" : "MAKE YOUR NEXT MOVE").font(.caption2.weight(.bold)).tracking(1.2)
                                Spacer(); Text("\(actions.count)").font(.caption.monospacedDigit())
                            }.foregroundStyle(HarbourTheme.muted)
                            LazyVStack(spacing: 12) { ForEach(actions) { action in actionCard(action) } }
                            if selected != nil || store.guidanceFocus { stock(s) }
                            if actions.isEmpty && !store.guidanceFocus {
                                VStack(alignment: .leading, spacing: 10) {
                                    Label(query.isEmpty ? "A little preparation first" : "No matching actions", systemImage: query.isEmpty ? "leaf" : "magnifyingglass").font(.headline)
                                    Text(query.isEmpty ? "Check all actions for the ingredients and milestones you need next." : "Try a building, resource or route name.").font(.subheadline).foregroundStyle(HarbourTheme.muted)
                                    Button("Show all actions") { readyOnly = false; query = ""; siteOnly = false }.frame(minHeight: 44)
                                }.harbourCard()
                            }
                        }
                    }
                }.padding(20)
            }.scrollDismissesKeyboard(.interactively).background(harbourPaper).foregroundStyle(harbourInk)
            .onChange(of: store.guidanceFocus) { _, _ in searchFocused = false; query = ""; readyOnly = false; siteOnly = true; reader.scrollTo("panel-top", anchor: .top) }
            .onChange(of: store.category) { _, _ in searchFocused = false; query = ""; readyOnly = false; siteOnly = true; reader.scrollTo("panel-top", anchor: .top) }
            .onChange(of: store.selectedSite) { _, _ in searchFocused = false; siteOnly = true; readyOnly = false; reader.scrollTo("panel-top", anchor: .top) }
        }
        .safeAreaInset(edge: .bottom) { FeedbackBanner() }
        .confirmationDialog("Confirm this investment", isPresented: Binding(get: { pendingAction != nil }, set: { if !$0 { pendingAction = nil } }), titleVisibility: .visible) {
            if let action = pendingAction { Button(action.title, role: .destructive) { store.perform(action); pendingAction = nil } }
            Button("Cancel", role: .cancel) { pendingAction = nil }
        } message: { if let action = pendingAction { Text(action.detail.isEmpty ? "Completed deliveries and spent materials are not refunded. Review the stated refund before continuing." : action.detail + ". This replaces the current setup without a refund.") } }
        .sheet(isPresented: $showActivityPicker) { TownDirectoryView { category in store.navigate(category); showActivityPicker = false } }
        .sheet(item: Binding(get: { projectGoal.map(GoalSelection.init) }, set: { projectGoal = $0?.id })) { goal in ProjectView(goal: goal.id) }
    }
    private func guidanceCard(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if store.guidanceFocus { HStack(alignment: .top, spacing: 12) {
                Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: 58, height: 64).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text("ELENA · YOUR HARBOUR GUIDE").font(.caption2.weight(.bold)).tracking(0.6).foregroundStyle(HarbourTheme.muted)
                    Text(s.guidance.title).font(.system(.headline, design: .serif)).accessibilityIdentifier("next-step-title")
                }
            }
                Text(s.guidance.body).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                Text("Chapter \(s.objective.chapter) · \(s.objective.title)").font(.caption).foregroundStyle(HarbourTheme.muted)
                if !s.guidance.requirements.isEmpty {
                    Text("SUPPLIES FOR THE GOAL").font(.caption2.weight(.bold)).foregroundStyle(HarbourTheme.muted)
                    ForEach(s.guidance.requirements) { r in
                        HStack { ResourceIcon(item: r.item, size: 24); Text(goodsNames[r.item] ?? "Coins"); Spacer(); Text("\(r.available) / \(r.required)").monospacedDigit(); Image(systemName: r.available >= r.required ? "checkmark.circle.fill" : "circle").foregroundStyle(r.available >= r.required ? HarbourTheme.sea : HarbourTheme.muted) }.font(.caption)
                    }
                }
                if s.speed == 0 { Button("Resume town · 1×") { store.speed(1) }.buttonStyle(.borderedProminent).accessibilityIdentifier("guidance-resume") }
                else if s.guidance.waiting { Label("Work takes game time. Your next step updates automatically.", systemImage: "clock").font(.caption).foregroundStyle(HarbourTheme.muted) }
                Button("Browse all \(store.category.lowercased())") { store.guidanceFocus = false }.font(.caption).frame(minHeight: 44)
            } else {
                Button { store.followGuidance() } label: { HStack { Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: 36, height: 40).accessibilityHidden(true); VStack(alignment: .leading) { Text("Ask Elena").font(.caption).foregroundStyle(HarbourTheme.muted); Text("Show my next step") }; Spacer(); Image(systemName: "arrow.right") }.frame(minHeight: 44) }.accessibilityIdentifier("show-next-step")
            }
        }.padding(14).background(HarbourTheme.gold.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))
    }
    private func stock(_ s: HarbourSnapshot) -> some View {
        let goods = s.stock.keys.sorted().filter { (s.stock[$0] ?? 0) > 0 }
        return DisclosureGroup(isExpanded: $allSupplies) {
            LazyVGrid(columns: typeSize.isAccessibilitySize ? [GridItem(.flexible())] : [GridItem(.adaptive(minimum: 86))], alignment: .leading, spacing: 8) {
                ForEach(goods, id: \.self) { item in supply(item, count: s.stock[item] ?? 0) }
            }.padding(.top, 8)
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                if typeSize.isAccessibilitySize {
                    Text("Storehouse").font(.headline)
                    Text("\(goods.count) goods").font(.caption)
                } else { HStack { Label("Storehouse", systemImage: "shippingbox").font(.subheadline.weight(.semibold)); Spacer(); Text("\(goods.count) goods").font(.caption) } }
                if !allSupplies && !typeSize.isAccessibilitySize {
                    HStack(spacing: 12) {
                        ForEach(Array(goods.prefix(3)), id: \.self) { item in
                            HStack(spacing: 6) {
                                ResourceIcon(item: item, size: 28)
                                VStack(alignment: .leading, spacing: 3) {
                                Text("\(s.stock[item] ?? 0)").font(.system(.headline, design: .rounded)).monospacedDigit().accessibilityIdentifier("stock-count-" + item)
                                Text(goodsNames[item] ?? item).font(.caption).foregroundStyle(HarbourTheme.muted)
                                }
                            }.frame(maxWidth: .infinity, alignment: .leading)
                        }
                        if goods.isEmpty { Text("Your next harvest starts here.").font(.caption).foregroundStyle(HarbourTheme.muted) }
                    }
                }
            }
        }.padding(14).background(harbourInk.opacity(0.045), in: RoundedRectangle(cornerRadius: 16)).accessibilityIdentifier("storehouse")
    }
    private func supply(_ item: String, count: Int) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            ResourceIcon(item: item, size: 40)
            Text("\(count)").font(.system(.title3, design: .rounded, weight: .semibold)).monospacedDigit().accessibilityIdentifier("stock-count-" + item)
            Text(goodsNames[item] ?? item).font(.caption)
        }.frame(maxWidth: .infinity, alignment: .leading).padding(9).background(.white.opacity(0.75), in: RoundedRectangle(cornerRadius: 10))
    }
    private func jobs(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !s.jobs.isEmpty { Label("At work · \(s.jobs.count)", systemImage: "clock").font(.subheadline.weight(.semibold)) }
            ForEach(s.jobs) { job in
                VStack(alignment: .leading, spacing: 6) {
                    HStack { Text(job.name).font(.subheadline.weight(.medium)); Spacer(); Text("\(Int(ceil(job.left)))s").font(.caption.monospacedDigit()) }
                    ProgressView(value: max(0, min(1, 1 - job.left / max(1, job.duration)))).tint(HarbourTheme.sea).accessibilityLabel(job.name).accessibilityValue("\(Int(ceil(job.left))) seconds remaining")
                }
            }
        }
    }
    private func boats(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(s.boats.indices, id: \.self) { slot in
                if let boat = s.boats[slot] {
                    HStack(spacing: 12) {
                        Image(uiImage: HarbourArtwork.image(boat.artwork)).resizable().scaledToFit().frame(width: 66, height: 66).accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Berth \(slot + 1) · \(boat.type.capitalized)").font(.headline)
                            if let trip = boat.trip {
                                Text("\(trip.ferry == true ? "Passengers" : "Cargo") → \(trip.route.capitalized) · \(Int(ceil(trip.left)))s remaining").font(.caption).accessibilityIdentifier("voyage-status")
                                ProgressView(value: max(0, min(1, 1 - trip.left / trip.duration)))
                            } else { Text("Moored · ready for provisions").font(.caption).foregroundStyle(HarbourTheme.muted) }
                        }
                    }.frame(maxWidth: .infinity, alignment: .leading).harbourCard()
                }
            }
        }
    }
    private func actionCard(_ action: HarbourAction) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: HarbourTheme.symbol(action.category)).font(.system(size: 20)).foregroundStyle(action.enabled ? HarbourTheme.sea : HarbourTheme.muted).frame(width: 34, height: 34).background(harbourInk.opacity(0.05), in: RoundedRectangle(cornerRadius: 10)).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 7) {
                    Text(action.title).font(.system(.body, design: .rounded, weight: .semibold)).fixedSize(horizontal: false, vertical: true)
                    if !action.detail.isEmpty { Text(action.detail).font(.subheadline).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
                }
            }
            if !action.enabled { Label(action.reason, systemImage: "info.circle").font(.caption).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
            Button { if action.destructive { pendingAction = action } else { store.perform(action) } } label: {
                HStack {
                    Text(store.lastPerformedActionID == action.id ? "Done · saved" : action.enabled ? action.verb : "Not ready yet").fixedSize(horizontal: false, vertical: true)
                    Spacer()
                    Image(systemName: action.enabled ? "arrow.right" : "lock").font(.system(size: 18, weight: .semibold))
                }.font(.subheadline.weight(.semibold)).padding(.horizontal, 13).frame(minHeight: 46)
                    .background(action.enabled ? HarbourTheme.sea : harbourInk.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(action.enabled ? .white : HarbourTheme.muted)
            }.buttonStyle(.plain).disabled(!action.enabled || store.protectedSave || store.lastPerformedActionID != nil)
                .accessibilityLabel(action.title).accessibilityHint(action.enabled ? action.detail : action.reason)
                .accessibilityIdentifier(action.title == "Harvest & replant" ? "harvest" : "action-" + action.id)
            if let goal = action.goal {
                HStack {
                    Button { projectGoal = goal } label: { Label("Plan supplies", systemImage: "list.bullet.clipboard").frame(minHeight: 44) }
                    Spacer()
                    Button("Reserve") { store.reserve(goal) }.frame(minHeight: 44).disabled(store.protectedSave)
                }.font(.caption.weight(.semibold))
            }
        }.harbourCard()
    }
    private func journal(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Season \(s.evolution.season) · \(s.evolution.choiceCount) decisions").font(.headline)
                ForEach(s.evolution.axes.keys.sorted(), id: \.self) { axis in
                    VStack(alignment: .leading, spacing: 6) { HStack { Text(axis.capitalized); Spacer(); Text("\(s.evolution.axes[axis] ?? 0)").monospacedDigit() }; ProgressView(value: Double(s.evolution.axes[axis] ?? 0), total: 100).tint(HarbourTheme.sea) }.font(.subheadline)
                }
            }.harbourCard()
            if let event = s.event {
                VStack(alignment: .leading, spacing: 12) {
                    Label("A MOMENT TO CHOOSE", systemImage: "sun.max").font(.caption2.weight(.bold)).tracking(1)
                    Text(event.title).font(.system(.title2, design: .serif)); Text(event.description).font(.subheadline)
                    ForEach(event.options) { option in Button(option.label) { store.resolve(option.id) }.buttonStyle(.bordered).frame(minHeight: 44).disabled(store.protectedSave) }
                }.harbourCard()
            }
            Text("Town activity").font(.system(.title2, design: .serif))
            ForEach(Array(s.log.enumerated()), id: \.offset) { _, line in HStack(alignment: .top, spacing: 12) { Circle().fill(HarbourTheme.gold).frame(width: 6, height: 6).padding(.top, 7); Text(line).font(.callout) }.padding(.vertical, 4) }
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
                    VStack(alignment: .leading, spacing: 18) {
                        Label(plan.ready ? "SUPPLIES READY" : "YOUR SUPPLY PLAN", systemImage: plan.ready ? "checkmark.seal" : "list.bullet.clipboard").font(.caption.weight(.bold)).tracking(1).foregroundStyle(HarbourTheme.sea)
                        Text(plan.title).font(.system(.title, design: .serif, weight: .semibold))
                        ForEach(plan.requirements) { r in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack { ResourceIcon(item: r.item, size: 32); Text(goodsNames[r.item] ?? r.item.capitalized); Spacer(); Text("\(r.available) / \(r.required)").monospacedDigit() }.font(.headline)
                                ProgressView(value: min(Double(r.required), Double(r.available)), total: max(1, Double(r.required))).tint(HarbourTheme.sea)
                                HStack {
                                    Text(r.missing == 0 ? "Ready in the storehouse" : "\(r.missing) still needed")
                                    Spacer()
                                    if r.incoming > 0 { Label("\(r.incoming) underway", systemImage: "clock") }
                                }.font(.caption).foregroundStyle(HarbourTheme.muted)
                            }.harbourCard()
                        }
                        if !plan.recipes.isEmpty {
                            Text("Make the missing supplies").font(.system(.title3, design: .serif, weight: .semibold))
                            ForEach(plan.recipes) { r in
                                HStack(alignment: .top, spacing: 12) {
                                    Text("\(r.batches)×").font(.title3.monospacedDigit()).foregroundStyle(HarbourTheme.gold)
                                    VStack(alignment: .leading, spacing: 4) { Text(r.name).font(.headline); Text("\(Int(r.seconds))s · \(r.queueable) ready to queue").font(.caption).foregroundStyle(HarbourTheme.muted) }
                                }.frame(maxWidth: .infinity, alignment: .leading).harbourCard()
                            }
                        }
                        ForEach(Array(plan.blockers.enumerated()), id: \.offset) { _, b in Label(b.message, systemImage: "info.circle").font(.subheadline).foregroundStyle(HarbourTheme.muted) }
                        Button { store.queuePlan(goal) } label: { Label("Queue available production", systemImage: "play.fill").frame(maxWidth: .infinity, minHeight: 44) }.buttonStyle(.borderedProminent).disabled(store.protectedSave || !plan.recipes.contains { $0.queueable > 0 })
                        Button { store.reserve(goal) } label: { Label("Reserve available supplies", systemImage: "archivebox").frame(maxWidth: .infinity, minHeight: 44) }.buttonStyle(.bordered).disabled(store.protectedSave)
                        Text("Reservations keep these supplies aside for this project. Finish the ingredients before starting later steps. Time pauses when you leave the app.").font(.footnote).foregroundStyle(HarbourTheme.muted)
                    }.padding(20)
                }
            }.background(HarbourTheme.paper).foregroundStyle(HarbourTheme.ink).tint(HarbourTheme.sea)
            .navigationTitle("Plan supplies").navigationBarTitleDisplayMode(.inline).toolbar { Button("Done") { dismiss() } }
            .safeAreaInset(edge: .bottom) { FeedbackBanner() }
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
                Button { store.message = nil } label: { Image(systemName: "xmark.circle.fill").font(.system(size: 22)).frame(width: 44, height: 44) }.accessibilityLabel("Dismiss message")
            }.padding(12).foregroundStyle(.white).background(harbourInk).accessibilityElement(children: .contain)
        }
    }
}

private struct MapControlLabelStyle: LabelStyle {
    let compact: Bool
    func makeBody(configuration: Configuration) -> some View {
        HStack { configuration.icon; if !compact { configuration.title } }

    }
}

private struct SiteDirectoryView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""
    let onSelect: (WorldEntity) -> Void
    private var sites: [WorldEntity] {
        (store.snapshot?.entities ?? []).filter { search.isEmpty || ($0.displayLabel + " " + $0.zone + " " + $0.stage).localizedCaseInsensitiveContains(search) }
    }
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Find a place in your town. Choose a site to see its work, supplies and next improvements.").font(.subheadline).foregroundStyle(HarbourTheme.muted)
                }
                ForEach(sites) { site in
                    Button { onSelect(site) } label: {
                        HStack(spacing: 14) {
                            Image(uiImage: HarbourArtwork.image(store.snapshot?.artwork(for: site) ?? site.texture)).resizable().scaledToFit().frame(width: 72, height: 72).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(site.displayLabel).font(.headline)
                                Text(site.stage == "unbuilt" ? "Planned site" : site.stage == "building" ? "Under construction" : "Level \(site.level) · \(site.ripe == true ? "Ready to harvest" : "Established")").font(.subheadline).foregroundStyle(HarbourTheme.muted)
                            }
                            Spacer(minLength: 0)
                            Image(systemName: "chevron.right").font(.caption.weight(.semibold)).accessibilityHidden(true)
                        }.padding(.vertical, 4)
                    }.accessibilityLabel("\(site.displayLabel) · \(site.stage) · level \(site.level)")
                }
                if sites.isEmpty { Text("No matching sites. Try a building or district name.").foregroundStyle(HarbourTheme.muted) }
            }.scrollContentBackground(.hidden).background(HarbourTheme.paper).tint(HarbourTheme.ink)
                .searchable(text: $search, prompt: "Find a building or boat")
                .navigationTitle("Town sites").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }
}

private struct ExploreDirectoryView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("mapLabels") private var mapLabels = true
    let onSelect: (String) -> Void
    private let regions = [("all", "Whole town", "See how it all comes together", "waterfront-built"), ("harbour", "Home harbour", "The quay, fishing and the waterfront", "pier-built"), ("inland", "Hillside & fields", "Harvests, mills and workshops", "mill-built"), ("neighbourhood", "Neighbourhood", "Homes, gardens and local crafts", "home-built"), ("market", "Market quarter", "The heart of your growing town", "market-built"), ("coast", "Working coast", "Boats, the lighthouse and ferry", "lighthouse-built")]
    var body: some View {
        NavigationStack {
            List {
                Section("Find your way") {
                    ForEach(regions, id: \.0) { region in
                        Button { onSelect(region.0) } label: { HStack(spacing: 14) {
                            Image(uiImage: HarbourArtwork.image(region.3)).resizable().scaledToFit().frame(width: 62, height: 62).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 4) { Text(region.1).font(.system(.headline, design: .serif)); Text(region.2).font(.subheadline).foregroundStyle(HarbourTheme.muted) }
                            Spacer(minLength: 0); Image(systemName: "chevron.right").font(.caption).accessibilityHidden(true)
                        }.padding(.vertical, 4) }.accessibilityLabel(region.1).accessibilityIdentifier("explore-" + region.0)
                    }
                }
                Section { Toggle("Building labels", isOn: $mapLabels) }
            }.scrollContentBackground(.hidden).background(HarbourTheme.paper).tint(HarbourTheme.ink)
                .navigationTitle("Explore the harbour").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }
}

private struct TownDirectoryView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    let onSelect: (String) -> Void
    private func available(_ names: [String]) -> [String] { names.filter { store.snapshot?.categories.contains($0) == true } }
    var body: some View {
        NavigationStack {
            List {
                Section("Your living town") {
                    Button { onSelect("Journal") } label: { activityRow("Journal", title: "Town journal") }.accessibilityLabel("Town journal")
                    rows(available(["Contracts", "Fleet", "Neighbourhood", "Ferry"]))
                }
                Section("The working harbour") { rows(available(["Production", "Trade", "Build"])) }
                let growth = available(["Waterfront", "Market", "Inland", "Lighthouse", "Destinations", "Residents", "Town layout"])
                if !growth.isEmpty { Section("Grow the town") { rows(growth) } }
                let work = available(["Queues", "Automation", "Refits", "Reservations", "Circuits"])
                if !work.isEmpty { Section("Manage work") { rows(work) } }
            }.scrollContentBackground(.hidden).background(HarbourTheme.paper).tint(HarbourTheme.ink)
                .navigationTitle("Town activities").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }
    private func rows(_ categories: [String]) -> some View {
        ForEach(categories, id: \.self) { category in
            Button { onSelect(category) } label: {
                activityRow(category, title: category)
            }.accessibilityLabel(category)
        }
    }
    private func activityRow(_ category: String, title: String) -> some View {
        HStack(spacing: 12) {
            Image(uiImage: HarbourArtwork.image(HarbourTheme.artwork(category))).resizable().scaledToFit().frame(width: 54, height: 54).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.system(.headline, design: .serif))
                Text(HarbourTheme.caption(category)).font(.caption).foregroundStyle(HarbourTheme.muted)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.caption).accessibilityHidden(true)
        }.padding(.vertical, 3)
    }

}
