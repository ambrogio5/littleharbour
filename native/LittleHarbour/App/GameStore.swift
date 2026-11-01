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
    @Published var modalOpen = false
    @Published var active = true
    @Published var lastSaved: Date?
    let saves: SaveRepository
    private var engine: EngineRuntime?
    private var lastTick = ProcessInfo.processInfo.systemUptime
    private var checkpoint = 0.0
    private var refreshClock = 0.0
    private var feedbackUntil = 0.0
    init() {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        // UI tests can choose a separate disposable town, never a player's save.
        let arguments = ProcessInfo.processInfo.arguments
        let testing = arguments.contains("--ui-testing") || arguments.contains("--persistence-testing")
        saves = SaveRepository(directory: base.appendingPathComponent(testing ? "LittleHarbour-UITests" : "LittleHarbour", isDirectory: true))
        do {
            let runtime = try EngineRuntime(); engine = runtime
            if arguments.contains("--ui-testing") {
                if let fixture = ProcessInfo.processInfo.environment["LH_TEST_TOWN"] { try runtime.load(Data(fixture.utf8)) }
                else { try runtime.call("reset", [false]) }
            }
            else if arguments.contains("--persistence-testing") && arguments.contains("--reset-test-town") {
                _ = try saves.read(); try runtime.call("reset", [false]); try saves.replace(runtime.save())
            }
            else if let data = try saves.read() { try runtime.load(data) }
            try refresh(); flush()
        } catch { saves.protect(); protectedSave = true; message = error.localizedDescription }
    }
    func refresh() throws { snapshot = try engine?.snapshot() }
    func pulse() {
        let now = ProcessInfo.processInfo.systemUptime, dt = min(0.5, max(0, now - lastTick)); lastTick = now
        if feedbackUntil > 0 && now >= feedbackUntil && !protectedSave { message = nil; feedbackUntil = 0 }
        guard active, !modalOpen, !protectedSave, let engine else { return }
        do {
            try engine.call("tick", [dt]); checkpoint += dt; refreshClock += dt
            if refreshClock >= 0.5 { try refresh(); refreshClock = 0 }
            if checkpoint >= 15 { flush(); checkpoint = 0 }
        } catch { freeze(error) }
    }
    func lifecycle(_ active: Bool) { self.active = active; lastTick = ProcessInfo.processInfo.systemUptime; if !active { flush() } }
    func flush() {
        guard !protectedSave, !ProcessInfo.processInfo.arguments.contains("--ui-testing"), let engine else { return }
        do { try saves.write(engine.save()); lastSaved = Date() } catch { freeze(error) }
    }
    private func freeze(_ error: Error) { protectedSave = true; saves.protect(); message = error.localizedDescription }
    func perform(_ action: HarbourAction) {
        guard !protectedSave, let engine else { return }
        do {
            guard try engine.call("act", [action.id]).toBool() else { message = "This action has changed. Review its current requirements."; return }
            try refresh(); flush()
            if !protectedSave {
                message = snapshot?.log.first ?? "Done. Your town is saved."
                feedbackUntil = ProcessInfo.processInfo.systemUptime + 4
                if UserDefaults.standard.object(forKey: "hapticFeedback") as? Bool ?? true { UINotificationFeedbackGenerator().notificationOccurred(.success) }
            }
            if UIAccessibility.isVoiceOverRunning { UIAccessibility.post(notification: .announcement, argument: snapshot?.log.first) }
        } catch { freeze(error) }
    }
    func speed(_ speed: Int) { guard !protectedSave else { return }; do { try engine?.call("speed", [speed]); try refresh(); flush() } catch { freeze(error) } }
    func resolve(_ option: String) { guard !protectedSave else { return }; do { try engine?.call("resolve", [option]); try refresh(); flush() } catch { freeze(error) } }
    func reserve(_ goal: String) { guard !protectedSave else { return }; do { let ok = try engine?.call("reserve", [goal]).toBool() ?? false; message = ok ? "Available supplies reserved for this project." : "No available supplies to reserve."; try refresh(); flush() } catch { freeze(error) } }
    func plan(_ goal: String) -> ProjectPlan? { do { return try engine?.plan(goal) } catch { message = error.localizedDescription; return nil } }
    func queuePlan(_ goal: String) { guard !protectedSave else { return }; do { let count = try engine?.call("queuePlan", [goal]).toInt32() ?? 0; message = "\(count) batches queued. Finished ingredients are required before later steps can run."; try refresh(); flush() } catch { freeze(error) } }
    func previewImport(_ data: Data) {
        do {
            let candidate = try EngineRuntime(); try candidate.load(data); let town = try candidate.snapshot()
            pendingImport = try candidate.save()
            importSummary = "\(town.coins) coins · \(town.deliveries) deliveries · chapter \(town.objective.chapter). Your current save will be backed up before replacement."
        } catch { message = error.localizedDescription }
    }
    func confirmImport() {
        guard let data = pendingImport, let engine else { return }
        do {
            try saves.replace(data); try engine.load(data); protectedSave = false; pendingImport = nil
            try refresh(); lastSaved = Date(); message = "Town imported. Your previous save is kept in Backups."
        } catch { freeze(error) }
    }
    func export(original: Bool = false, browser: Bool = false) throws -> URL {
        let data: Data
        if original || protectedSave { data = try saves.original() }
        else if let engine { data = try engine.save(browser: browser) }
        else { throw HarbourError.message("No town is available to export.") }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(original || protectedSave ? "Little-Harbour-original.json" : browser ? "Little-Harbour-browser.json" : "Little-Harbour-native.json")
        try data.write(to: url, options: .atomic); return url
    }
    func navigate(_ category: String) { selectedSite = nil; self.category = category }
    func select(_ entity: WorldEntity) { selectedSite = entity.id; category = entity.category }
}
