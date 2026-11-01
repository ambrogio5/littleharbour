import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("mapLabels") private var mapLabels = true
    @AppStorage("hapticFeedback") private var hapticFeedback = true
    @State private var showImporter = false
    @State private var exportURL: URL?
    @State private var backups: [URL] = []
    var body: some View {
        NavigationStack {
            List {
                Section("Your town") {
                    Text(store.protectedSave ? "Save protected · play paused" : "Saved on this device")
                    if let date = store.lastSaved { Text("Last saved \(date.formatted(date: .omitted, time: .shortened))").font(.caption) }
                    Text("Time pauses outside the app. There are no real-time deadlines or offline penalties. Autosaves run every 15 seconds and after actions.").font(.footnote)
                    Button("Export native town & evolution") { prepareExport() }
                    Button("Export for browser game") { prepareExport(browser: true) }.disabled(store.protectedSave)
                    if store.protectedSave { Button("Export exact original bytes") { prepareExport(original: true) } }
                    if let exportURL { ShareLink("Share exported save", item: exportURL).accessibilityIdentifier("share-save") }
                    Button("Import a town…") { showImporter = true }
                }
                Section("Make yourself at home") {
                    Toggle("Building labels", isOn: $mapLabels)
                    Toggle("Gentle haptic feedback", isOn: $hapticFeedback)
                    Text("The map respects Reduce Motion. Text follows your device’s text size. Explore and Sites offer alternatives to map gestures.").font(.footnote)
                }
                Section("Recovery backups") {
                    Text("Every imported replacement and the first save after loading preserve an exact copy of the original. Backups stay on this device. Export copies for safekeeping.").font(.footnote)
                    if backups.isEmpty { Text("No device backups yet.").foregroundStyle(.secondary) }
                    ForEach(Array(backups.enumerated()), id: \.element) { index, url in
                        VStack(alignment: .leading) {
                            Text("Backup \(index+1)").font(.headline)
                            HStack {
                                ShareLink("Export", item: url)
                                Spacer()
                                Button("Review restore") { do { store.previewImport(try Data(contentsOf: url)) } catch { store.message = error.localizedDescription } }
                            }.frame(minHeight: 44)
                        }
                    }
                }
                Section("How to play") {
                    Text("Harvest wheat → mill flour → bake bread → ship cargo. Your first shipment funds fishing or olives. Extend the quay, choose a town direction, and complete two different contracts to establish a charter. The chapter objective guides the rest of the campaign.")
                    Text("Drag to move around the town. Pinch to zoom, or use the zoom buttons. Tap a site to inspect it. The Explore and Sites menus provide the same access without gestures.")
                    Text("Use Town for contracts, fleet, neighbourhood, ferry, production targets, reservations and the Living Harbour journal. Choices change the town’s appearance; seasonal decisions never generate free currency or goods.")
                }
                Section("About this build") {
                    Text("Little Harbour · painted native preview 0.2.0").font(.headline)
                    Text("Everything you need to play is included. No account or internet connection is required. Your town stays on this device; export a backup to keep an independent copy.")
                    Text("Painted Mediterranean terrain and individual buildings are layered over your living town. Sound design, physical-device performance certification and App Store release preparation remain in development.").font(.footnote)
                }
            }.scrollContentBackground(.hidden).background(HarbourTheme.paper).tint(HarbourTheme.sea).navigationTitle("Settings & saves").toolbar { Button("Done") { dismiss() } }
            .safeAreaInset(edge: .bottom) { FeedbackBanner() }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json], allowsMultipleSelection: false) { result in
                do {
                    guard let url = try result.get().first else { return }
                    let access = url.startAccessingSecurityScopedResource(); defer { if access { url.stopAccessingSecurityScopedResource() } }
                    let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                    guard size <= 150_000 else { throw HarbourError.message("Choose a save under 150 KB.") }
                    store.previewImport(try Data(contentsOf: url))
                } catch { store.message = error.localizedDescription }
            }
            .alert("Replace this town?", isPresented: Binding(get: { store.pendingImport != nil }, set: { if !$0 { store.pendingImport = nil } })) {
                Button("Import with backup", role: .destructive) { store.confirmImport(); reloadBackups() }
                Button("Cancel", role: .cancel) { store.pendingImport = nil }
            } message: { Text(store.importSummary) }
            .onAppear { reloadBackups() }
        }
    }
    private func prepareExport(original: Bool = false, browser: Bool = false) {
        do { exportURL = try store.export(original: original, browser: browser) } catch { store.message = error.localizedDescription }
    }
    private func reloadBackups() { do { backups = try store.saves.backupFiles() } catch { store.message = error.localizedDescription } }
}
