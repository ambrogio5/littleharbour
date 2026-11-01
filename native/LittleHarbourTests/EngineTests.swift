import XCTest
@testable import LittleHarbour

@MainActor final class EngineTests: XCTestCase {
    func testRealOpeningThroughConstructionAndEvolution() throws {
        let engine = try EngineRuntime()
        func action(_ fn: String, _ args: [Any] = []) throws {
            let data = try JSONSerialization.data(withJSONObject: [fn, args], options: [.fragmentsAllowed, .sortedKeys])
            let id = String(data: data, encoding: .utf8)!
            // JSONSerialization adds escaped slashes only for string args with slashes, absent here.
            XCTAssertTrue(try engine.call("act", [id]).toBool(), id)
        }
        XCTAssertEqual(try engine.snapshot().entities.filter { $0.stage == "built" }.count, 3)
        try action("harvestReplant")
        try action("start", ["mill"]); try action("start", ["mill"])
        try engine.call("tick", [16]); try action("start", ["bakery"]); try action("start", ["bakery"])
        try engine.call("tick", [24]); try action("dispatch")
        let traded = try engine.snapshot(); XCTAssertEqual(traded.deliveries, 1); XCTAssertGreaterThan(traded.evolution.axes["trade"]!, 30)
        try action("build", ["fishing"])
        XCTAssertEqual(try engine.snapshot().entities.first { $0.id == "fishing" }?.stage, "building")
        let bytes = try engine.save(); let loaded = try EngineRuntime(); try loaded.load(bytes)
        XCTAssertEqual(try loaded.snapshot().entities.first { $0.id == "fishing" }?.stage, "building")
        try loaded.call("tick", [8])
        XCTAssertEqual(try loaded.snapshot().entities.first { $0.id == "fishing" }?.stage, "built")
        XCTAssertNotEqual(try loaded.snapshot().entities.first { $0.id == "mill" }?.texture, try loaded.snapshot().entities.first { $0.id == "bakery" }?.texture)
    }
    func testEnvelopeRoundtripAndBrowserCompatibility() throws {
        let a = try EngineRuntime(); try a.call("reset", [true])
        let saved = try a.save(); let b = try EngineRuntime(); try b.load(saved)
        XCTAssertEqual(try a.save(), try b.save())
        let browser = try b.save(browser: true); let c = try EngineRuntime(); try c.load(browser)
        XCTAssertEqual(try c.snapshot().coins, try b.snapshot().coins)
        XCTAssertEqual(try c.snapshot().objective.chapter, 3)
    }
    func testRejectedFutureAndInvalidImportLeaveLiveTownUntouched() throws {
        let engine = try EngineRuntime(), before = try engine.save()
        for input in ["", "{", "{\"version\":99}", "{\"nativeVersion\":2}", "{\"nativeVersion\":1,\"town\":{},\"evolution\":{}}"] {
            XCTAssertThrowsError(try engine.load(Data(input.utf8)))
            XCTAssertEqual(try engine.save(), before)
        }
        XCTAssertFalse(try engine.call("act", ["[\"build\",[\"fishing\"]]"]).toBool())
        XCTAssertEqual(try engine.save(), before)
    }
    func testPauseHasNoOfflineProgress() throws {
        let engine = try EngineRuntime(); try engine.call("speed", [0]); let before = try engine.save()
        try engine.call("tick", [60]); XCTAssertEqual(try engine.save(), before)
    }
    func testAllSnapshotStatesDecodeIncludingLateFleetNeighbourhoodAndFerry() throws {
        let engine = try EngineRuntime()
        // Fixture built by actual engine actions in the cross-runtime test generator.
        let url = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        try engine.load(Data(contentsOf: url))
        let s = try engine.snapshot(); XCTAssertTrue(s.categories.contains("Ferry")); XCTAssertTrue(s.categories.contains("Neighbourhood"))
        XCTAssertEqual(s.entities.first { $0.id == "ferry" }?.stage, "built")
        XCTAssertTrue(s.actions.contains { $0.title.contains("passenger service") && $0.enabled })
        let ferry = s.actions.first { $0.title.contains("passenger service") && $0.enabled }!
        XCTAssertTrue(try engine.call("act", [ferry.id]).toBool()); try engine.call("tick", [60])
        let data = try engine.save(); let reloaded = try EngineRuntime(); try reloaded.load(data)
        XCTAssertEqual(try reloaded.save(), data)
    }
}
