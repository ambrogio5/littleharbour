import SwiftUI

@main struct LittleHarbourApp: App {
    @StateObject private var store = GameStore()
    var body: some Scene { WindowGroup { HarbourView().environmentObject(store).preferredColorScheme(.light) } }
}
