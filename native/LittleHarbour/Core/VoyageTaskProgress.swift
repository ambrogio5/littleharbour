import Foundation

/// A read-only projection of trips the engine has actually registered for a task.
struct VoyageTaskProgress {
    struct Row: Identifiable {
        enum State { case complete, travelling, available, busy }
        let id: Int
        let state: State
        let detail: String
        let left: Double?
        let progress: Double?
    }
    let rows: [Row]
    let complete: Bool
    let waiting: Bool
    let boatsNeeded: Int
    let missingRoutes: [String]
    let preferredSlot: Int?
    let preferredRoute: String
    let pendingCount: Int

    init(boats: [Boat?], used: [Int], eligible: [Int], visited: [String], missions: [(route: String, passengers: Bool)], requiredRoutes: [String]) {
        let missing = requiredRoutes.filter { !visited.contains($0) }
        let pending = boats.indices.filter { slot in
            guard eligible.contains(slot), let trip = boats[slot]?.trip else { return false }
            return missions.contains { $0.route == trip.route && $0.passengers == (trip.ferry == true) }
        }
        let projectedBoats = Set(used + pending)
        let projectedRoutes = Set(visited + pending.compactMap { boats[$0]?.trip?.route })
        complete = Set(used).count >= 2 && missing.isEmpty
        waiting = !complete && projectedBoats.count >= 2 && requiredRoutes.allSatisfy { projectedRoutes.contains($0) }
        boatsNeeded = max(0, 2 - projectedBoats.count)
        missingRoutes = missing
        pendingCount = pending.filter { !used.contains($0) || missing.contains(boats[$0]?.trip?.route ?? "") }.count
        preferredRoute = missing.first(where: { !projectedRoutes.contains($0) }) ?? missing.first ?? missions.first?.route ?? "quarry"
        let unused = boats.indices.filter { boats[$0] != nil && !used.contains($0) }
        let idle = unused.first { boats[$0]?.trip == nil }
        // Once two boats count, a missing coast can be served by either one.
        let otherIdle = Set(used).count >= 2 ? boats.indices.first { boats[$0] != nil && boats[$0]?.trip == nil } : nil
        preferredSlot = waiting ? pending.first { !used.contains($0) || missing.contains(boats[$0]?.trip?.route ?? "") } : idle ?? otherIdle ?? unused.first ?? boats.indices.first { boats[$0] == nil }
        rows = boats.indices.compactMap { slot in
            guard let boat = boats[slot] else { return nil }
            let countsWhileTravelling = pending.contains(slot) && (!used.contains(slot) || missing.contains(boat.trip?.route ?? ""))
            if countsWhileTravelling, let trip = boat.trip {
                return Row(id: slot, state: .travelling, detail: "Counts on return · " + Self.destination(trip.route), left: trip.left, progress: trip.progress)
            }
            if used.contains(slot) { return Row(id: slot, state: .complete, detail: "This boat has already counted", left: nil, progress: nil) }
            if let trip = boat.trip { return Row(id: slot, state: .busy, detail: "Current trip does not count. Send a task mission after it returns.", left: trip.left, progress: trip.progress) }
            return Row(id: slot, state: .available, detail: "Ready to plan a task mission", left: nil, progress: nil)
        }
    }
    static func destination(_ route: String) -> String { ["quarry": "Pietra Cove", "island": "Olive Island", "city": "Porto Grande"][route] ?? route.capitalized }
}
