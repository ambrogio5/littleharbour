import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage(HarbourAppearance.preferenceKey) private var appearance = HarbourAppearance.system.rawValue
    @AppStorage("mapLabels") private var mapLabels = true
    @AppStorage("hapticFeedback") private var hapticFeedback = true
    @State private var showImporter = false
    @State private var showReplacement = false
    @State private var showPrivacy = false
    @State private var exportURL: URL?
    @State private var backups: [URL] = []
    var body: some View {
        NavigationStack {
            List {
                Section("Appearance") {
                    Picker("Colour scheme", selection: $appearance) {
                        ForEach(HarbourAppearance.allCases, id: \.rawValue) { option in Text(option.title).tag(option.rawValue) }
                    }.pickerStyle(.segmented).accessibilityIdentifier("appearance-picker")
                    Text("System follows your device. Dark uses softer map lighting and darker panels.").font(.footnote)
                    Text("\(Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? "Little Harbour") · \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "") (\(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""))").font(.caption).foregroundStyle(.secondary).accessibilityIdentifier("installed-build")
                }
                Section("Your town") {
                    NavigationLink("Town identity & coast library") { CoastLibraryView() }.accessibilityIdentifier("coast-library")
                    Text(store.protectedSave ? "Save protected · play paused" : "Saved on this device")
                    if let date = store.lastSaved { Text("Last saved \(date.formatted(date: .omitted, time: .shortened))").font(.caption) }
                    Text("Time pauses outside the app. There are no real-time deadlines or offline penalties. Autosaves run every 15 seconds and after actions.").font(.footnote)
                    Button("Export native town & evolution") { prepareExport() }
                    Button("Export for updated browser game") { prepareExport(browser: true) }.disabled(store.protectedSave)
                    Text("Browser exports omit crew assignments and their speed benefit (earned work remains), native seasons, relationships, chronicle projects, festival progress, city imports, ceramics and expeditions; active city cargo and queued jars are returned in the exported copy; reserved native supplies are returned in the exported copy. Crew-enabled towns need build 17 or newer. Keep a native backup for the complete town. New browser exports require the updated browser game with advanced investments.").font(.footnote)
                    Button("Export for older browser") { prepareExport(browser: true, legacy: true) }.disabled(store.protectedSave || store.snapshot?.legacyBrowserAvailable != true)
                    if store.snapshot?.legacyBrowserAvailable == false { Text("Older-browser export is unavailable because it would lose new investments or reservations. Keep a native backup for the complete town.").font(.footnote) }
                    if (store.snapshot?.festival.stage ?? 0) > 0 {
                        Text("Browser exports omit festival progress, decorations and new requests. Goods already contributed stay spent. Use a native export to keep the complete town.").font(.footnote)
                    }
                    if store.snapshot?.workshops.values.contains(where: { $0.target == 24 }) == true {
                        Text("Browser exports use Keep 12 for targets set to 24. Native exports preserve Keep 24.").font(.footnote)
                    }
                    if store.protectedSave { Button("Export exact original bytes") { prepareExport(original: true) } }
                    if let exportURL { ShareLink("Share exported save", item: exportURL).accessibilityIdentifier("share-save") }
                    Button("Import a town…") { store.cancelImport(); showImporter = true }
                    Button("Start a new town…") { store.previewNewTown() }.accessibilityIdentifier("new-town")
                }
                Section("Make yourself at home") {
                    Toggle("Building labels", isOn: $mapLabels)
                    Toggle("Gentle haptic feedback", isOn: $hapticFeedback)
                    Text("The map respects Reduce Motion. Text follows your device’s text size. Explore and Sites offer alternatives to map gestures.").font(.footnote)
                }
                Section("Privacy & support") {
                    Button("Privacy policy") { showPrivacy = true }
                    Link("Get help or report a problem", destination: URL(string: "https://github.com/ambrogio5/littleharbour/issues")!)
                    Text("Support opens the public project issue tracker in your browser. Include the app version and steps to reproduce a problem.").font(.footnote)
                }
                Section("Recovery backups") {
                    Text("Every imported replacement and the first save after loading preserve an exact copy of the original. Backups stay on this device. Export copies for safekeeping.").font(.footnote)
                    if backups.isEmpty { Text("No device backups yet.").foregroundStyle(.secondary) }
                    ForEach(backups, id: \.self) { url in
                        VStack(alignment: .leading) {
                            Text(SaveRepository.backupDate(url)?.formatted(date: .abbreviated, time: .standard) ?? "Earlier recovery copy").font(.headline)
                            HStack {
                                ShareLink("Export", item: url)
                                Spacer()
                                Button("Review restore") { do { store.previewImport(try SaveRepository.readDocument(url)) } catch { store.message = error.localizedDescription } }
                            }.frame(minHeight: 44)
                        }
                    }
                }
                Section("How to play") {
                    Text("Harvest wheat → mill flour → bake bread → ship cargo. Your first shipment funds fishing or olives. Extend the quay, choose a town direction, and complete two different contracts to establish a charter. The chapter objective guides the rest of the campaign.")
                    Text("Drag to move around the town. Pinch to zoom, or use the zoom buttons. Tap a site to inspect it. Explore and the searchable Sites directory provide the same access without gestures.")
                    Text("Use Town for contracts, fleet, neighbourhood, ferry, production targets, reservations and the Living Harbour journal. Choices change the town’s appearance; seasonal decisions never generate free currency or goods.")
                }
                Section("About this build") {
                    Text("Little Harbour · \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "") (\(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""))").font(.headline)
                    Text("Everything you need to play is included. No account or internet connection is required. Your town stays on this device; export a backup to keep an independent copy.")
                    Text("Built for unhurried play: no advertising, in-app purchases, account or online services. Your device may include app data in its system backups, according to your backup settings.").font(.footnote)
                }
            }.scrollContentBackground(.hidden).background(HarbourTheme.paper).tint(HarbourTheme.sea).navigationTitle("Settings & saves").toolbar { Button("Done") { store.cancelImport(); dismiss() } }
            .safeAreaInset(edge: .bottom, spacing: 0) { FeedbackBanner() }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json], allowsMultipleSelection: false) { result in
                do {
                    guard let url = try result.get().first else { return }
                    let access = url.startAccessingSecurityScopedResource(); defer { if access { url.stopAccessingSecurityScopedResource() } }
                    store.previewImport(try SaveRepository.readDocument(url))
                } catch { store.message = error.localizedDescription }
            }
            .onChange(of: store.pendingImport) { _, value in showReplacement = value != nil }
            .alert("Replace this town?", isPresented: $showReplacement) {
                Button("Replace with backup", role: .destructive) { store.confirmImport(); reloadBackups() }
                Button("Cancel", role: .cancel) { store.cancelImport() }
            } message: { Text(store.importSummary) }
            .onAppear { reloadBackups() }
            .navigationDestination(isPresented: $showPrivacy) { PrivacyView() }
        }
    }
    private func prepareExport(original: Bool = false, browser: Bool = false, legacy: Bool = false) {
        do { exportURL = try store.export(original: original, browser: browser, legacy: legacy) } catch { store.message = error.localizedDescription }
    }
    private func reloadBackups() { do { backups = try store.saves.backupFiles() } catch { store.message = error.localizedDescription } }
}

private struct PrivacyView: View {
    private let policy = Bundle.main.url(forResource: "Privacy-policy", withExtension: "txt")
        .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? "The privacy policy could not be opened. Please contact support."
    var body: some View {
        ScrollView {
            Text(policy).font(.body).frame(maxWidth: 650, alignment: .leading).padding(24).textSelection(.enabled)
        }.background(HarbourTheme.paper).foregroundStyle(HarbourTheme.ink).navigationTitle("Privacy policy").navigationBarTitleDisplayMode(.inline)
    }
}
