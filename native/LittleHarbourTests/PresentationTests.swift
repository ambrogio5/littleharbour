import XCTest
import UIKit
@testable import LittleHarbour

@MainActor final class PresentationTests: XCTestCase {
    func testSiteSelectionRoutesToUsefulWorkAndMatchesRecipeArguments() throws {
        let engine = try EngineRuntime()
        let url = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        try engine.load(Data(contentsOf: url))
        let s = try engine.snapshot()
        let recipes = ["mill":"mill", "bakery":"bakery", "fishing":"fishing", "olive":"press", "boatyard":"saw", "estate":"wine", "kiln":"tiles", "claypit":"clay"]
        for (id, recipe) in recipes {
            guard let entity = s.entities.first(where: { $0.id == id && $0.stage == "built" }) else { continue }
            XCTAssertEqual(entity.category, "Production", id)
            let action = HarbourAction(id: "[\"start\",[\"\(recipe)\"]]", category: "Production", title: "localized title", detail: "", reason: "", enabled: true, destructive: false, goal: nil)
            XCTAssertTrue(action.belongs(to: entity), id)
            let other = HarbourAction(id: "[\"start\",[\"unrelated\"]]", category: "Production", title: "", detail: "", reason: "", enabled: false, destructive: false, goal: nil)
            XCTAssertFalse(other.belongs(to: entity), id)
        }
        let fresh = try EngineRuntime().snapshot()
        XCTAssertEqual(fresh.entities.first { $0.id == "pier" }?.category, "Build")
        let mill = try XCTUnwrap(fresh.entities.first { $0.id == "mill" })
        let matching = fresh.actions.filter { $0.category == mill.category && $0.belongs(to: mill) }
        XCTAssertEqual(matching.count, 1)
        XCTAssertEqual(matching.first?.verb, "Start production")
    }
    func testFixedShoreRegistrationDoesNotMoveSavedNeighbourhoodPlots() throws {
        let s = try EngineRuntime().snapshot(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        for entity in s.entities where entity.id.hasPrefix("plot") {
            XCTAssertEqual(scene.mapPosition(entity).x, entity.x)
            XCTAssertEqual(scene.mapPosition(entity).y, 2700 - entity.y)
        }
        let pier = try XCTUnwrap(s.entities.first { $0.id == "pier" })
        XCTAssertEqual(scene.mapPosition(pier).x, 1150)
        XCTAssertEqual(scene.mapPosition(pier).y, 380)
    }
    func testPaintedStatesArePackagedDistinctAndTransparent() throws {
        func bytes(_ name: String) throws -> Data { try Data(contentsOf: XCTUnwrap(Bundle.main.url(forResource: name, withExtension: "png"))) }
        for kind in ["mill", "home", "boat", "field", "ferry"] {
            let image = try XCTUnwrap(UIImage(named: kind + "-built")?.cgImage)
            XCTAssertNotEqual(image.alphaInfo, .none)
            XCTAssertEqual(image.width, 384)
            XCTAssertNotEqual(try bytes(kind + "-unbuilt"), try bytes(kind + "-building"))
            XCTAssertNotEqual(try bytes(kind + "-building"), try bytes(kind + "-built"))
            XCTAssertNotEqual(try bytes(kind + "-built"), try bytes(kind + "-upgraded"))
        }
        XCTAssertNotEqual(try bytes("field-built"), try bytes("field-ripe"))
        XCTAssertNotNil(Bundle.main.url(forResource: "olive-tree", withExtension: "png"))
    }
    func testManualCameraSurvivesResizeAndRestoresWithoutChangingTown() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        let engine = try EngineRuntime(), snapshot = try engine.snapshot(), savedTown = try engine.save()
        let scene = HarbourScene(size: CGSize(width: 800, height: 1000))
        scene.configureViewport(preferences: preferences); scene.apply(snapshot, selected: nil)
        scene.focus("market"); scene.zoom(0.5); scene.pan(by: CGPoint(x: -80, y: 120)); scene.persistViewport()
        let position = scene.cameraNode.position, scale = scene.cameraNode.xScale
        scene.size = CGSize(width: 1000, height: 800)
        XCTAssertEqual(scene.cameraNode.position.x, position.x, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.position.y, position.y, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.xScale, scale, accuracy: 0.01)
        let restored = HarbourScene(size: CGSize(width: 800, height: 1000))
        restored.configureViewport(preferences: preferences); restored.apply(snapshot, selected: nil)
        XCTAssertEqual(restored.cameraNode.position.x, position.x, accuracy: 0.01)
        XCTAssertEqual(restored.cameraNode.position.y, position.y, accuracy: 0.01)
        XCTAssertEqual(restored.cameraNode.xScale, scale, accuracy: 0.01)
        XCTAssertEqual(try engine.save(), savedTown)
    }
    func testWholeTownRefitsAfterResizeAndBadPreferencesFallBack() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        preferences.set(Data("broken".utf8), forKey: "mapViewport")
        let scene = HarbourScene(size: CGSize(width: 800, height: 1000))
        scene.configureViewport(preferences: preferences); scene.apply(try EngineRuntime().snapshot(), selected: nil)
        XCTAssertEqual(MapViewport.decode(preferences.data(forKey: "mapViewport"))?.region, "inland")
        scene.focus("all"); let portraitScale = scene.cameraNode.xScale
        scene.size = CGSize(width: 1000, height: 500)
        XCTAssertGreaterThan(scene.cameraNode.xScale, portraitScale)
        XCTAssertEqual(scene.cameraNode.position.x, 550, accuracy: 0.01, "A wide whole-town view clamps to the registered surround without exposing its edge")
        XCTAssertEqual(scene.cameraNode.position.y, 1350, accuracy: 0.01)
        XCTAssertEqual(MapViewport.decode(preferences.data(forKey: "mapViewport"))?.region, "all")
    }
    func testCameraPreferencesRejectUnknownVersionsAndUnsafeCoordinates() throws {
        for value in [
            MapViewport(version: 4, x: 900, y: 1350, scale: 1, region: nil),
            MapViewport(version: 1, x: -1, y: 1350, scale: 1, region: nil),
            MapViewport(version: 1, x: 900, y: 1350, scale: 0, region: nil),
            MapViewport(version: 1, x: 900, y: 1350, scale: 1, region: "unknown")
        ] { XCTAssertNil(MapViewport.decode(try JSONEncoder().encode(value))) }
        XCTAssertNil(MapViewport.decode(Data(repeating: 32, count: 1025)))
        XCTAssertFalse(MapViewport(version: 1, x: .infinity, y: 1350, scale: 1, region: nil).isValid)
    }

    func testPausedCameraRestoresWhenLayoutArrivesAfterSnapshot() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        let viewport = MapViewport(version: 1, x: 900, y: 1350, scale: 2, region: nil)
        preferences.set(try JSONEncoder().encode(viewport), forKey: "mapViewport")
        let engine = try EngineRuntime(); try engine.call("speed", [0])
        let scene = HarbourScene(size: .zero)
        scene.configureViewport(preferences: preferences); scene.apply(try engine.snapshot(), selected: nil)
        var announcedScale: CGFloat?
        scene.onZoomChange = { announcedScale = $0 }
        scene.size = CGSize(width: 400, height: 700)
        XCTAssertEqual(scene.cameraNode.xScale, 2)
        XCTAssertEqual(scene.cameraNode.position.y, 1350, accuracy: 0.01)
        XCTAssertEqual(announcedScale, 2)
    }

    func testSelectedMapLabelWinsCollisionsRegardlessOfEntityOrder() {
        let overlapping = CGRect(x: 0, y: 0, width: 120, height: 40)
        let candidates: [MapLabelLayout.Candidate] = [
            .init(id: "ordinary", frame: overlapping, priority: 10),
            .init(id: "ready", frame: overlapping, priority: 20),
            .init(id: "selected", frame: overlapping, priority: 100),
            .init(id: "separate", frame: CGRect(x: 200, y: 0, width: 120, height: 40), priority: 10)
        ]
        XCTAssertEqual(MapLabelLayout.visible(candidates), ["selected", "separate"])
        XCTAssertEqual(MapLabelLayout.visible(Array(candidates.reversed())), ["selected", "separate"])
        XCTAssertEqual(MapLabelLayout.visible(Array(candidates.prefix(2))), ["ready"])
    }
    func testEveryEconomicResourceHasPackagedPaintedArtwork() throws {
        for item in Array(goodsNames.keys) + ["coins"] {
            let url = try XCTUnwrap(Bundle.main.url(forResource: "good-" + item, withExtension: "png"), item)
            let image = try XCTUnwrap(UIImage(contentsOfFile: url.path)?.cgImage)
            XCTAssertEqual(image.width, 192, item); XCTAssertEqual(image.height, 192, item)
            XCTAssertNotEqual(image.alphaInfo, .none, item)
        }
    }
    func testSiteDirectoryCameraTargetsTheActualBuilding() throws {
        let snapshot = try EngineRuntime().snapshot(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(snapshot, selected: nil); scene.focus("all")
        let mill = try XCTUnwrap(snapshot.entities.first { $0.id == "mill" })
        scene.focusSite(mill)
        XCTAssertLessThanOrEqual(scene.cameraNode.xScale, 1.6001)
        XCTAssertEqual(scene.cameraNode.position.x, scene.mapPosition(mill).x, accuracy: 0.01)
        // Keep the full viewport on the map if the site's centre is near an edge.
        XCTAssertLessThan(abs(scene.cameraNode.position.y - scene.mapPosition(mill).y), 560)
    }

    func testWiderMapMigratesOldViewportAndKeepsEconomyUnchanged() throws {
        let old = MapViewport(version: 1, x: 900, y: 1350, scale: 8, region: nil)
        XCTAssertEqual(MapViewport.decode(try JSONEncoder().encode(old)), old)
        let edge = MapViewport(version: 2, x: -250, y: 3000, scale: 16, region: nil)
        XCTAssertEqual(MapViewport.decode(try JSONEncoder().encode(edge)), edge)
        let engine = try EngineRuntime(), before = try engine.save()
        let scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertLessThanOrEqual(scene.cameraNode.position.y + scene.size.height * scene.cameraNode.yScale / 2, 2700.01, "Hillside shortcut must not expose a sea strip above the land")
        scene.zoom(100)
        XCTAssertEqual(scene.cameraNode.xScale, 4000 / 700, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.position.y, 1350, accuracy: 0.01)
        scene.zoom(0.01); scene.pan(by: CGPoint(x: 100000, y: 100000))
        XCTAssertGreaterThanOrEqual(scene.cameraNode.position.x - scene.size.width * scene.cameraNode.xScale / 2, -2450)
        XCTAssertLessThanOrEqual(scene.cameraNode.position.y + scene.size.height * scene.cameraNode.yScale / 2, 3350)
        XCTAssertEqual(try engine.save(), before)
    }
    func testPeopleFollowTownDevelopmentPauseAndReducedMotion() throws {
        let engine = try EngineRuntime(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertEqual(TownResident.routes(in: try engine.snapshot()).count, 2)
        let farmer = try XCTUnwrap(scene.world.childNode(withName: "resident-farmer")), initial = farmer.position
        scene.update(1); scene.update(1.1); XCTAssertNotEqual(farmer.position, initial)
        try engine.call("speed", [0]); scene.apply(try engine.snapshot(), selected: nil)
        let paused = farmer.position; scene.update(2); scene.update(3); XCTAssertEqual(farmer.position, paused)
        try engine.call("speed", [1]); scene.reduceMotion = true; scene.apply(try engine.snapshot(), selected: nil)
        let still = farmer.position; scene.update(4); scene.update(5); XCTAssertEqual(farmer.position, still)
        try engine.load(Data(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json"))))
        scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertGreaterThan(TownResident.routes(in: try engine.snapshot()).count, 2)
        XCTAssertNotNil(scene.world.childNode(withName: "resident-docker"))
        XCTAssertNotNil(scene.world.childNode(withName: "resident-trader"))
    }
    func testBuildingRoofsCanBeSelectedAndEmptySeaCannot() throws {
        let snapshot = try EngineRuntime().snapshot(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(snapshot, selected: nil); scene.zoom(0.2)
        let mill = try XCTUnwrap(snapshot.entities.first { $0.id == "mill" }), position = scene.mapPosition(mill)
        XCTAssertEqual(scene.site(at: CGPoint(x: position.x, y: position.y + 120))?.id, "mill")
        XCTAssertNil(scene.site(at: CGPoint(x: -250, y: -300)))
    }
    func testGuidePeopleAndDistinctFleetArtworkArePackaged() throws {
        var data = Set<Data>()
        for name in ["guide-elena", "person-farmer", "person-docker", "person-vendor", "vessel-cutter", "vessel-cutter-upgraded", "vessel-coaster", "vessel-coaster-upgraded"] {
            let url = try XCTUnwrap(Bundle.main.url(forResource: name, withExtension: "png"))
            let bytes = try Data(contentsOf: url); data.insert(bytes)
            let image = try XCTUnwrap(UIImage(data: bytes)?.cgImage)
            XCTAssertEqual(image.width, 512); XCTAssertNotEqual(image.alphaInfo, .none)
        }
        XCTAssertEqual(data.count, 8)
    }

}
