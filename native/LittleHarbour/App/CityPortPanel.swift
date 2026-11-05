import SwiftUI

struct CityPortPanel: View {
    @EnvironmentObject private var store: GameStore
    private var actions: [HarbourAction] { store.snapshot?.actions.filter { $0.invocation?.0.hasPrefix("chronicleCity") == true && $0.category != "Fleet" } ?? [] }
    var body: some View {
        if let city = store.snapshot?.chronicle.city {
            VStack(alignment: .leading, spacing: 12) {
                Label("PORTO GRANDE", systemImage: "building.2.crop.circle").font(.caption.bold()).foregroundStyle(HarbourTheme.sea)
                Text("Beyond the familiar coast").font(.system(.title3, design: .serif, weight: .semibold))
                if city.unlocked {
                    Text("The harbour school has opened a city partnership. Send a coaster with Expanded hold, import glaze, and turn your town’s jars into decorated ceramics.").font(.caption)
                    HStack {
                        Label("\(city.glaze) glaze", systemImage: "drop.fill")
                        Spacer()
                        Label("\(city.ceramics) ceramics", systemImage: "cup.and.saucer.fill")
                    }.font(.subheadline.bold())
                    if city.jobLeft > 0 { ProgressView("Decorating · \(Int(ceil(city.jobLeft)))s", value: 30 - city.jobLeft, total: 30).font(.caption) }
                    Button("Choose a city boat") { store.chooseCityBoat() }.frame(minHeight: 44).accessibilityIdentifier("choose-city-boat")
                    ForEach(actions) { ManagementAction(action: $0) }
                    ForEach(Array(city.choices.enumerated()), id: \.offset) { i, choice in
                        Label(choice + (city.explored.contains(i) ? " · completed" : " · choose a boat in Fleet"), systemImage: city.explored.contains(i) ? "checkmark.seal" : "map").font(.caption)
                    }
                    Text(city.chapter == 3 ? "The Porto Lume collection has a permanent home in the city. Your expedition choices remain in the chronicle." : "Collection \(city.chapter + 1) of 3 · each collection opens the next expedition choice.").font(.caption).foregroundStyle(HarbourTheme.muted)
                } else {
                    Text("Complete the harbour school to meet the city’s potters and navigators. The new route uses your existing fleet and a new decorating chain.").font(.caption)
                }
            }.harbourCard()
        }
    }
}
