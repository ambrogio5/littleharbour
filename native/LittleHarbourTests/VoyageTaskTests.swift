import XCTest
@testable import LittleHarbour

final class VoyageTaskTests: XCTestCase {
    private func boat(_ route: String? = nil, ferry: Bool = true) -> Boat {
        Boat(repeat: nil, type: "cutter", upgrade: nil, sails: nil, trip: route.map { Boat.Trip(left: 30, duration: 90, route: $0, ferry: ferry) })
    }
    private func progress(_ boats: [Boat?], used: [Int] = [], eligible: [Int] = [], visited: [String] = [], routes: [String] = []) -> VoyageTaskProgress {
        VoyageTaskProgress(boats: boats, used: used, eligible: eligible, visited: visited, missions: [("quarry", true), ("island", true)], requiredRoutes: routes)
    }
    func testEarlierTripsAndWrongMissionDoNotCountAsPending() {
        let p = progress([boat("quarry"), boat("island", ferry: false)], eligible: [1])
        XCTAssertFalse(p.waiting); XCTAssertEqual(p.boatsNeeded, 2); XCTAssertEqual(p.pendingCount, 0)
        XCTAssertTrue(p.rows.allSatisfy { $0.state == .busy })
    }
    func testTwoRegisteredTripsWaitInsteadOfRequestingAnotherBoat() {
        let p = progress([boat("quarry"), boat("island"), boat()], eligible: [0, 1])
        XCTAssertTrue(p.waiting); XCTAssertFalse(p.complete); XCTAssertEqual(p.boatsNeeded, 0)
        XCTAssertEqual(p.pendingCount, 2); XCTAssertEqual(p.preferredSlot, 0)
    }
    func testAlreadyCountedBoatCannotReplaceSecondBoat() {
        let p = progress([boat("quarry"), boat()], used: [0], eligible: [0], visited: ["quarry"])
        XCTAssertFalse(p.waiting); XCTAssertEqual(p.boatsNeeded, 1); XCTAssertEqual(p.preferredSlot, 1)
        XCTAssertEqual(p.rows[0].state, .complete)
    }
    func testWindyCoastRequiresBothShoresAndCanUseCountedBoatForMissingShore() {
        let p = progress([boat(), boat(), nil], used: [0, 1], visited: ["quarry"], routes: ["quarry", "island"])
        XCTAssertFalse(p.complete); XCTAssertFalse(p.waiting); XCTAssertEqual(p.preferredSlot, 0); XCTAssertEqual(p.preferredRoute, "island")
        let underway = progress([boat("island"), boat()], used: [0, 1], eligible: [0], visited: ["quarry"], routes: ["quarry", "island"])
        XCTAssertTrue(underway.waiting); XCTAssertEqual(underway.rows[0].state, .travelling)
        XCTAssertTrue(progress([boat(), boat()], used: [0, 1], visited: ["quarry", "island"], routes: ["quarry", "island"]).complete)
    }
    func testRecallRemovesPendingAndProjectMixedMissionsRequireCorrectCargoType() {
        let p = progress([boat(), boat("island")], eligible: [1])
        XCTAssertFalse(p.waiting); XCTAssertEqual(p.boatsNeeded, 1)
        let project = VoyageTaskProgress(boats: [boat("quarry", ferry: false), boat("island")], used: [], eligible: [0, 1], visited: [], missions: [("quarry", false), ("island", true)], requiredRoutes: ["quarry", "island"])
        XCTAssertTrue(project.waiting)
    }
}
