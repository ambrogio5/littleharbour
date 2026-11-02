import XCTest
import UIKit
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
    func testActualApplicationBundleContainsTerrainAndEverySiteTexture() throws {
        let engine = try EngineRuntime()
        XCTAssertNotNil(UIImage(named: "terrain"))
        for sample in [false, true] {
            try engine.call("reset", [sample])
            for entity in try engine.snapshot().entities {
                XCTAssertNotNil(UIImage(named: entity.texture), entity.texture)
            }
        }
        let url = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        try engine.load(Data(contentsOf: url))
        for entity in try engine.snapshot().entities { XCTAssertNotNil(UIImage(named: entity.texture), entity.texture) }
    }

    func testBundledQuayAndStorehouseUseOriginalCosts() throws {
        let engine = try EngineRuntime()
        var fixture = try XCTUnwrap(JSONSerialization.jsonObject(with: engine.save(browser: true)) as? [String: Any])
        fixture["coins"] = 1000; fixture["deliveries"] = 2
        fixture["expansion"] = "fishing"; fixture["businesses"] = ["fishing"]
        try engine.load(JSONSerialization.data(withJSONObject: fixture))
        XCTAssertTrue(try engine.call("act", ["[\"upgrade\",[]]"]).toBool())
        XCTAssertEqual(try engine.snapshot().coins, 860)
        try engine.call("tick", [8])
        XCTAssertTrue(try engine.call("act", ["[\"upgradeWorkshops\",[]]"]).toBool())
        let town = try engine.snapshot()
        XCTAssertEqual(town.coins, 740); XCTAssertEqual(town.stock["wood"], 6); XCTAssertEqual(town.stock["stone"], 4)
    }

    func testBothEarnedCampaignsReachCompletedFerryThroughJavaScriptCore() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "earned-campaigns", withExtension: "json"))
        let campaigns = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [[String: Any]])
        XCTAssertEqual(campaigns.count, 2)
        for campaign in campaigns {
            let engine = try EngineRuntime(), path = try XCTUnwrap(campaign["path"] as? String)
            let steps = try XCTUnwrap(campaign["steps"] as? [[String: Any]])
            for (index, step) in steps.enumerated() {
                if let action = step["action"] as? String {
                    XCTAssertTrue(try engine.call("act", [action]).toBool(), "\(path) step \(index): \(action)")
                } else if let ticks = step["ticks"] as? Int {
                    for _ in 0..<ticks { try engine.call("tick", [1]) }
                } else {
                    XCTAssertEqual(step["reload"] as? Bool, true)
                    let bytes = try engine.save(); try engine.load(bytes); XCTAssertEqual(try engine.save(), bytes)
                }
            }
            let actual = try XCTUnwrap(JSONSerialization.jsonObject(with: engine.save(browser: true)) as? NSDictionary)
            let expected = try XCTUnwrap(campaign["expectedTown"] as? NSDictionary)
            XCTAssertEqual(actual, expected, path + " preserves the earned browser economy through the entire campaign")
            XCTAssertEqual(try engine.snapshot().objective.chapter, 6)
        }
    }

    func testEarnedFestivalBranchesSurviveEveryStageInJavaScriptCore() throws {
        let bundle = Bundle(for: Self.self)
        let bases = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: "earned-campaigns", withExtension: "json")))) as? [[String: Any]])
        let campaigns = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: "festival-campaigns", withExtension: "json")))) as? [[String: Any]])
        for campaign in campaigns {
            let base = try XCTUnwrap(bases.first { $0["path"] as? String == campaign["path"] as? String })
            let engine = try EngineRuntime(); try engine.load(JSONSerialization.data(withJSONObject: XCTUnwrap(base["expectedTown"])))
            for step in try XCTUnwrap(campaign["steps"] as? [[String: Any]]) {
                if let action = step["action"] as? String { XCTAssertTrue(try engine.call("act", [action]).toBool(), action) }
                if let ticks = step["ticks"] as? Int { for _ in 0..<ticks { try engine.call("tick", [1]) } }
                if step["reload"] as? Bool == true { let save = try engine.save(); try engine.load(save); XCTAssertEqual(try engine.save(), save) }
            }
            XCTAssertEqual(try engine.snapshot().festival.stage, 4)
            XCTAssertEqual(try engine.snapshot().festival.orders, 2)
            XCTAssertEqual(try engine.snapshot().festival.choice, campaign["choice"] as? String)
            XCTAssertEqual(try JSONSerialization.jsonObject(with: engine.save()) as? NSDictionary, campaign["expected"] as? NSDictionary)
            let reimport = try EngineRuntime(); try reimport.load(engine.save(browser: true))
            XCTAssertEqual(try reimport.snapshot().festival.stage, 0, "Browser exports deliberately omit native festival progress")
        }
    }

    func testNativeTarget24MigrationAndBrowserExportKeepTownCompatible() throws {
        let engine = try EngineRuntime()
        try engine.load(Data(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json"))))
        XCTAssertTrue(try engine.call("act", ["[\"setTarget\",[\"mill\",24]]"]).toBool())
        let saved = try engine.save(); let restored = try EngineRuntime(); try restored.load(saved)
        XCTAssertEqual(try restored.snapshot().workshops["mill"]?.target, 24)
        let envelope = try XCTUnwrap(JSONSerialization.jsonObject(with: saved) as? [String: Any])
        XCTAssertEqual(envelope["nativeVersion"] as? Int, 2)
        let browser = try EngineRuntime(); try browser.load(restored.save(browser: true))
        XCTAssertEqual(try browser.snapshot().workshops["mill"]?.target, 12)
        XCTAssertEqual(try restored.save(), saved, "Exporting must not lower the live native target")
    }

}
