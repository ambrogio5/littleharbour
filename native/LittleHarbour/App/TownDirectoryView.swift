import SwiftUI

struct TownDirectoryView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.verticalSizeClass) private var heightClass
    @State private var search = ""
    @State private var lastDrag: TimeInterval = -.infinity
    let onSelect: (String) -> Void
    private var columns: [GridItem] { [GridItem(.adaptive(minimum: typeSize.isAccessibilitySize ? 280 : heightClass == .compact ? 240 : 150), spacing: 10)] }
    private func available(_ names: [String]) -> [String] {
        names.filter { category in
            let exists = ["Goals", "Ambitions", "Journal"].contains(category) || store.snapshot?.categories.contains(category) == true
            return exists && (search.isEmpty || (title(category) + " " + HarbourTheme.caption(category)).localizedCaseInsensitiveContains(search))
        }
    }
    private func title(_ category: String) -> String {
        ["Goals": "Goals · harbour year", "Festival": "Harbour festival", "Ambitions": "Town ambitions", "Journal": "Town journal"][category] ?? category
    }
    private func identifier(_ category: String) -> String {
        ["Goals": "town-goals", "Festival": "town-festival", "Ambitions": "town-ambitions"][category] ?? category
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if search.isEmpty {
                        Text(typeSize.isAccessibilitySize ? "Choose an activity." : "Choose a place to work, or return to your current goal. Production, Trade and Build are always on the main dock.")
                            .font(.subheadline).foregroundStyle(HarbourTheme.muted)
                    }
                    group("Your living town", ["Goals", "Fleet", "Festival", "Ambitions", "Journal", "Contracts", "Neighbourhood", "Ferry"])
                    group("Grow the town", ["Waterfront", "Market", "Inland", "Lighthouse", "Destinations", "Residents", "Town layout"])
                    group("Manage work", ["Queues", "Refits", "Reservations"])
                    if !search.isEmpty && available(["Goals", "Fleet", "Festival", "Ambitions", "Journal", "Contracts", "Neighbourhood", "Ferry", "Waterfront", "Market", "Inland", "Lighthouse", "Destinations", "Residents", "Town layout", "Queues", "Refits", "Reservations"]).isEmpty {
                        Text("No matching activities. Try boats, market or projects.").font(.subheadline)
                    }
                }.padding(16)
            }.simultaneousGesture(DragGesture(minimumDistance: 8)
                .onChanged { _ in lastDrag = ProcessInfo.processInfo.systemUptime }
                .onEnded { _ in lastDrag = ProcessInfo.processInfo.systemUptime })
                .accessibilityIdentifier("town-activity-grid").background(HarbourTheme.paper).foregroundStyle(HarbourTheme.ink).tint(HarbourTheme.sea)
                .searchable(text: $search, prompt: "Find an activity")
                .navigationTitle("Town activities").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }
    @ViewBuilder private func group(_ heading: String, _ categories: [String]) -> some View {
        let items = available(categories)
        if !items.isEmpty {
            Text(heading).font(.system(.headline, design: .serif))
            LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
                ForEach(items, id: \.self) { category in
                    Button {
                        // Some older SwiftUI versions finish a plain button tap along
                        // with the enclosing scroll gesture. A drag must never navigate.
                        guard ProcessInfo.processInfo.systemUptime - lastDrag > 0.2 else { return }
                        onSelect(category)
                    } label: {
                        tile(category).frame(maxWidth: .infinity, minHeight: heightClass == .compact ? 64 : 160, alignment: .topLeading)
                            .padding(12).background(HarbourTheme.surface, in: RoundedRectangle(cornerRadius: 16))
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(HarbourTheme.sea.opacity(0.15)))
                    }.buttonStyle(.plain).accessibilityLabel(title(category)).accessibilityHint(HarbourTheme.caption(category)).accessibilityIdentifier(identifier(category))
                }
            }
        }
    }
    @ViewBuilder private func tile(_ category: String) -> some View {
        if typeSize.isAccessibilitySize {
            HStack(alignment: .center, spacing: 10) {
                Image(uiImage: HarbourArtwork.image(HarbourTheme.artwork(category))).resizable().scaledToFit().frame(width: 44, height: 44).accessibilityHidden(true)
                Text(title(category)).font(.headline).fixedSize(horizontal: false, vertical: true)
            }
        } else if heightClass == .compact {
            HStack(alignment: .center, spacing: 10) {
                Image(uiImage: HarbourArtwork.image(HarbourTheme.artwork(category))).resizable().scaledToFit().frame(width: 52, height: 52).accessibilityHidden(true)
                tileText(category)
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Image(uiImage: HarbourArtwork.image(HarbourTheme.artwork(category))).resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: typeSize.isAccessibilitySize ? 72 : 82).accessibilityHidden(true)
                tileText(category)
            }
        }
    }
    private func tileText(_ category: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title(category)).font(.system(.headline, design: .serif)).fixedSize(horizontal: false, vertical: true)
            Text(HarbourTheme.caption(category)).font(.caption).foregroundStyle(HarbourTheme.muted).fixedSize(horizontal: false, vertical: true)
        }
    }
}
