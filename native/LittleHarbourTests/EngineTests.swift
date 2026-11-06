import XCTest
import ImageIO
import UIKit
import JavaScriptCore
@testable import LittleHarbour

@MainActor final class EngineTests: XCTestCase {
    func testEarnedCrewAllocationsReplayAndOlderReaderProtectsVersionFive() throws {
        let bundle = Bundle(for: Self.self)
        let campaigns = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: "crews-campaigns", withExtension: "json")))) as? [[String: Any]])
        let bases = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: "city-campaigns", withExtension: "json")))) as? [[String: Any]])
        XCTAssertEqual(campaigns.count, 6)
        for campaign in campaigns {
            let runtime = try EngineRuntime()
            let index = try XCTUnwrap(campaign["baseIndex"] as? Int)
            try runtime.load(JSONSerialization.data(withJSONObject: XCTUnwrap(bases[index]["expected"])))
            for step in try XCTUnwrap(campaign["steps"] as? [[String: Any]]) {
                if let action = step["action"] as? String { XCTAssertTrue(try runtime.call("act", [action]).toBool(), action) }
                else if let args = step["crew"] as? [Any] { XCTAssertTrue(try runtime.call("assignCrew", args).toBool()) }
                else if let keys = step["targets"] as? [String] { XCTAssertTrue(try runtime.call("setTargets", [keys, 0]).toBool()) }
                else if let speed = step["speed"] as? Int { try runtime.call("speed", [speed]) }
                else if let ticks = step["ticks"] as? Int { for _ in 0..<ticks { try runtime.call("tick", [1]) } }
                else { let saved = try runtime.save(); try runtime.load(saved); XCTAssertEqual(try runtime.save(), saved) }
            }
            XCTAssertEqual(try JSONSerialization.jsonObject(with: runtime.save()) as? NSDictionary, campaign["expected"] as? NSDictionary)
            let snapshot = try runtime.snapshot(); XCTAssertEqual(snapshot.crews.unlocked, 2)
            if campaign["allocation"] as? String != "none" {
                let old = try XCTUnwrap(JSContext())
                old.evaluateScript(try String(contentsOf: XCTUnwrap(bundle.url(forResource: "legacy-engine-v16", withExtension: "js")), encoding: .utf8))
                let engine = try XCTUnwrap(old.objectForKeyedSubscript("Harbour")); let original = engine.invokeMethod("save", withArguments: [])?.toString()
                engine.invokeMethod("load", withArguments: [try XCTUnwrap(String(data: runtime.save(), encoding: .utf8))])
                XCTAssertNotNil(old.exception); old.exception = nil
                XCTAssertEqual(engine.invokeMethod("save", withArguments: [])?.toString(), original)
            }
        }
    }
    func testEarnedChronicleAndCityContinuationsReplayThroughJavaScriptCore() throws {
        let bundle = Bundle(for: Self.self)
        for (source, base) in [("chronicle-campaigns", "long-play-campaigns"), ("city-campaigns", "chronicle-campaigns")] {
            let campaigns = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: source, withExtension: "json")))) as? [[String: Any]])
            let bases = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: base, withExtension: "json")))) as? [[String: Any]])
            XCTAssertEqual(campaigns.count, 2)
            for (index, campaign) in campaigns.enumerated() {
                let runtime = try EngineRuntime()
                try runtime.load(JSONSerialization.data(withJSONObject: XCTUnwrap(bases[index]["expected"])))
                for step in try XCTUnwrap(campaign["steps"] as? [[String: Any]]) {
                    if let action = step["action"] as? String { XCTAssertTrue(try runtime.call("act", [action]).toBool(), action) }
                    else if let ticks = step["ticks"] as? Int { for _ in 0..<ticks { try runtime.call("tick", [1]) } }
                    else { let saved = try runtime.save(); try runtime.load(saved); XCTAssertEqual(try runtime.save(), saved) }
                }
                XCTAssertEqual(try JSONSerialization.jsonObject(with: runtime.save()) as? NSDictionary, campaign["expected"] as? NSDictionary)
                XCTAssertEqual(try runtime.snapshot().chronicle.projects.filter { $0.stage == 4 }.count, 8)
                if source == "city-campaigns" { XCTAssertEqual(try runtime.snapshot().chronicle.city.chapter, 3) }
            }
        }
    }
    func testEveryChronicleBranchAndConstructionTextureIsPackaged() throws {
        for name in ["mill", "bakery", "fishing", "olive", "boatyard", "estate", "kitchen", "kiln", "preserving", "weaver", "carpenter", "sailmaker"] {
            let url = try XCTUnwrap(Bundle.main.url(forResource: "advanced-" + name, withExtension: "png"))
            let source = try XCTUnwrap(CGImageSourceCreateWithURL(url as CFURL, nil))
            let image = try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, nil))
            XCTAssertEqual(image.width, 384); XCTAssertEqual(image.height, 384)
        }
        for name in ["restoration", "exhibition", "seawall", "belltower", "garden", "school", "regatta", "wintermarket"] {
            for suffix in ["", "-alternate", "-construction"] {
                let url = try XCTUnwrap(Bundle.main.url(forResource: "chronicle-" + name + suffix, withExtension: "png"))
                let source = try XCTUnwrap(CGImageSourceCreateWithURL(url as CFURL, nil))
                let image = try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, nil))
                XCTAssertEqual(image.width, 384); XCTAssertEqual(image.height, 384)
            }
        }
    }
    func testHarbourYearJavaScriptCorePersistenceAndPaidSupplies() throws {
        let runtime = try EngineRuntime()
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "long-play-ready", withExtension: "json"))
        try runtime.load(Data(contentsOf: url))
        XCTAssertTrue(try runtime.call("act", ["[\"chronicleBegin\",[]]"]).toBool())
        let year = try runtime.snapshot().chronicle
        XCTAssertTrue(year.started); XCTAssertEqual(year.offers.count, 3)
        let request = try XCTUnwrap(year.offers.first)
        let action = try JSONSerialization.data(withJSONObject: ["chronicleAccept", [request.id]])
        XCTAssertTrue(try runtime.call("act", [String(decoding: action, as: UTF8.self)]).toBool())
        XCTAssertEqual(try runtime.snapshot().chronicle.pin, request.goal)
        let saved = try runtime.save(); try runtime.load(saved); XCTAssertEqual(try runtime.save(), saved)
        try runtime.call("speed", [0]); let paused = try runtime.save(); try runtime.call("tick", [60]); XCTAssertEqual(try runtime.save(), paused)
        try runtime.call("speed", [3]); for _ in 0..<400 { try runtime.call("tick", [1]) }
        XCTAssertEqual(try runtime.snapshot().chronicle.season, "Summer")
        XCTAssertTrue(try runtime.snapshot().chronicle.offers.contains { $0.id == request.id && $0.accepted })
    }
    func testEarnedLongPlayInvestmentsReplayWithReloadsInJavaScriptCore() throws {
        let bundle = Bundle(for: Self.self)
        func rows(_ file: String) throws -> [[String: Any]] {
            try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: XCTUnwrap(bundle.url(forResource: file, withExtension: "json")))) as? [[String: Any]])
        }
        let bases = try rows("festival-campaigns"), campaigns = try rows("long-play-campaigns")
        XCTAssertEqual(campaigns.count, 2)
        for campaign in campaigns {
            let base = try XCTUnwrap(bases.first { $0["choice"] as? String == campaign["choice"] as? String })
            let engine = try EngineRuntime(); try engine.load(JSONSerialization.data(withJSONObject: XCTUnwrap(base["expected"])))
            var actions = 0, reloads = 0
            for step in try XCTUnwrap(campaign["steps"] as? [[String: Any]]) {
                if let action = step["action"] as? String { XCTAssertTrue(try engine.call("act", [action]).toBool(), action); actions += 1 }
                if let ticks = step["ticks"] as? Int { for _ in 0..<ticks { try engine.call("tick", [1]) } }
                if step["reload"] as? Bool == true { let bytes = try engine.save(); try engine.load(bytes); XCTAssertEqual(try engine.save(), bytes); reloads += 1 }
            }
            XCTAssertGreaterThan(actions, 500); XCTAssertGreaterThan(reloads, 30)
            XCTAssertEqual(try JSONSerialization.jsonObject(with: engine.save()) as? NSDictionary, campaign["expected"] as? NSDictionary)
            let snapshot = try engine.snapshot()
            XCTAssertEqual(snapshot.boats.compactMap { $0 }.count, 3)
            XCTAssertEqual(snapshot.berthCount, 3); XCTAssertFalse(snapshot.legacyBrowserAvailable)
            XCTAssertThrowsError(try engine.save(browser: true, legacy: true))
            let exported = try EngineRuntime(); try exported.load(engine.save(browser: true))
            XCTAssertEqual(try exported.snapshot().boats.compactMap { $0 }.count, 3)
            XCTAssertEqual(try exported.snapshot().festival.stage, 0)
        }
    }

    func testFrozenOldClientRejectsNewTownAndProtectsOriginalBytes() throws {
        let bundle = Bundle(for: Self.self), engine = try EngineRuntime()
        let bytes = try Data(contentsOf: XCTUnwrap(bundle.url(forResource: "long-play-ready", withExtension: "json")))
        try engine.load(bytes)
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let repository = SaveRepository(directory: directory)
        _ = try repository.read(); try repository.write(bytes)
        let context = try XCTUnwrap(JSContext())
        context.evaluateScript(try String(contentsOf: XCTUnwrap(bundle.url(forResource: "legacy-engine-v13", withExtension: "js")), encoding: .utf8))
        XCTAssertNil(context.exception)
        let old = try XCTUnwrap(context.objectForKeyedSubscript("Harbour"))
        old.invokeMethod("load", withArguments: [String(decoding: try XCTUnwrap(repository.read()), as: UTF8.self)])
        XCTAssertNotNil(context.exception, "The frozen build-13 reader must reject a schema-14 town")
        if context.exception != nil { repository.protect() }
        XCTAssertThrowsError(try repository.write(Data("{}".utf8)))
        XCTAssertEqual(try Data(contentsOf: repository.primary), bytes)
        XCTAssertEqual(try engine.snapshot().berthCount, 3)
    }

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
