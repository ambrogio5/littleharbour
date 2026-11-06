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
    @Environment(\.colorScheme) private var colorScheme
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
    @State private var mapExpanded = false
    @State private var keyboardShown = false
    @AppStorage("mapLabels") private var mapLabels = true
    private let timer = Timer.publish(every: 0.25, on: .main, in: .common).autoconnect()
    var body: some View {
        GeometryReader { geometry in
            // At accessibility sizes, use the wider activity sheet instead of a narrow side panel.
            let wide = geometry.size.width >= 700 && geometry.size.height >= 300 && !typeSize.isAccessibilitySize
            // The dock already contains full-height touch targets. Use the lower
            // safe-area strip for layout, retaining clearance for the home gesture.
            let reclaimedBottom = keyboardShown ? 0 : max(0, geometry.safeAreaInsets.bottom - 12)
            VStack(spacing: 0) {
                Group { if wide { landscapeHeader } else { header } }
                    .overlay(alignment: .bottom) { Rectangle().fill(HarbourTheme.sea.opacity(0.25)).frame(height: 1) }
                HStack(spacing: 0) {
                    VStack(spacing: 0) {
                        // Keep native control hit regions outside the UIKit/SpriteKit surface.
                        // A separate toolbar avoids ambiguous accessibility hit regions on older iOS.
                        if !wide { cameraControls(wide: false).padding(.horizontal, 8).padding(.vertical, 3).background(harbourPaper) }
                        ZStack(alignment: .bottomLeading) {
                            HarbourMap(scene: scene, snapshot: store.snapshot, selected: store.selectedSite, reduceMotion: reduceMotion, showLabels: mapLabels, paused: !store.active || store.modalOpen || store.protectedSave)
                                .overlay { if colorScheme == .dark { Color(red: 0.02, green: 0.08, blue: 0.14).opacity(0.22).allowsHitTesting(false).accessibilityHidden(true) } }
                            if !mapExpanded && (!wide || !store.guidanceFocus) { objective(wide: wide, compact: wide || geometry.size.height < 450).padding(wide ? 6 : 12) }
                        }.frame(maxWidth: .infinity, maxHeight: .infinity).clipped()
                    }.frame(maxWidth: .infinity, maxHeight: .infinity)
                    if wide && !mapExpanded { InspectorView(showCelebrations: false).environment(\.densePanels, !typeSize.isAccessibilitySize).frame(width: min(360, max(290, geometry.size.width * 0.34))).background(harbourPaper).overlay(alignment: .leading) { Rectangle().fill(harbourInk.opacity(0.10)).frame(width: 1) } }
                }.frame(maxWidth: .infinity, maxHeight: .infinity)
                dock(wide: wide).environment(\.densePanels, wide)
                    .overlay(alignment: .top) { Rectangle().fill(HarbourTheme.sea.opacity(0.25)).frame(height: 1) }
            }
            .frame(width: geometry.size.width, height: geometry.size.height + reclaimedBottom, alignment: .top)
            .background(harbourPaper)
            .overlay(alignment: .bottom) { if !wide && !showInspector && !showSettings { FeedbackBanner().padding(.bottom, 62) } }
            .accessibilityHidden(store.chapterCelebration != nil && !showInspector)
            .overlay { if !showInspector, let memory = store.chapterCelebration { ChapterMoment(memory: memory) } }
            .onChange(of: mapExpanded) { _, expanded in hasSideInspector = wide && !expanded }
            .onAppear { hasSideInspector = wide && !mapExpanded; scene.switchCoastViewport(id: store.activeCoastID); scene.onSelect = { entity in guard !showInspector && !showSites && !showExplore && !showTown && !showSettings else { return }; store.select(entity); if !hasSideInspector { showInspector = true } } }
            .onChange(of: wide) { _, value in if !value { mapExpanded = false }; hasSideInspector = value && !mapExpanded; if value { showInspector = false }; scene.onSelect = { entity in guard !showInspector && !showSites && !showExplore && !showTown && !showSettings else { return }; store.select(entity); if !hasSideInspector { showInspector = true } } }
            .sheet(isPresented: $showInspector) {
                NavigationStack {
                    InspectorView()
                        .safeAreaInset(edge: .top, spacing: 0) {
                            HStack {
                                Button("Next step") { store.followGuidance() }.frame(minHeight: 44).accessibilityIdentifier("toolbar-next-step")
                                Spacer()
                                Button("Map") { showInspector = false }.frame(minHeight: 44)
                            }.font(.subheadline.weight(.semibold)).buttonStyle(.bordered)
                                .padding(.horizontal, 12).padding(.vertical, 2).background(harbourPaper)
                                .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                        }
                        .safeAreaInset(edge: .bottom, spacing: 0) {
                            inspectorNavigation.padding(.bottom, UIDevice.current.userInterfaceIdiom == .pad ? 0 : -reclaimedBottom)
                        }
                        .toolbar(.hidden, for: .navigationBar)
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
        .onChange(of: store.selectedSite) { _, id in
            if store.directionFocus != nil, let entity = store.snapshot?.entities.first(where: { $0.id == id }) { scene.focusSite(entity) }
        }
        .onChange(of: store.activeCoastID) { _, id in scene.switchCoastViewport(id: id) }
        .onReceive(timer) { _ in store.pulse() }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in keyboardShown = true }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in keyboardShown = false }
        .background(harbourPaper.ignoresSafeArea())
    }

    private var landscapeHeader: some View {
        HStack(spacing: 8) {
            Text(store.snapshot?.story.townName ?? "Porto Lume").font(.system(.headline, design: .serif)).lineLimit(1).minimumScaleFactor(0.8).accessibilityIdentifier("town-name")
            Button { store.navigate("Goals"); if !hasSideInspector { showInspector = true } } label: { Image(systemName: "list.bullet.clipboard").frame(width: 44, height: 44) }.accessibilityLabel("Goals").accessibilityIdentifier("map-goals")
            cameraControls(wide: true)
            HStack(spacing: 3) { ResourceIcon(item: "coins", size: 22); Text("\(store.snapshot?.coins ?? 0)").font(.subheadline.bold()).monospacedDigit() }
            Button { showSettings = true } label: { Image(systemName: "gearshape").frame(width: 44, height: 44) }.accessibilityLabel("Settings and saves")
        }.padding(.horizontal, 10).padding(.vertical, 2).foregroundStyle(harbourInk).background(harbourPaper).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private var inspectorNavigation: some View {
        HStack(spacing: 8) {
            ForEach([("Production", "leaf"), ("Trade", "shippingbox"), ("Build", "hammer")], id: \.0) { item in
                Button { store.navigate(item.0) } label: {
                    VStack(spacing: 4) { Image(systemName: item.1); Text(item.0).font(.caption.weight(.semibold)) }
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(store.category == item.0 ? HarbourTheme.sea.opacity(0.12) : .clear, in: RoundedRectangle(cornerRadius: 12))
                }.accessibilityIdentifier("inspector-nav-" + item.0).accessibilityAddTraits(store.category == item.0 ? .isSelected : [])
            }
        }.padding(.horizontal, 16).padding(.vertical, 2).foregroundStyle(harbourInk).background(harbourPaper)
            .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private var header: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 1) {
                Text(store.snapshot?.story.townName ?? "Porto Lume").font(.system(.caption2, design: .rounded, weight: .bold)).tracking(2.4).lineLimit(1).minimumScaleFactor(0.8).foregroundStyle(HarbourTheme.muted).accessibilityIdentifier("town-name")
                Text(store.snapshot?.style.identity ?? "Your Mediterranean town").font(.system(.headline, design: .serif)).lineLimit(2)
            }
            Spacer(minLength: 0)
            HStack(spacing: 5) { ResourceIcon(item: "coins", size: 26); Text("\(store.snapshot?.coins ?? 0)") }.font(.system(.subheadline, design: .rounded, weight: .bold)).monospacedDigit().padding(.horizontal, 12).padding(.vertical, 8).background(HarbourTheme.gold.opacity(0.12), in: Capsule()).accessibilityLabel("\(store.snapshot?.coins ?? 0) coins")
            Button { store.navigate("Goals"); if !hasSideInspector { showInspector = true } } label: { Image(systemName: "list.bullet.clipboard").frame(width: 44, height: 44) }.accessibilityLabel("Goals").accessibilityIdentifier("map-goals")
            Button { showSettings = true } label: { Image(systemName: store.protectedSave ? "exclamationmark.shield" : "gearshape").frame(width: 44, height: 44) }.accessibilityLabel("Settings and saves")
        }.foregroundStyle(harbourInk).padding(.horizontal, 16).padding(.vertical, 7).background(harbourPaper).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private func cameraControls(wide: Bool) -> some View {
        HStack(spacing: 5) {
            Button { showExplore = true } label: { Label("Explore", systemImage: "map").labelStyle(MapControlLabelStyle(compact: typeSize.isAccessibilitySize)).frame(minWidth: 44, minHeight: 44) }.accessibilityLabel("Explore")
            Button { pendingSite = nil; showSites = true } label: { Label("Sites", systemImage: "building.2").labelStyle(MapControlLabelStyle(compact: typeSize.isAccessibilitySize)).frame(minWidth: 44, minHeight: 44) }.accessibilityLabel("Sites")
            Spacer(minLength: 0)
            if wide {
                Button { mapExpanded.toggle() } label: { Image(systemName: mapExpanded ? "sidebar.right" : "map.fill").frame(width: 44, height: 44) }
                    .accessibilityLabel(mapExpanded ? "Show activity panel" : "Expand map")
                    .accessibilityIdentifier("map-expand")
            }
            Button { scene.focus("all") } label: { Image(systemName: "arrow.up.left.and.arrow.down.right").frame(width: 44, height: 44) }.accessibilityLabel("Whole town").accessibilityIdentifier("fit-town")
            Button { scene.zoom(1.25) } label: { Image(systemName: "minus").frame(width: 44, height: 44) }.accessibilityLabel("Zoom out")
            Button { scene.zoom(0.8) } label: { Image(systemName: "plus").frame(width: 44, height: 44) }.accessibilityLabel("Zoom in")
        }.font(.subheadline.weight(.semibold)).padding(.horizontal, wide ? 0 : 8).foregroundStyle(harbourInk)
    }
    private func objective(wide: Bool, compact: Bool = false) -> some View {
        let collapsed = compact || !expandedObjective
        return VStack(alignment: .leading, spacing: 7) {
            if store.protectedSave {
                Text("Your saved town is protected").font(.headline)
                Text("Open Settings to export the original, restore a backup, or import a compatible save. Play is paused.").font(.callout)
                Button("Open save recovery") { showSettings = true }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white)
            } else if let objective = store.snapshot?.objective {
                if !collapsed {
                    HStack {
                        Text("CHAPTER \(objective.chapter) · \(objective.chapterName.uppercased())").font(.caption2.weight(.bold)).tracking(0.8).lineLimit(1)
                        Spacer(minLength: 6)
                        Text("\(store.snapshot?.deliveries ?? 0) deliveries").font(.caption2).monospacedDigit()
                    }.foregroundStyle(HarbourTheme.muted)
                }
                HStack(spacing: 8) {
                    Button {
                        if store.pinnedTitle != nil { store.nextPinnedStep() } else if store.snapshot?.chronicle.started == true { store.navigate("Goals") } else { store.followGuidance() }; if !wide { showInspector = true }
                    } label: {
                        HStack { if !collapsed { Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: 44, height: 48).accessibilityHidden(true) }; VStack(alignment: .leading, spacing: 3) { if !collapsed { Text("NEXT STEP").font(.caption2.weight(.bold)).tracking(1) }; Text(store.pinnedTitle ?? (store.snapshot?.chronicle.started == true ? "Choose a harbour goal" : store.snapshot?.guidance.title ?? objective.title)).font(.system(collapsed ? .headline : .title3, design: .serif, weight: .semibold)).lineLimit(collapsed ? 1 : 2) }; Spacer(minLength: 8); Image(systemName: "arrow.right").font(.subheadline) }.frame(minHeight: 44).multilineTextAlignment(.leading)
                    }.accessibilityIdentifier("objective")
                    if !compact {
                        Button { withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) { expandedObjective.toggle() } } label: {
                            Image(systemName: expandedObjective ? "chevron.up" : "info").font(.subheadline.weight(.semibold)).frame(width: 44, height: 44).background(harbourInk.opacity(0.06), in: Circle())
                        }.accessibilityLabel(expandedObjective ? "Hide chapter guidance" : "Show chapter guidance").accessibilityIdentifier("objective-details")
                    }
                }
                if !compact && expandedObjective { Text("Elena · your harbour guide").font(.headline); Text(store.snapshot?.story.voice ?? "").font(.callout); Text(store.snapshot?.story.opening ?? "").font(.caption).foregroundStyle(HarbourTheme.muted); Text(store.snapshot?.guidance.body ?? objective.description).font(.callout).fixedSize(horizontal: false, vertical: true) }

            }
        }.padding(collapsed ? 6 : 15).frame(maxWidth: 540, alignment: .leading).foregroundStyle(harbourInk).background(harbourPaper.opacity(0.97), in: RoundedRectangle(cornerRadius: 18))
    }
    private func dock(wide: Bool) -> some View {
        HStack(spacing: 4) {
            ForEach([("Production", "leaf"), ("Trade", "shippingbox"), ("Build", "hammer")], id: \.0) { item in
                Button { store.navigate(item.0); if !wide { showInspector = true } } label: {
                    dockLabel(item.0, symbol: item.1, wide: wide, selected: store.category == item.0)
                }.accessibilityIdentifier("nav-" + item.0).accessibilityAddTraits(store.category == item.0 ? .isSelected : [])
            }
            Button { pendingCategory = nil; showTown = true } label: {
                dockLabel("Town", symbol: "square.grid.2x2", wide: wide, selected: !["Production", "Trade", "Build"].contains(store.category))
            }.accessibilityLabel("Town")
            Button { showSpeed = true } label: {
                dockLabel(store.snapshot?.speed == 3 ? "3×" : store.snapshot?.speed == 0 ? "Paused" : "1×", symbol: store.snapshot?.speed == 0 ? "pause.circle" : "play.circle", wide: wide)
            }.accessibilityLabel("Simulation speed").accessibilityValue(store.snapshot?.speed == 0 ? "Paused" : store.snapshot?.speed == 3 ? "Three times normal" : "Normal")
        }.buttonStyle(.plain).foregroundStyle(harbourInk).padding(.horizontal, 8).padding(.vertical, 2).background(harbourPaper).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private func dockLabel(_ title: String, symbol: String, wide: Bool, selected: Bool = false) -> some View {
        // One row in landscape preserves map height; portrait retains familiar stacked tabs.
        let layout = wide && !typeSize.isAccessibilitySize ? AnyLayout(HStackLayout(spacing: 6)) : AnyLayout(VStackLayout(spacing: 3))
        return layout {
            Image(systemName: symbol).font(.system(size: 18))
            Text(title).font(.caption.weight(selected ? .bold : .medium)).lineLimit(1)
        }.frame(maxWidth: .infinity, minHeight: wide ? 44 : 50)
            .background(selected ? HarbourTheme.sea.opacity(0.12) : .clear, in: RoundedRectangle(cornerRadius: 10))
            .contentShape(Rectangle())
    }
    private func category(for target: String?) -> String {
        ["produce":"Production", "trade":"Trade", "build":"Build", "contracts":"Contracts", "waterfront":"Waterfront", "market":"Market", "inland":"Inland", "fleet":"Fleet", "neighbourhood":"Neighbourhood", "residents":"Residents", "ferry":"Ferry"][target ?? ""] ?? "Production"
    }
}

private struct DensePanelsKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues { var densePanels: Bool { get { self[DensePanelsKey.self] } set { self[DensePanelsKey.self] = newValue } } }

struct InspectorView: View {
    var showCelebrations = true
    @Environment(\.densePanels) private var dense
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
                VStack(alignment: .leading, spacing: dense ? 10 : 18) {
                    Color.clear.frame(height: 0).id("panel-top")
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 5) {
                            if !dense { Label("YOUR TOWN", systemImage: HarbourTheme.symbol(store.category)).font(.caption2.weight(.bold)).tracking(1.8).foregroundStyle(HarbourTheme.muted) }
                            Text(store.category).font(.system(typeSize.isAccessibilitySize ? .headline : dense ? .title3 : .largeTitle, design: .serif, weight: .semibold))
                        }
                        Spacer()
                        Button { showActivityPicker = true } label: { Image(systemName: "line.3.horizontal.decrease").frame(width: 44, height: 44).background(harbourInk.opacity(0.06), in: Circle()) }.accessibilityLabel("Choose town activity")
                    }
                    if !dense && selected == nil && !store.guidanceFocus { Text(HarbourTheme.caption(store.category)).font(.subheadline).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
                    if let entity = selected, entity.kind != "boat" {
                        HStack(spacing: 8) {
                            Image(uiImage: HarbourArtwork.image(store.snapshot?.artwork(for: entity) ?? entity.texture)).resizable().scaledToFit().frame(width: dense ? 52 : 98, height: dense ? 52 : 98).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(entity.displayLabel).font(.system(dense ? .headline : .title3, design: .serif, weight: .semibold))
                                Label(entity.stage == "unbuilt" ? "A place for something new" : entity.stage == "building" ? "Construction underway" : "Level \(entity.level) · \(entity.ripe == true ? "Ready to harvest" : "Established")", systemImage: entity.stage == "building" ? "hammer" : entity.stage == "unbuilt" ? "plus.circle" : "checkmark.seal").font(.caption)
                            }
                            Spacer(minLength: 0)
                            Button { store.selectedSite = nil } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }.accessibilityLabel("Clear selected site")
                        }.harbourCard()
                    }
                    if let s = store.snapshot {
                        if let title = store.pinnedTitle, store.category != "Goals" {
                            HStack(alignment: .center, spacing: 8) {
                                Button { store.navigate("Goals") } label: { Label(title, systemImage: "pin.fill").font(.caption.bold()).multilineTextAlignment(.leading).frame(minHeight: 44) }.accessibilityIdentifier("pinned-goal")
                                Spacer(minLength: 0)
                                Button("Next step") { store.nextPinnedStep() }.font(.caption.bold()).frame(minHeight: 44).accessibilityIdentifier("pinned-next-step")
                            }.padding(.horizontal, 10).background(HarbourTheme.sea.opacity(0.09), in: RoundedRectangle(cornerRadius: 12))
                        }
                        if !["Ambitions", "Festival", "Goals"].contains(store.category) && (store.pinnedTitle == nil || store.guidanceFocus) && (!dense || store.guidanceFocus) { guidanceCard(s) }
                        if let direction = s.directions.first(where: { $0.id == store.directionFocus }) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(direction.title).font(.caption.bold()).foregroundStyle(HarbourTheme.muted)
                                Text(direction.goal).font(.headline)
                                ProgressView(value: Double(direction.progress), total: Double(max(1, direction.total)))
                                Text(direction.body).font(.caption)
                                Button("All ambitions") { store.navigate("Ambitions") }.font(.caption).frame(minHeight: 44)
                            }.padding(12).background(HarbourTheme.sea.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
                        }
                        if store.category == "Journal" { journal(s) }
                        else if store.category == "Goals" { GoalsPanel() }
                        else if store.category == "Ambitions" { DirectionsPanel() }
                        else if store.category == "Festival" { FestivalPanel() }
                        else if store.category == "Market" { MarketPanel() }
                        else if store.category == "Refits" { WorkshopRefitPanel() }
                        else if store.category == "Production" && !store.guidanceFocus && store.directionFocus == nil { ProductionPanel(site: selected) }
                        else if store.category == "Build" && !store.guidanceFocus && store.directionFocus == nil { ConstructionPanel() }
                        else if ["Fleet", "Circuits", "Ferry"].contains(store.category) { FleetPanel() }
                        else {
                            if store.category == "Queues" { DisclosureGroup("Work in progress · \(s.jobs.count) batches") { jobs(s) } }
                            else if store.category == "Production" && s.guidance.waiting { jobs(s) }
                            if selected == nil && !store.guidanceFocus { stock(s) }
                            if !store.guidanceFocus && store.directionFocus == nil { HStack {
                                Image(systemName: "magnifyingglass").foregroundStyle(HarbourTheme.muted)
                                TextField("Find an action or resource", text: $query).focused($searchFocused).accessibilityLabel("Search actions").autocorrectionDisabled().submitLabel(.done).onSubmit { searchFocused = false }
                                if !query.isEmpty { Button { query = ""; searchFocused = false } label: { Image(systemName: "xmark.circle.fill").font(.system(size: 22)).frame(width: 44, height: 44) }.accessibilityLabel("Clear search") }
                            }.padding(.horizontal, 12).frame(minHeight: 46).background(HarbourTheme.surface.opacity(0.94), in: RoundedRectangle(cornerRadius: 13)) }
                            let categoryActions = s.actions.filter { $0.category == store.category && (!store.guidanceFocus || s.guidance.choices.contains($0.id)) && (store.directionFocus == nil || (s.directions.first { $0.id == store.directionFocus }?.choices.contains($0.id) ?? false)) }
                            let relevant = categoryActions.filter { $0.belongs(to: selected) }
                            if selected != nil && !relevant.isEmpty && store.directionFocus == nil {
                                Toggle("Only this site", isOn: $siteOnly).font(.subheadline).accessibilityIdentifier("site-filter")
                            }
                            if !store.guidanceFocus && store.directionFocus == nil { Picker("Action availability", selection: $readyOnly) {
                                Text("All actions").tag(false)
                                Text("Ready now").tag(true)
                            }.pickerStyle(.segmented).accessibilityIdentifier("action-filter") }
                            let actions = (selected != nil && siteOnly && !relevant.isEmpty ? relevant : categoryActions).filter { (!readyOnly || $0.enabled) && (query.isEmpty || ($0.title + " " + $0.detail + " " + $0.reason).localizedCaseInsensitiveContains(query)) }
                            HStack {
                                Text(store.guidanceFocus ? "YOUR NEXT ACTION" : readyOnly ? "READY TO GO" : "MAKE YOUR NEXT MOVE").font(.caption2.weight(.bold)).tracking(1.2)
                                Spacer(); Text("\(actions.count)").font(.caption.monospacedDigit())
                            }.foregroundStyle(HarbourTheme.muted)
                            LazyVStack(spacing: 12) { ForEach(actions) { action in VStack(spacing: 8) { actionCard(action); if action.invocation?.0 == "start", let recipe = action.invocation?.1.first as? String { WorkshopAutomation(recipe: recipe); if let workshop = s.workshops[recipe], s.actions.contains(where: { $0.invocation?.0 == "installAdvancedRefit" && $0.invocation?.1.first as? String == workshop.station }) { DisclosureGroup("Improve this workshop") { WorkshopRefitPanel(fixedStation: workshop.station) }.harbourCard() } } } } }
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
                }.padding(dense ? 10 : 20)
            }.scrollDismissesKeyboard(.interactively).background(harbourPaper).foregroundStyle(harbourInk)
            .onChange(of: store.guidanceFocus) { _, _ in searchFocused = false; query = ""; readyOnly = false; siteOnly = true; reader.scrollTo("panel-top", anchor: .top) }
            .onChange(of: store.category) { _, _ in searchFocused = false; query = ""; readyOnly = false; siteOnly = true; reader.scrollTo("panel-top", anchor: .top) }
            .onChange(of: store.selectedSite) { _, _ in searchFocused = false; siteOnly = true; readyOnly = false; reader.scrollTo("panel-top", anchor: .top) }
        }
        .accessibilityHidden(showCelebrations && store.chapterCelebration != nil)
        .overlay(alignment: .bottom) { FeedbackBanner() }
        .confirmationDialog("Confirm this investment", isPresented: Binding(get: { pendingAction != nil }, set: { if !$0 { pendingAction = nil } }), titleVisibility: .visible) {
            if let action = pendingAction { Button(action.title, role: .destructive) { store.perform(action); pendingAction = nil } }
            Button("Cancel", role: .cancel) { pendingAction = nil }
        } message: { if let action = pendingAction { Text(action.detail.isEmpty ? "Completed deliveries and spent materials are not refunded. Review the stated refund before continuing." : action.detail + ". This replaces the current setup without a refund.") } }
        .sheet(isPresented: $showActivityPicker) { TownDirectoryView { category in store.navigate(category); showActivityPicker = false } }
        .sheet(item: Binding(get: { projectGoal.map(GoalSelection.init) }, set: { projectGoal = $0?.id })) { goal in ProjectView(goal: goal.id) }
        .overlay { if showCelebrations, let memory = store.chapterCelebration { ChapterMoment(memory: memory) } }
    }
    private func guidanceCard(_ s: HarbourSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if store.guidanceFocus { HStack(alignment: .top, spacing: 12) {
                Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: dense ? 32 : 58, height: dense ? 36 : 64).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(dense ? "ELENA" : "ELENA · YOUR HARBOUR GUIDE").font(.caption2.weight(.bold)).tracking(0.6).foregroundStyle(HarbourTheme.muted)
                    Text(s.guidance.title).font(.system(.headline, design: .serif)).accessibilityIdentifier("next-step-title")
                }
            }
                Text("GOAL · " + (s.guidance.goalTitle ?? s.objective.title)).font(.caption.bold()).accessibilityIdentifier("guidance-goal")
                Text(s.story.voice).font(dense ? .caption : .subheadline).italic().fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("elena-voice")
                Text(s.guidance.body).font(dense ? .caption : .subheadline).fixedSize(horizontal: false, vertical: true)
                Group { Text("Chapter \(s.objective.chapter) · \(s.objective.title)").font(.caption).foregroundStyle(HarbourTheme.muted)
                if !s.guidance.requirements.isEmpty {
                    Text("SUPPLIES FOR THE GOAL").font(.caption2.weight(.bold)).foregroundStyle(HarbourTheme.muted)
                    ForEach(s.guidance.requirements) { r in
                        HStack { ResourceIcon(item: r.item, size: 24); Text(goodsNames[r.item] ?? "Coins"); Spacer(); Text("\(r.available) / \(r.required)").monospacedDigit(); Image(systemName: r.available >= r.required ? "checkmark.circle.fill" : "circle").foregroundStyle(r.available >= r.required ? HarbourTheme.sea : HarbourTheme.muted) }.font(.caption)
                    }
                }
                }
                if s.speed == 0 { Button("Resume town · 1×") { store.speed(1) }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).accessibilityIdentifier("guidance-resume") }
                else if s.guidance.waiting && !dense { Label("Work takes game time. Your next step updates automatically.", systemImage: "clock").font(.caption).foregroundStyle(HarbourTheme.muted) }
                HStack { Button("Browse all \(store.category.lowercased())") { store.guidanceFocus = false }; Spacer(); Button("Other goals") { store.navigate("Goals") }.accessibilityIdentifier("other-goals") }.font(.caption).frame(minHeight: 44)
            } else {
                Button { store.followGuidance() } label: { HStack { Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: 36, height: 40).accessibilityHidden(true); VStack(alignment: .leading) { Text("Ask Elena").font(.caption).foregroundStyle(HarbourTheme.muted); Text("Show my next step") }; Spacer(); Image(systemName: "arrow.right") }.frame(minHeight: 44) }.accessibilityIdentifier("show-next-step")
            }
        }.padding(dense ? 10 : 14).background(HarbourTheme.gold.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))
    }
    private func stock(_ s: HarbourSnapshot) -> some View {
        let staples = ["wheat", "flour", "bread"]
        let goods = staples.filter { s.stock[$0] != nil } + s.stock.keys.filter { !staples.contains($0) }.sorted()
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
                if !allSupplies && !typeSize.isAccessibilitySize && dense {
                    HStack(spacing: 12) {
                        ForEach(Array(goods.prefix(3)), id: \.self) { item in
                            HStack(spacing: 4) { Text(goodsNames[item] ?? item); Text("\(s.stock[item] ?? 0)").monospacedDigit().accessibilityIdentifier("stock-count-" + item) }.font(.caption)
                        }
                    }
                }
                if !allSupplies && !typeSize.isAccessibilitySize && !dense {
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
        }.frame(maxWidth: .infinity, alignment: .leading).padding(9).background(HarbourTheme.surface.opacity(0.9), in: RoundedRectangle(cornerRadius: 10))
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
    private func actionCard(_ action: HarbourAction) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if let partner = action.partner { Text(partner).font(.caption).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: HarbourTheme.symbol(action.category)).font(.system(size: 20)).foregroundStyle(action.enabled ? HarbourTheme.sea : HarbourTheme.muted).frame(width: 34, height: 34).background(harbourInk.opacity(0.05), in: RoundedRectangle(cornerRadius: 10)).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 7) {
                    Text(action.title).font(.system(.body, design: .rounded, weight: .semibold)).fixedSize(horizontal: false, vertical: true)
                    if !action.detail.isEmpty { Text(action.detail).font(.subheadline).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true) }
                }
            }
            StableActionStatus(action: action)
            Button { if action.destructive { pendingAction = action } else { store.perform(action) } } label: {
                HStack {
                    Text(action.verb).fixedSize(horizontal: false, vertical: true)
                    Spacer()
                    Image(systemName: action.enabled ? "arrow.right" : "lock").font(.system(size: 18, weight: .semibold))
                }.font(.subheadline.weight(.semibold)).padding(.horizontal, 13).frame(minHeight: 46)
                    .background(action.enabled ? HarbourTheme.action : harbourInk.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(action.enabled ? .white : HarbourTheme.muted)
            }.buttonStyle(.plain).disabled(!action.enabled || store.protectedSave)
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
            Text("Memories of \(s.story.townName)").font(.system(.title2, design: .serif))
            Text("Our milestones and choices. Some memories are undated; seasonal decisions are gathered below.").font(.caption).foregroundStyle(HarbourTheme.muted)
            if s.story.memories.isEmpty { Text("Our story starts with this harvest. Completed chapters will appear here.").font(.subheadline) }
            ForEach(s.story.memories) { memory in MemoryCard(memory: memory) }
            if s.festival.stage == 4 { Button("Visit the festival") { store.navigate("Festival") }.frame(minHeight: 44) }
            if !s.story.decisions.isEmpty {
                DisclosureGroup("Saved decisions · \(s.story.decisions.count)") {
                    ForEach(s.story.decisions) { memory in MemoryCard(memory: memory) }
                }.font(.headline)
            }
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
                                    Text(r.available >= r.required ? "Ready in the storehouse" : r.missing == 0 ? "Remaining supplies in production" : "\(r.missing) still needed")
                                    Spacer()
                                    if let held = r.reserved, held > 0 { Label("\(held) held", systemImage: "archivebox") }
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
                        if plan.blockers.contains(where: { $0.kind == "locked" }) {
                            Button("Open building plans") { store.navigate("Build"); dismiss() }.frame(minHeight: 44)
                        }
                        Button { store.queuePlan(goal) } label: { Label("Queue available production", systemImage: "play.fill").frame(maxWidth: .infinity, minHeight: 44) }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).disabled(store.protectedSave || !plan.recipes.contains { $0.queueable > 0 })
                        Button { store.reserve(goal) } label: { Label("Reserve available supplies", systemImage: "archivebox").frame(maxWidth: .infinity, minHeight: 44) }.buttonStyle(.bordered).disabled(store.protectedSave)
                        Text("Reservations keep these supplies aside for this project. Finish the ingredients before starting later steps. Time pauses when you leave the app.").font(.footnote).foregroundStyle(HarbourTheme.muted)
                    }.padding(20)
                }
            }.background(HarbourTheme.paper).foregroundStyle(HarbourTheme.ink).tint(HarbourTheme.sea)
            .navigationTitle("Plan supplies").navigationBarTitleDisplayMode(.inline).toolbar { Button("Done") { dismiss() } }
            .overlay(alignment: .bottom) { FeedbackBanner() }
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
            }.padding(12).foregroundStyle(.white).background(HarbourTheme.action).accessibilityElement(children: .contain)
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
