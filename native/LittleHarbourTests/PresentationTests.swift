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
        XCTAssertEqual(scene.cameraNode.position.x, 900, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.position.y, 1350, accuracy: 0.01)
        XCTAssertEqual(MapViewport.decode(preferences.data(forKey: "mapViewport"))?.region, "all")
    }
    func testCameraPreferencesRejectUnknownVersionsAndUnsafeCoordinates() throws {
        for value in [
            MapViewport(version: 2, x: 900, y: 1350, scale: 1, region: nil),
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
        XCTAssertEqual(scene.cameraNode.position, CGPoint(x: 900, y: 1350))
        XCTAssertEqual(announcedScale, 2)
    }

}
