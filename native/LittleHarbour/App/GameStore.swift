import SwiftUI
import Combine

@MainActor final class GameStore: ObservableObject {
    @Published private(set) var snapshot: HarbourSnapshot?
    @Published var message: String? { didSet { feedbackUntil = 0 } }
    @Published var protectedSave = false
    @Published var pendingImport: Data?
    @Published var importSummary = ""
    @Published var category = "Production"
    @Published var selectedSite: String?
    @Published var guidanceFocus = false
    @Published var selectedBerth = 0
    @Published var preferredFleetMission: String?
    @Published var preferredFleetRoute: String?
    @Published var preferredGoalSection: String?
    @Published var directionFocus: String?
    @Published private(set) var chapterCelebration: StoryMemory?
    private var knownChapters: Set<String>?
    @Published private(set) var lastPerformedActionID: String?
    private var lastActionAt = -Double.infinity
    private let actionClock: () -> Double
    private let inMemoryUITest: Bool
    @Published var modalOpen = false
    @Published var active = true
    @Published var lastSaved: Date?
    private(set) var saves: SaveRepository
    private var library: TownLibrary?
    var coastSlots: [TownLibrary.Slot] { library?.slots ?? [] }
    var activeCoastID: String { library?.active ?? "original" }
    var coastMemories: [ChronicleState.Memory] { library?.album() ?? [] }
    private var engine: EngineRuntime?
    private var lastTick = ProcessInfo.processInfo.systemUptime
    private var checkpoint = 0.0
    private var refreshClock = 0.0
    private var feedbackUntil = 0.0
    init(repository: SaveRepository? = nil, library: TownLibrary? = nil, arguments: [String] = ProcessInfo.processInfo.arguments, environment: [String: String] = ProcessInfo.processInfo.environment, actionClock: @escaping () -> Double = { ProcessInfo.processInfo.systemUptime }) {
        self.actionClock = actionClock
        let libraryTestID = arguments.contains("--ui-testing") && arguments.contains("--coast-library-testing") ? environment["LH_TEST_LIBRARY"].flatMap(UUID.init(uuidString:)) : nil
        inMemoryUITest = arguments.contains("--ui-testing") && libraryTestID == nil
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        // UI tests can choose a separate disposable town, never a player's save.
        let testing = arguments.contains("--ui-testing") || arguments.contains("--persistence-testing")
        saves = repository ?? SaveRepository(directory: base.appendingPathComponent(testing ? "LittleHarbour-UITests" : "LittleHarbour", isDirectory: true))
        self.library = library
        do {
            if let libraryTestID { self.library = try TownLibrary(root: base.appendingPathComponent("LittleHarbour-UITests/CoastLibrary/" + libraryTestID.uuidString, isDirectory: true)) }
            if !testing && repository == nil && self.library == nil { self.library = try TownLibrary(root: base.appendingPathComponent("LittleHarbour", isDirectory: true)) }
            if let library = self.library { saves = try library.repository(for: library.active) }
            let runtime = try EngineRuntime(); engine = runtime
            if arguments.contains("--ui-testing") {
                if libraryTestID != nil, let data = try saves.read() { try runtime.load(data) }
                else if let fixture = environment["LH_TEST_TOWN"] { try runtime.load(Data(fixture.utf8)) }
                else { try runtime.call("reset", [false]) }
            }
            else if arguments.contains("--persistence-testing") && arguments.contains("--reset-test-town") {
                _ = try saves.read(); try runtime.call("reset", [false]); try saves.replace(runtime.save())
            }
            else if let data = try saves.read() { try runtime.load(data) }
            try refresh(); flush()
        } catch { saves.protect(); protectedSave = true; message = error.localizedDescription }
    }
    func refresh() throws {
        snapshot = try engine?.snapshot()
        let completed = snapshot?.story.memories.filter { $0.chapter != nil } ?? []
        if let knownChapters, let newest = completed.first(where: { !knownChapters.contains($0.id) }) {
            chapterCelebration = newest
        }
        knownChapters = (knownChapters ?? []).union(completed.map(\.id))
        // Refresh status only. Navigation belongs to deliberate player actions.
    }
    func dismissCelebration() { chapterCelebration = nil }
    func pulse() {
        if lastPerformedActionID != nil && actionClock() - lastActionAt >= 0.65 { lastPerformedActionID = nil }
        let now = ProcessInfo.processInfo.systemUptime, dt = min(0.5, max(0, now - lastTick)); lastTick = now
        if feedbackUntil > 0 && now >= feedbackUntil && !protectedSave { message = nil; feedbackUntil = 0 }
        guard active, !modalOpen, !protectedSave, snapshot?.speed != 0, let engine else { return }
        do {
            try engine.call("tick", [dt]); checkpoint += dt; refreshClock += dt
            if refreshClock >= 0.5 { try refresh(); refreshClock = 0 }
            if checkpoint >= 15 { flush(); checkpoint = 0 }
        } catch { freeze(error) }
    }
    func lifecycle(_ active: Bool) { self.active = active; lastTick = ProcessInfo.processInfo.systemUptime; if !active { flush() } }
    func flush() {
        guard !protectedSave, !inMemoryUITest, let engine else { return }
        do { try saves.write(engine.save()); lastSaved = Date() } catch { freeze(error) }
    }
    private func freeze(_ error: Error) { protectedSave = true; saves.protect(); message = error.localizedDescription }
    func perform(_ action: HarbourAction) {
        guard !protectedSave, let engine else { return }
        let now = actionClock()
        // A guidance refresh can put a different action beneath the same finger.
        guard now - lastActionAt >= 0.65 else { return }
        guard let current = snapshot?.actions.first(where: { $0.id == action.id }), current.enabled, current.title == action.title else { return }
        do {
            guard try engine.call("act", [action.id]).toBool() else { message = "This action has changed. Review its current requirements."; return }
            lastActionAt = now; lastPerformedActionID = action.id
            try refresh(); flush()
            if !protectedSave {
                message = snapshot?.log.first ?? "Done. Your town is saved."
                feedbackUntil = ProcessInfo.processInfo.systemUptime + 4
                if UserDefaults.standard.object(forKey: "hapticFeedback") as? Bool ?? true { UINotificationFeedbackGenerator().notificationOccurred(.success) }
            }
            if UIAccessibility.isVoiceOverRunning { UIAccessibility.post(notification: .announcement, argument: snapshot?.log.first) }
        } catch { freeze(error) }
    }
    func assignCrew(_ team: Int, to target: String?, epoch: Int) {
        guard !protectedSave, let engine else { return }
        let now = actionClock()
        guard now - lastActionAt >= 0.65 else { return }
        do {
            guard try engine.call("assignCrew", [team, target as Any? ?? NSNull(), epoch]).toBool() else {
                message = "The team or workplace changed. Finish its work and review the assignment."; return
            }
            lastActionAt = now
            try refresh(); flush()
            if !protectedSave { message = snapshot?.log.first; feedbackUntil = ProcessInfo.processInfo.systemUptime + 4 }
        } catch { freeze(error) }
    }
    func openCrewWorkplace(_ target: String) {
        if target.hasPrefix("boat:"), let slot = Int(target.dropFirst(5)) { navigate("Fleet"); selectedBerth = slot }
        else if target == "bench" { navigate("Goals"); preferredGoalSection = "Projects" }
        else {
            let station = String(target.dropFirst(8)); navigate("Production")
            selectedSite = snapshot?.entities.first { $0.select == station || $0.id == station }?.id
        }
    }
    func setStockTargets(_ recipes: [String], target: Int) {
        guard !protectedSave, let engine else { return }
        do {
            guard try engine.call("setTargets", [recipes, target]).toBool() else { message = "Stock targets need an extended quay and unlocked workshops."; return }
            try refresh(); flush()
            if !protectedSave {
                message = target == 0 ? "Automatic production stopped for \(recipes.count) recipes." : "\(recipes.count) recipes now keep \(target) in stock."
                feedbackUntil = ProcessInfo.processInfo.systemUptime + 4
            }
        } catch { freeze(error) }
    }
    func speed(_ speed: Int) { guard !protectedSave else { return }; do { try engine?.call("speed", [speed]); try refresh(); flush() } catch { freeze(error) } }
    func resolve(_ option: String) { guard !protectedSave else { return }; do { try engine?.call("resolve", [option]); try refresh(); flush() } catch { freeze(error) } }
    func reserve(_ goal: String) { guard !protectedSave else { return }; do { let ok = try engine?.call("reserve", [goal]).toBool() ?? false; message = ok ? "Available supplies reserved for this project." : "No available supplies to reserve."; try refresh(); flush() } catch { freeze(error) } }
    func plan(_ goal: String) -> ProjectPlan? { do { return try engine?.plan(goal) } catch { message = error.localizedDescription; return nil } }
    func queuePlan(_ goal: String) { guard !protectedSave else { return }; do { let count = try engine?.call("queuePlan", [goal]).toInt32() ?? 0; message = "\(count) batches queued. Finished ingredients are required before later steps can run."; try refresh(); flush() } catch { freeze(error) } }
    func previewImport(_ data: Data) {
        cancelImport()
        do {
            let candidate = try EngineRuntime(); try candidate.load(data); let town = try candidate.snapshot()
            pendingImport = try candidate.save()
            importSummary = "\(town.coins) coins · \(town.deliveries) deliveries · chapter \(town.objective.chapter). Your current save will be backed up before replacement."
        } catch { message = error.localizedDescription }
    }
    func cancelImport() {
        if pendingImport != nil { pendingImport = nil }
        if !importSummary.isEmpty { importSummary = "" }
    }
    func previewNewTown() {
        cancelImport()
        do {
            let candidate = try EngineRuntime(); try candidate.call("reset", [false])
            pendingImport = try candidate.save()
            importSummary = "Start at the original harbour with a wheat field, mill and bakery. Your current town will be kept as an exact recovery backup."
        } catch { message = error.localizedDescription }
    }
    func confirmImport() {
        guard let data = pendingImport, let engine else { return }
        do {
            try saves.replace(data); try engine.load(data); protectedSave = false; cancelImport(); selectedSite = nil; guidanceFocus = false; directionFocus = nil; category = "Production"
            knownChapters = nil; chapterCelebration = nil
            try refresh(); lastSaved = Date(); message = "Town ready. Your previous save is kept in Recovery backups."
        } catch { freeze(error) }
    }
    func export(original: Bool = false, browser: Bool = false, legacy: Bool = false) throws -> URL {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let url = folder.appendingPathComponent(original || protectedSave ? "Little-Harbour-original.json" : legacy ? "Little-Harbour-browser-legacy.json" : browser ? "Little-Harbour-browser.json" : "Little-Harbour-native.json")
        if original || protectedSave { try saves.exportOriginal(to: url); return url }
        let data: Data
        if let engine { data = try engine.save(browser: browser, legacy: legacy) }
        else { throw HarbourError.message("No town is available to export.") }
        try data.write(to: url, options: .atomic); return url
    }
    func updateIdentity(name: String, awning: String) {
        guard !protectedSave else { return }
        do { try engine?.call("identity", [name, awning]); try refresh(); flush() } catch { message = error.localizedDescription }
    }
    func createCoast(name: String, coast: String) {
        guard !protectedSave, let library else { return }
        do {
            let candidate = try EngineRuntime(); guard try candidate.call("newCoast", [coast, name]).toBool() else { return }
            let slot = try library.add(name: name, coast: coast, data: candidate.save())
            switchCoast(slot.id)
        } catch { message = error.localizedDescription }
    }
    func switchCoast(_ id: String) {
        guard !protectedSave, let library, id != library.active else { return }
        do {
            flush(); guard !protectedSave else { return }
            let repository = try library.repository(for: id)
            guard let data = try repository.read() else { throw HarbourError.message("This coast’s save is missing. The current town is unchanged.") }
            let candidate = try EngineRuntime(); try candidate.load(data)
            _ = try candidate.snapshot(); try library.select(id)
            engine = candidate; saves = repository; knownChapters = nil; chapterCelebration = nil
            navigate("Goals"); try refresh(); lastTick = ProcessInfo.processInfo.systemUptime; checkpoint = 0
            message = "Coast opened. Each town has its own clock and recovery backups."
        } catch { message = error.localizedDescription }
    }
    var pinnedTitle: String? {
        guard let pin = snapshot?.chronicle.pin, let s = snapshot else { return nil }
        if pin == "guide" { return s.guidance.title }
        if pin == "festival" { return s.festival.title }
        if let d = s.directions.first(where: { "direction:" + $0.id == pin }) { return d.title }
        if let o = s.chronicle.offers.first(where: { $0.goal == pin }) { return o.title }
        if let p = s.chronicle.projects.first(where: { "chronicle:" + $0.id == pin }) { return p.stage == 4 ? p.title + " · completed" : p.title }
        return "Choose your next goal"
    }
    func pin(_ goal: String?) {
        guard !protectedSave else { return }
        do { try engine?.call("pin", [goal as Any? ?? NSNull()]); try refresh(); flush() } catch { freeze(error) }
    }
    func nextPinnedStep() {
        guard let s = snapshot, let pin = s.chronicle.pin else { navigate("Goals"); return }
        if pin == "guide" { followGuidance(); return }
        if pin == "festival" { navigate("Festival"); return }
        if let d = s.directions.first(where: { "direction:" + $0.id == pin }) { followDirection(d); return }
        let request = s.chronicle.offers.first { $0.goal == pin }
        let project = s.chronicle.projects.first { "chronicle:" + $0.id == pin }
        if let project, project.stage == 2, let mission = project.missions.first(where: { !$0.complete }) ?? project.missions.first {
            chooseProjectBoat(project, mission: mission); return
        }
        if request?.kind == 1 {
            selectedBerth = s.boats.indices.first { s.boats[$0] != nil && s.boats[$0]?.trip == nil } ?? selectedBerth
            navigate(request != nil ? "Ferry" : "Fleet"); return
        }
        if let goal = request?.goal ?? project?.goal, let p = plan(goal), !p.ready,
           let recipe = p.recipes.first(where: { $0.queueable > 0 }) ?? p.recipes.first {
            navigate("Production")
            selectedSite = s.entities.first { $0.select == recipe.station || $0.id == recipe.station }?.id
        } else { navigate("Goals") }
    }
    func followDirection(_ direction: TownDirection) {
        navigate(direction.category); directionFocus = direction.id
        if let site = direction.siteID { selectedSite = site }
    }
    func navigate(_ category: String) { directionFocus = nil; guidanceFocus = false; selectedSite = nil; preferredFleetMission = nil; preferredFleetRoute = nil; preferredGoalSection = nil; self.category = category }
    func chooseCityBoat() { navigate("Fleet"); preferredFleetMission = "City" }
    func chooseProjectBoat(_ project: ChronicleState.Project, mission: ChronicleState.Project.Mission) {
        pin("chronicle:" + project.id)
        if let boats = snapshot?.boats {
            selectedBerth = boats.indices.first { boats[$0] != nil && boats[$0]?.trip == nil && !project.usedBoats.contains($0) } ?? selectedBerth
        }
        navigate(mission.passengers ? "Ferry" : "Fleet")
        preferredFleetRoute = mission.route
        preferredFleetMission = mission.passengers ? "Passengers" : "Cargo"
    }
    func followGuidance() { directionFocus = nil; preferredFleetMission = nil; preferredFleetRoute = nil; guard let next = snapshot?.guidance else { return }; selectedSite = nil; category = next.category; guidanceFocus = true }
    func select(_ entity: WorldEntity) { directionFocus = nil; preferredFleetMission = nil; preferredFleetRoute = nil; if entity.kind == "boat", let slot = Int(entity.id.dropFirst(4)) { selectedBerth = slot }; guidanceFocus = false; selectedSite = entity.id; category = entity.category }
}
