import SwiftUI

@main struct LittleHarbourApp: App {
    @StateObject private var store = GameStore()
    @AppStorage(HarbourAppearance.preferenceKey) private var appearance = HarbourAppearance.system.rawValue
    var body: some Scene { WindowGroup { HarbourView().environmentObject(store).preferredColorScheme((HarbourAppearance(rawValue: appearance) ?? .system).colorScheme) } }
}
