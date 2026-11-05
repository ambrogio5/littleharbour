import SwiftUI

struct CoastLibraryView: View {
    @EnvironmentObject private var store: GameStore
    @State private var name = "A new harbour"
    @State private var coast = "rocky"
    @State private var townName = ""
    @State private var awning = "terracotta"
    @State private var album: [ChronicleState.Memory] = []
    var body: some View {
        List {
            Section("Your harbour") {
                TextField("Town name", text: $townName).accessibilityIdentifier("town-name-editor")
                Picker("Bakery awning", selection: $awning) {
                    Text("Terracotta").tag("terracotta"); Text("Sea teal").tag("teal"); Text("Warm cream").tag("cream")
                }
                Button("Save town identity") { store.updateIdentity(name: townName, awning: awning) }.disabled(townName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || store.protectedSave)
            }
            Section("Coast library") {
                Text("Your original harbour stays in its original save. Each new coast has its own town, clock and recovery backups. Switching coasts does not advance the others.").font(.footnote)
                ForEach(store.coastSlots) { slot in
                    Button { store.switchCoast(slot.id); refresh() } label: {
                        HStack {
                            VStack(alignment: .leading) { Text(slot.name).font(.headline); Text(slot.coast.capitalized).font(.caption) }
                            Spacer()
                            if slot.id == store.activeCoastID { Image(systemName: "checkmark.circle.fill") }
                        }.frame(minHeight: 44)
                    }.disabled(store.protectedSave).accessibilityIdentifier("coast-" + slot.id)
                }
            }
            Section("Start on another coast") {
                TextField("New harbour name", text: $name)
                Picker("Coastal character", selection: $coast) {
                    Text("Rocky coves").tag("rocky"); Text("Salt marsh").tag("marsh"); Text("Windward coast").tag("windy")
                }
                Text(coast == "rocky" ? "Stoneworking shapes seasonal supply requests. The shore has more sheltered rocky landings." : coast == "marsh" ? "Harvests and preserves shape seasonal requests. Garden terraces and wetland greenery frame the town." : "Passenger requests connect both shores, encouraging you to choose different routes for the two boats.").font(.footnote)
                Button("Create separate coast") { store.createCoast(name: name, coast: coast); refresh() }.disabled(store.protectedSave || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || store.coastSlots.count >= 16).accessibilityIdentifier("create-coast")
                Text("This creates a fresh town; it does not replace the current one.").font(.footnote)
            }
            Section("Memories from your coasts") {
                if album.isEmpty { Text("Completed requests and projects will appear here, with the coast where they happened.").font(.footnote) }
                ForEach(album) { memory in
                    VStack(alignment: .leading, spacing: 5) { Text(memory.title).font(.headline); Text(memory.body).font(.caption) }
                }
            }
        }.scrollContentBackground(.hidden).background(HarbourTheme.paper).tint(HarbourTheme.sea)
            .navigationTitle("Your coasts").navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom, spacing: 0) { FeedbackBanner() }
            .onAppear { refresh() }
    }
    private func refresh() {
        townName = store.snapshot?.chronicle.townName ?? "Porto Lume"
        awning = store.snapshot?.chronicle.awning ?? "terracotta"
        album = store.coastMemories
    }
}
